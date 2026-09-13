import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { CreateCheckoutDto } from './dto/checkout.dto';
import { FlutterwaveClient } from './flutterwave.client';
import {
  addBillingPeriod,
  getPlan,
  getPlanAmount,
  type BillingAudience,
  type BillingInterval,
  type PlanId,
} from './plans';
import { Subscription } from './subscription.entity';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionsRepository: Repository<Subscription>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly flutterwaveClient: FlutterwaveClient,
  ) {}

  async createCheckout(
    dto: CreateCheckoutDto,
    authUser?: { id: string; email?: string } | null,
  ) {
    const amount = getPlanAmount(dto.audience, dto.planId, dto.billing);
    const plan = getPlan(dto.audience, dto.planId);

    if (!amount || !plan) {
      throw new BadRequestException('Unknown plan selection');
    }

    const email = dto.email.trim().toLowerCase();
    const currency = process.env.FLUTTERWAVE_CURRENCY?.trim() || 'NGN';
    const publicWebUrl =
      process.env.PUBLIC_WEB_URL?.replace(/\/$/, '') || 'http://localhost:3000';

    let userId: string | null = authUser?.id ?? null;
    if (!userId) {
      const existing = await this.usersRepository.findOne({
        where: { email },
      });
      userId = existing?.id ?? null;
    }

    const txRef = `uc-${dto.audience}-${dto.planId}-${dto.billing}-${randomUUID()}`;

    const subscription = this.subscriptionsRepository.create({
      userId,
      email,
      customerName: dto.customerName.trim(),
      audience: dto.audience,
      planId: dto.planId,
      billingInterval: dto.billing,
      amount,
      currency,
      status: 'pending',
      txRef,
    });

    await this.subscriptionsRepository.save(subscription);

    const paymentLink = await this.flutterwaveClient.createPaymentLink({
      txRef,
      amount,
      currency,
      redirectUrl: `${publicWebUrl}/checkout/success`,
      customer: {
        email,
        name: dto.customerName.trim(),
        phonenumber: dto.phone?.trim() || undefined,
      },
      meta: {
        subscriptionId: subscription.id,
        audience: dto.audience,
        planId: dto.planId,
        billing: dto.billing,
        userId,
      },
      title: `Uber-chef ${plan.name}`,
      description: `${dto.audience === 'chef' ? 'Chef' : 'User'} ${plan.name} (${dto.billing})`,
    });

    return {
      subscriptionId: subscription.id,
      txRef,
      amount,
      currency,
      paymentLink,
      plan: {
        id: plan.id,
        name: plan.name,
        audience: dto.audience,
        billing: dto.billing,
      },
    };
  }

  async verifyPayment(input: {
    transactionId?: string;
    txRef?: string;
  }) {
    if (!input.transactionId && !input.txRef) {
      throw new BadRequestException('transactionId or txRef is required');
    }

    if (input.transactionId) {
      const verified = await this.flutterwaveClient.verifyTransaction(
        input.transactionId,
      );

      if (verified.status !== 'successful') {
        return this.markFailed(verified.tx_ref, verified.id?.toString() ?? null);
      }

      return this.activateFromFlutterwave({
        txRef: verified.tx_ref ?? input.txRef ?? '',
        transactionId: verified.id?.toString() ?? input.transactionId,
        flwRef: verified.flw_ref ?? null,
        amount: verified.amount,
        currency: verified.currency,
      });
    }

    const subscription = await this.subscriptionsRepository.findOne({
      where: { txRef: input.txRef },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return this.toPublicSubscription(subscription);
  }

  async handleWebhook(payload: Record<string, unknown>, verifHash?: string) {
    const expected = process.env.FLUTTERWAVE_WEBHOOK_HASH?.trim();
    if (expected && verifHash !== expected) {
      this.logger.warn('Rejected Flutterwave webhook with invalid verif-hash');
      throw new BadRequestException('Invalid webhook signature');
    }

    const event = String(payload.event ?? '');
    const data = (payload.data ?? {}) as Record<string, unknown>;
    const status = String(data.status ?? '');
    const txRef = String(data.tx_ref ?? '');
    const transactionId =
      data.id != null ? String(data.id) : data.tx_id != null ? String(data.tx_id) : null;
    const flwRef = data.flw_ref != null ? String(data.flw_ref) : null;
    const amount = typeof data.amount === 'number' ? data.amount : undefined;
    const currency =
      typeof data.currency === 'string' ? data.currency : undefined;

    if (!txRef) {
      return { received: true, ignored: true };
    }

    if (
      status === 'successful' ||
      event === 'charge.completed' ||
      event === 'subscription.activated'
    ) {
      await this.activateFromFlutterwave({
        txRef,
        transactionId,
        flwRef,
        amount,
        currency,
      });
      return { received: true, activated: true };
    }

    if (status === 'failed' || status === 'cancelled') {
      await this.markFailed(txRef, transactionId);
      return { received: true, failed: true };
    }

    return { received: true };
  }

  private async activateFromFlutterwave(input: {
    txRef: string;
    transactionId: string | null;
    flwRef: string | null;
    amount?: number;
    currency?: string;
  }) {
    const subscription = await this.subscriptionsRepository.findOne({
      where: { txRef: input.txRef },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found for payment');
    }

    if (subscription.status === 'active') {
      return this.toPublicSubscription(subscription);
    }

    if (
      input.amount != null &&
      Math.round(input.amount) !== subscription.amount
    ) {
      this.logger.warn(
        `Amount mismatch for ${input.txRef}: expected ${subscription.amount}, got ${input.amount}`,
      );
      throw new BadRequestException('Payment amount does not match plan');
    }

    if (
      input.currency &&
      input.currency.toUpperCase() !== subscription.currency.toUpperCase()
    ) {
      throw new BadRequestException('Payment currency does not match plan');
    }

    const now = new Date();
    subscription.status = 'active';
    subscription.flwTransactionId = input.transactionId;
    subscription.flwFlwRef = input.flwRef;
    subscription.paidAt = now;
    subscription.currentPeriodStart = now;
    subscription.currentPeriodEnd = addBillingPeriod(
      now,
      subscription.billingInterval as BillingInterval,
    );

    if (!subscription.userId) {
      const user = await this.usersRepository.findOne({
        where: { email: subscription.email },
      });
      subscription.userId = user?.id ?? null;
    }

    await this.subscriptionsRepository.save(subscription);
    return this.toPublicSubscription(subscription);
  }

  private async markFailed(txRef: string | undefined, transactionId: string | null) {
    if (!txRef) {
      throw new NotFoundException('Missing tx_ref');
    }

    const subscription = await this.subscriptionsRepository.findOne({
      where: { txRef },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status !== 'active') {
      subscription.status = 'failed';
      subscription.flwTransactionId = transactionId;
      await this.subscriptionsRepository.save(subscription);
    }

    return this.toPublicSubscription(subscription);
  }

  private toPublicSubscription(subscription: Subscription) {
    const plan = getPlan(
      subscription.audience as BillingAudience,
      subscription.planId as PlanId,
    );

    return {
      id: subscription.id,
      status: subscription.status,
      email: subscription.email,
      audience: subscription.audience,
      planId: subscription.planId,
      planName: plan?.name ?? subscription.planId,
      billingInterval: subscription.billingInterval,
      amount: subscription.amount,
      currency: subscription.currency,
      txRef: subscription.txRef,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      paidAt: subscription.paidAt,
    };
  }
}
