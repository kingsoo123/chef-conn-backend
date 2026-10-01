import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { TrackActivityDto } from './dto/track-activity.dto';

@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Post('track')
  @HttpCode(202)
  async track(@Body() dto: TrackActivityDto) {
    const event = await this.activityService.track(dto);
    return { accepted: true, id: event.id };
  }
}
