import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Booking } from '../bookings/booking.entity';
import { ChefProfile } from '../chefs/chef-profile.entity';
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';
import { CalendarFeedController } from './calendar-feed.controller';
import { ChefBlockedDate } from './chef-blocked-date.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChefProfile, ChefBlockedDate, Booking]),
    AuthModule,
  ],
  controllers: [AvailabilityController, CalendarFeedController],
  providers: [AvailabilityService],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}
