import {
  Body,
  Controller,
  Get,
  Header,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ChefAuthGuard } from '../auth/guards/chef-auth.guard';
import { CurrentUser } from '../supabase/decorators/current-user.decorator';
import { AvailabilityService } from './availability.service';
import { SyncExternalCalendarDto } from './dto/sync-external-calendar.dto';
import { UpdateChefAvailabilityDto } from './dto/update-chef-availability.dto';

@Controller('auth/chef/availability')
@UseGuards(ChefAuthGuard)
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get()
  getAvailability(@CurrentUser() user: { id: string }) {
    return this.availabilityService.getForChef(user.id);
  }

  @Patch()
  updateAvailability(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateChefAvailabilityDto,
  ) {
    return this.availabilityService.updateForChef(user.id, dto);
  }

  @Post('sync-external-calendar')
  syncExternalCalendar(
    @CurrentUser() user: { id: string },
    @Body() dto: SyncExternalCalendarDto,
  ) {
    return this.availabilityService.syncExternalCalendar(
      user.id,
      dto.externalCalendarUrl,
    );
  }

  @Post('regenerate-calendar-token')
  regenerateCalendarToken(@CurrentUser() user: { id: string }) {
    return this.availabilityService.regenerateCalendarFeedToken(user.id);
  }

  @Get('calendar.ics')
  @Header('Content-Type', 'text/calendar; charset=utf-8')
  async downloadCalendar(
    @CurrentUser() user: { id: string },
    @Res() response: Response,
  ) {
    const feed = await this.availabilityService.getCalendarFeedForChef(user.id);
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="uber-chef-calendar.ics"',
    );
    response.send(feed);
  }
}
