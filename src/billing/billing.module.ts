import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityModule } from '../activity/activity.module';
import { AuthModule } from '../auth/auth.module';
import { User } from '../users/user.entity';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { FlutterwaveClient } from './flutterwave.client';
import { Subscription } from './subscription.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, User]),
    AuthModule,
    ActivityModule,
  ],
  controllers: [BillingController],
  providers: [BillingService, FlutterwaveClient],
  exports: [BillingService],
})
export class BillingModule {}
