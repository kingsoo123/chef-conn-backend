import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { In, Repository } from 'typeorm';
import { Booking } from '../bookings/booking.entity';
import { ChefProfile } from '../chefs/chef-profile.entity';
import {
  normalizeServiceSchedules,
  normalizeWeeklySchedule,
  type ServiceAvailabilityWindow,
  type ServiceSchedules,
  type WeeklySchedule,
} from './availability.constants';
import { assertBookingSlotAvailable } from './availability-validation';
import { ChefBlockedDate } from './chef-blocked-date.entity';
import { UpdateChefAvailabilityDto } from './dto/update-chef-availability.dto';
import { buildChefCalendarFeed, extractBusyDatesFromIcs } from './ical.utils';

function formatBlockedDateLabel(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`));
}

function assertValidSchedule(schedule: WeeklySchedule) {
  for (const [day, value] of Object.entries(schedule)) {
    if (!value.enabled) continue;

    if (value.startTime >= value.endTime) {
      throw new BadRequestException(
        `${day} end time must be after the start time`,
      );
    }
  }
}

function assertValidServiceSchedules(schedules: ServiceSchedules) {
  for (const [serviceId, value] of Object.entries(schedules)) {
    if (!value.enabled) continue;

    if (value.startTime >= value.endTime) {
      throw new BadRequestException(
        `${serviceId} service end time must be after the start time`,
      );
    }
  }
}

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(ChefProfile)
    private readonly chefProfilesRepository: Repository<ChefProfile>,
    @InjectRepository(ChefBlockedDate)
    private readonly blockedDatesRepository: Repository<ChefBlockedDate>,
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
  ) {}

  async getForChef(userId: string) {
    const profile = await this.findChefProfileForUser(userId);
    return this.buildAvailabilityResponse(profile);
  }

  async updateForChef(userId: string, dto: UpdateChefAvailabilityDto) {
    const profile = await this.findChefProfileForUser(userId);
    const weeklySchedule = normalizeWeeklySchedule(dto.weeklySchedule);
    const serviceSchedules = normalizeServiceSchedules(
      profile.services,
      dto.serviceSchedules as ServiceSchedules | undefined,
    );

    assertValidSchedule(weeklySchedule);
    assertValidServiceSchedules(serviceSchedules);

    profile.isAvailable = dto.isAvailable;
    profile.weeklySchedule = weeklySchedule;
    profile.serviceSchedules = serviceSchedules;

    if (dto.externalCalendarUrl !== undefined) {
      profile.externalCalendarUrl = dto.externalCalendarUrl?.trim() || null;
    }

    await this.ensureCalendarFeedToken(profile);
    await this.chefProfilesRepository.save(profile);

    if (dto.blockedDates) {
      await this.syncBlockedDates(profile.id, dto.blockedDates);
    }

    return this.buildAvailabilityResponse(profile);
  }

  async syncExternalCalendar(userId: string, externalCalendarUrl?: string) {
    const profile = await this.findChefProfileForUser(userId);
    const calendarUrl =
      externalCalendarUrl?.trim() || profile.externalCalendarUrl?.trim();

    if (!calendarUrl) {
      throw new BadRequestException('Add an external calendar URL first.');
    }

    const response = await fetch(calendarUrl, {
      headers: { Accept: 'text/calendar' },
    });

    if (!response.ok) {
      throw new BadRequestException(
        'Could not fetch the external calendar feed.',
      );
    }

    const icsContent = await response.text();
    const importedDates = extractBusyDatesFromIcs(icsContent);
    const manualBlockedDates = await this.listBlockedDates(profile.id);
    const mergedDates = [...new Set([...manualBlockedDates, ...importedDates])]
      .sort();

    profile.externalCalendarUrl = calendarUrl;
    profile.calendarSyncedAt = new Date();
    await this.ensureCalendarFeedToken(profile);
    await this.chefProfilesRepository.save(profile);
    await this.syncBlockedDates(profile.id, mergedDates);

    return this.buildAvailabilityResponse(profile);
  }

  async getCalendarFeedForToken(token: string) {
    const profile = await this.chefProfilesRepository.findOne({
      where: { calendarFeedToken: token },
    });

    if (!profile) {
      throw new NotFoundException('Calendar feed not found');
    }

    return this.buildCalendarFeed(profile);
  }

  async getCalendarFeedForChef(userId: string) {
    const profile = await this.findChefProfileForUser(userId);
    await this.ensureCalendarFeedToken(profile);

    return this.buildCalendarFeed(profile);
  }

  async regenerateCalendarFeedToken(userId: string) {
    const profile = await this.findChefProfileForUser(userId);
    profile.calendarFeedToken = randomUUID().replace(/-/g, '');
    await this.chefProfilesRepository.save(profile);

    return this.buildAvailabilityResponse(profile);
  }

  async validateBookingForProfile(
    profile: ChefProfile,
    input: {
      service: string;
      eventDate: string;
      eventTime: string;
    },
  ) {
    const blockedDates = await this.listBlockedDates(profile.id);

    assertBookingSlotAvailable({
      isAvailable: profile.isAvailable,
      weeklySchedule: profile.weeklySchedule as WeeklySchedule | null,
      serviceSchedules: normalizeServiceSchedules(
        profile.services,
        profile.serviceSchedules as ServiceSchedules | null,
      ),
      blockedDates,
      service: input.service,
      eventDate: input.eventDate,
      eventTime: input.eventTime,
    });
  }

  async listBlockedDates(chefProfileId: string) {
    const rows = await this.blockedDatesRepository.find({
      where: { chefProfileId },
      order: { blockedDate: 'ASC' },
    });

    return rows.map((row) => row.blockedDate);
  }

  private async buildAvailabilityResponse(profile: ChefProfile) {
    await this.ensureCalendarFeedToken(profile);

    const blockedDates = await this.listBlockedDates(profile.id);
    const appBaseUrl =
      process.env.APP_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';

    return {
      isAvailable: profile.isAvailable,
      weeklySchedule: normalizeWeeklySchedule(
        profile.weeklySchedule as WeeklySchedule | null,
      ),
      serviceSchedules: normalizeServiceSchedules(
        profile.services,
        profile.serviceSchedules as ServiceSchedules | null,
      ),
      blockedDates: blockedDates.map((date) => ({
        date,
        label: formatBlockedDateLabel(date),
      })),
      externalCalendarUrl: profile.externalCalendarUrl,
      calendarSyncedAt: profile.calendarSyncedAt?.toISOString() ?? null,
      calendarFeedToken: profile.calendarFeedToken,
      calendarFeedUrl: profile.calendarFeedToken
        ? `${appBaseUrl}/api/calendar/${profile.calendarFeedToken}.ics`
        : null,
      calendarDownloadUrl: '/api/auth/chef/availability/calendar.ics',
    };
  }

  private async buildCalendarFeed(profile: ChefProfile) {
    const blockedDates = await this.listBlockedDates(profile.id);
    const bookings = await this.bookingsRepository.find({
      where: {
        chefProfileId: profile.id,
        status: In(['new', 'awaiting_response', 'confirmed']),
      },
      order: { eventDate: 'ASC' },
      take: 200,
    });

    return buildChefCalendarFeed({
      chefName: profile.displayName,
      blockedDates,
      bookings: bookings.map((booking) => ({
        id: booking.id,
        eventDate: booking.eventDate,
        eventTime: booking.eventTime,
        hostName: booking.hostName,
        service: booking.service,
        status: booking.status,
      })),
    });
  }

  private async syncBlockedDates(chefProfileId: string, blockedDates: string[]) {
    const normalized = [...new Set(blockedDates)].sort();

    await this.blockedDatesRepository.delete({ chefProfileId });

    if (normalized.length === 0) {
      return;
    }

    const rows = normalized.map((blockedDate) =>
      this.blockedDatesRepository.create({
        chefProfileId,
        blockedDate,
      }),
    );

    await this.blockedDatesRepository.save(rows);
  }

  private async ensureCalendarFeedToken(profile: ChefProfile) {
    if (!profile.calendarFeedToken) {
      profile.calendarFeedToken = randomUUID().replace(/-/g, '');
      await this.chefProfilesRepository.save(profile);
    }
  }

  private async findChefProfileForUser(userId: string) {
    const profile = await this.chefProfilesRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Chef profile not found');
    }

    return profile;
  }
}
