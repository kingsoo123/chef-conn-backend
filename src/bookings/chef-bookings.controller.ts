import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ChefAuthGuard } from '../auth/guards/chef-auth.guard';
import { CurrentUser } from '../supabase/decorators/current-user.decorator';
import { BookingsService } from './bookings.service';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

@Controller('auth/chef/bookings')
@UseGuards(ChefAuthGuard)
export class ChefBookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  list(
    @CurrentUser() user: { id: string },
    @Query('since') since?: string,
  ) {
    return this.bookingsService.listForChef(user.id, since);
  }

  @Patch(':bookingId')
  updateStatus(
    @CurrentUser() user: { id: string },
    @Param('bookingId') bookingId: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateStatusForChef(user.id, bookingId, dto);
  }
}
