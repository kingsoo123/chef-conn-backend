import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, LessThan, Repository } from 'typeorm';
import { ActivityService } from '../activity/activity.service';
import { ActivityEvent } from '../activity/activity-event.entity';
import { Subscription } from '../billing/subscription.entity';
import { Booking } from '../bookings/booking.entity';
import { ChefProfile } from '../chefs/chef-profile.entity';
import { User } from '../users/user.entity';

const ABANDONED_PAYMENT_MINUTES = 30;

type OverviewCounts = {
  total_events: string;
  web_events: string;
  mobile_events: string;
  location_changes: string;
  events_today: string;
  abandoned_payments: string;
  pending_checkouts: string;
  failed_payments: string;
  completed_payments: string;
  bookings: string;
  bookings_this_week: string;
  total_users: string;
  total_hosts: string;
  total_chefs: string;
  total_admins: string;
  users_this_week: string;
  chefs_this_week: string;
  hosts_this_week: string;
  chef_profiles: string;
  chefs_approved: string;
  chefs_pending_review: string;
  chefs_unavailable: string;
};

@Injectable()
export class AdminService {
  constructor(
    private readonly activityService: ActivityService,
    private readonly dataSource: DataSource,
    @InjectRepository(ActivityEvent)
    private readonly activityRepository: Repository<ActivityEvent>,
    @InjectRepository(Subscription)
    private readonly subscriptionsRepository: Repository<Subscription>,
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(ChefProfile)
    private readonly chefProfilesRepository: Repository<ChefProfile>,
  ) {}

