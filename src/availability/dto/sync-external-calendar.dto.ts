import { IsOptional, IsUrl, MaxLength } from 'class-validator';

export class SyncExternalCalendarDto {
  @IsOptional()
  @IsUrl({}, { message: 'Enter a valid calendar URL' })
  @MaxLength(500)
  externalCalendarUrl?: string;
}
