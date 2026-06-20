import { Controller, Get, Header, NotFoundException, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AvailabilityService } from './availability.service';

@Controller('calendar')
export class CalendarFeedController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get(':token.ics')
  @Header('Content-Type', 'text/calendar; charset=utf-8')
  async getPublicFeed(@Param('token') token: string, @Res() response: Response) {
    try {
      const feed = await this.availabilityService.getCalendarFeedForToken(token);
      response.setHeader('Cache-Control', 'public, max-age=300');
      response.send(feed);
    } catch {
      throw new NotFoundException('Calendar feed not found');
    }
  }
}
