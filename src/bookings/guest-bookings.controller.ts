import { Body, Controller, Param, Post } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller('chefs/:slug/bookings')
export class GuestBookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(@Param('slug') slug: string, @Body() dto: CreateBookingDto) {
    return this.bookingsService.createForChefSlug(slug, dto);
  }
}
