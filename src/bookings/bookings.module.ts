import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AvailabilityModule } from '../availability/availability.module';
import { ChefProfile } from '../chefs/chef-profile.entity';
import { Booking } from './booking.entity';
import { BookingsService } from './bookings.service';
import { ChefBookingsController } from './chef-bookings.controller';
import { GuestBookingsController } from './guest-bookings.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, ChefProfile]),
    AuthModule,
    AvailabilityModule,
  ],
  controllers: [GuestBookingsController, ChefBookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
