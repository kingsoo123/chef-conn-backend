import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityModule } from '../activity/activity.module';
import { ActivityEvent } from '../activity/activity-event.entity';
import { AuthModule } from '../auth/auth.module';
import { Subscription } from '../billing/subscription.entity';
import { Booking } from '../bookings/booking.entity';
import { ChefProfile } from '../chefs/chef-profile.entity';
import { User } from '../users/user.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ActivityEvent,
      Subscription,
      Booking,
      User,
      ChefProfile,
    ]),
    ActivityModule,
    AuthModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
