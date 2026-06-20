import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import type { ServiceSchedules } from '../availability.constants';

class DayAvailabilityDto {
  @IsBoolean()
  enabled: boolean;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  endTime: string;
}

class WeeklyScheduleDto {
  @ValidateNested()
  @Type(() => DayAvailabilityDto)
  monday: DayAvailabilityDto;

  @ValidateNested()
  @Type(() => DayAvailabilityDto)
  tuesday: DayAvailabilityDto;

  @ValidateNested()
  @Type(() => DayAvailabilityDto)
  wednesday: DayAvailabilityDto;

  @ValidateNested()
  @Type(() => DayAvailabilityDto)
  thursday: DayAvailabilityDto;

  @ValidateNested()
  @Type(() => DayAvailabilityDto)
  friday: DayAvailabilityDto;

  @ValidateNested()
  @Type(() => DayAvailabilityDto)
  saturday: DayAvailabilityDto;

  @ValidateNested()
  @Type(() => DayAvailabilityDto)
  sunday: DayAvailabilityDto;
}

export class UpdateChefAvailabilityDto {
  @IsBoolean()
  isAvailable: boolean;

  @ValidateNested()
  @Type(() => WeeklyScheduleDto)
  weeklySchedule: WeeklyScheduleDto;

  @IsOptional()
  @IsObject()
  serviceSchedules?: ServiceSchedules;

  @IsOptional()
  @IsUrl({}, { message: 'Enter a valid calendar URL' })
  @MaxLength(500)
  externalCalendarUrl?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsDateString({}, { each: true })
  blockedDates?: string[];
}
