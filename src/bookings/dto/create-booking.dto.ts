import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateBookingDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  hostName: string;

  @IsOptional()
  @IsEmail()
  hostEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  hostPhone?: string;

  @IsString()
  @MinLength(1)
  service: string;

  @IsDateString()
  eventDate: string;

  @IsString()
  @MinLength(1)
  @MaxLength(40)
  eventTime: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  guestCount: number;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  country: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  state?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(300)
  address: string;

  @IsString()
  @MaxLength(2000)
  notes: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  budget?: number;
}