  async getOverview() {
    const abandonedCutoff = this.abandonedCutoff();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // One SQL round-trip for counters — Neon poolers fail under 20+ parallel counts.
    const countsPromise = this.dataSource.query(
      `
      SELECT
        (SELECT COUNT(*)::int FROM activity_events) AS total_events,
        (SELECT COUNT(*)::int FROM activity_events WHERE source = 'web') AS web_events,
        (SELECT COUNT(*)::int FROM activity_events WHERE source = 'mobile') AS mobile_events,
        (SELECT COUNT(*)::int FROM activity_events WHERE type = 'location_changed') AS location_changes,
        (SELECT COUNT(*)::int FROM activity_events WHERE created_at >= $1) AS events_today,
        (SELECT COUNT(*)::int FROM subscriptions WHERE status = 'pending' AND created_at < $2) AS abandoned_payments,
        (SELECT COUNT(*)::int FROM subscriptions WHERE status = 'pending') AS pending_checkouts,
        (SELECT COUNT(*)::int FROM subscriptions WHERE status = 'failed') AS failed_payments,
        (SELECT COUNT(*)::int FROM subscriptions WHERE status = 'active') AS completed_payments,
        (SELECT COUNT(*)::int FROM bookings) AS bookings,
        (SELECT COUNT(*)::int FROM bookings WHERE created_at >= $3) AS bookings_this_week,
        (SELECT COUNT(*)::int FROM users WHERE role <> 'admin') AS total_users,
        (SELECT COUNT(*)::int FROM users WHERE role = 'host') AS total_hosts,
        (SELECT COUNT(*)::int FROM users WHERE role = 'chef') AS total_chefs,
        (SELECT COUNT(*)::int FROM users WHERE role = 'admin') AS total_admins,
        (SELECT COUNT(*)::int FROM users WHERE role <> 'admin' AND created_at >= $3) AS users_this_week,
        (SELECT COUNT(*)::int FROM users WHERE role = 'chef' AND created_at >= $3) AS chefs_this_week,
        (SELECT COUNT(*)::int FROM users WHERE role = 'host' AND created_at >= $3) AS hosts_this_week,
        (SELECT COUNT(*)::int FROM chef_profiles) AS chef_profiles,
        (SELECT COUNT(*)::int FROM chef_profiles WHERE status = 'approved') AS chefs_approved,
        (SELECT COUNT(*)::int FROM chef_profiles WHERE status = 'pending_review') AS chefs_pending_review,
        (SELECT COUNT(*)::int FROM chef_profiles WHERE is_available = false) AS chefs_unavailable
      `,
      [
        dayAgo.toISOString(),
        abandonedCutoff.toISOString(),
        weekAgo.toISOString(),
      ],
    ) as Promise<OverviewCounts[]>;

    const recentUsersPromise = this.usersRepository
      .createQueryBuilder('user')
      .where('user.role != :admin', { admin: 'admin' })
      .orderBy('user.created_at', 'DESC')
      .take(6)
      .getMany();

    const recentChefsPromise = this.chefProfilesRepository
      .createQueryBuilder('chef')
      .leftJoinAndSelect('chef.user', 'user')
      .orderBy('chef.created_at', 'DESC')
      .take(6)
      .getMany();

    const [countsRows, recentUsers, recentChefs] = await Promise.all([
      countsPromise,
      recentUsersPromise,
      recentChefsPromise,
    ]);

    const counts = countsRows[0] ?? ({} as OverviewCounts);
    const n = (value: string | number | undefined) => Number(value ?? 0);

    const totalUsers = n(counts.total_users);
    const totalHosts = n(counts.total_hosts);
    const totalChefs = n(counts.total_chefs);

    return {
      census: {
        users: totalUsers,
        hosts: totalHosts,
        chefs: totalChefs,
        chefProfiles: n(counts.chef_profiles),
        chefsApproved: n(counts.chefs_approved),
        chefsPendingReview: n(counts.chefs_pending_review),
        chefsUnavailable: n(counts.chefs_unavailable),
        admins: n(counts.total_admins),
        usersThisWeek: n(counts.users_this_week),
        chefsThisWeek: n(counts.chefs_this_week),
        hostsThisWeek: n(counts.hosts_this_week),
      },
      totals: {
        events: n(counts.total_events),
        eventsToday: n(counts.events_today),
        webEvents: n(counts.web_events),
        mobileEvents: n(counts.mobile_events),
        locationChanges: n(counts.location_changes),
        abandonedPayments: n(counts.abandoned_payments),
        pendingCheckouts: n(counts.pending_checkouts),
        failedPayments: n(counts.failed_payments),
        completedPayments: n(counts.completed_payments),
        bookings: n(counts.bookings),
        bookingsThisWeek: n(counts.bookings_this_week),
        users: totalUsers,
        hosts: totalHosts,
        chefs: totalChefs,
      },
      recentUsers: recentUsers.map((user) => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt,
      })),
      recentChefs: recentChefs.map((profile) => ({
        id: profile.id,
        displayName: profile.displayName,
        slug: profile.slug,
        status: profile.status,
        areas: profile.areas,
        isAvailable: profile.isAvailable,
        email: profile.user?.email ?? null,
        createdAt: profile.createdAt,
      })),
      abandonedAfterMinutes: ABANDONED_PAYMENT_MINUTES,
    };
  }

  async listUsers(query: { role?: string; limit?: number; offset?: number }) {
    const limit = Math.min(Math.max(query.limit ?? 50, 1), 200);
    const offset = Math.max(query.offset ?? 0, 0);

    const qb = this.usersRepository
      .createQueryBuilder('user')
      .where('user.role != :admin', { admin: 'admin' })
      .orderBy('user.created_at', 'DESC')
      .take(limit)
      .skip(offset);

    if (query.role === 'host' || query.role === 'chef') {
      qb.andWhere('user.role = :role', { role: query.role });
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      total,
      limit,
      offset,
      data: items.map((user) => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      })),
    };
  }

  async listChefs(query: {
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const limit = Math.min(Math.max(query.limit ?? 50, 1), 200);
    const offset = Math.max(query.offset ?? 0, 0);

    const qb = this.chefProfilesRepository
      .createQueryBuilder('chef')
      .leftJoinAndSelect('chef.user', 'user')
      .orderBy('chef.created_at', 'DESC')
      .take(limit)
      .skip(offset);

    if (query.status) {
      qb.andWhere('chef.status = :status', { status: query.status });
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      total,
      limit,
      offset,
      data: items.map((profile) => ({
        id: profile.id,
        displayName: profile.displayName,
        slug: profile.slug,
        status: profile.status,
        experience: profile.experience,
        specialties: profile.specialties,
        services: profile.services,
        areas: profile.areas,
        pricePerDay: profile.pricePerDay,
        rating: Number(profile.rating),
        reviewCount: profile.reviewCount,
        isAvailable: profile.isAvailable,
        email: profile.user?.email ?? null,
        firstName: profile.user?.firstName ?? null,
        lastName: profile.user?.lastName ?? null,
        createdAt: profile.createdAt,
      })),
    };
  }

  async listActivities(query: {
    type?: string;
    source?: string;
    limit?: number;
    offset?: number;
  }) {
    return this.activityService.list(query);
  }

  async listAbandonedPayments(limit = 50) {
    const safeLimit = Math.min(Math.max(limit, 1), 200);
    const cutoff = this.abandonedCutoff();

    const subscriptions = await this.subscriptionsRepository.find({
      where: {
        status: 'pending',
        createdAt: LessThan(cutoff),
      },
      order: { createdAt: 'DESC' },
      take: safeLimit,
    });

    for (const subscription of subscriptions) {
      const existing = await this.activityRepository
        .createQueryBuilder('event')
        .where('event.type = :type', { type: 'payment_abandoned' })
        .andWhere(`event.payload->>'subscriptionId' = :subscriptionId`, {
          subscriptionId: subscription.id,
        })
        .getOne();

      if (!existing) {
        await this.activityService.record({
          type: 'payment_abandoned',
          source: 'system',
          actorUserId: subscription.userId,
          actorEmail: subscription.email,
          title: 'Payment abandoned',
          summary: `${subscription.customerName} left checkout for ${subscription.planId} (${subscription.billingInterval})`,
          payload: {
            subscriptionId: subscription.id,
            txRef: subscription.txRef,
            audience: subscription.audience,
            planId: subscription.planId,
            billingInterval: subscription.billingInterval,
            amount: subscription.amount,
            currency: subscription.currency,
            pendingSince: subscription.createdAt.toISOString(),
          },
        });
      }
    }

    return {
      abandonedAfterMinutes: ABANDONED_PAYMENT_MINUTES,
      data: subscriptions.map((subscription) => ({
        id: subscription.id,
        email: subscription.email,
        customerName: subscription.customerName,
        audience: subscription.audience,
        planId: subscription.planId,
        billingInterval: subscription.billingInterval,
        amount: subscription.amount,
        currency: subscription.currency,
        txRef: subscription.txRef,
        userId: subscription.userId,
        createdAt: subscription.createdAt,
        pendingMinutes: Math.floor(
          (Date.now() - subscription.createdAt.getTime()) / 60000,
        ),
      })),
    };
  }

  async listLocationChanges(limit = 50) {
    return this.activityService.list({
      type: 'location_changed',
      limit,
      offset: 0,
    });
  }

  async listRecentPayments(limit = 50) {
    const safeLimit = Math.min(Math.max(limit, 1), 200);
    const subscriptions = await this.subscriptionsRepository.find({
      order: { createdAt: 'DESC' },
      take: safeLimit,
    });

    return {
      data: subscriptions.map((subscription) => ({
        id: subscription.id,
        email: subscription.email,
        customerName: subscription.customerName,
        audience: subscription.audience,
        planId: subscription.planId,
        billingInterval: subscription.billingInterval,
        amount: subscription.amount,
        currency: subscription.currency,
        status: subscription.status,
        txRef: subscription.txRef,
        paidAt: subscription.paidAt,
        createdAt: subscription.createdAt,
      })),
    };
  }

  private abandonedCutoff() {
    return new Date(Date.now() - ABANDONED_PAYMENT_MINUTES * 60 * 1000);
  }
}
