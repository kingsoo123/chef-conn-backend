import {
  IsEmail,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

const SOURCES = ['web', 'mobile', 'system', 'admin'] as const;

export class TrackActivityDto {
  @IsString()
  @MaxLength(80)
  type: string;

  @IsOptional()
  @IsIn(SOURCES)
  source?: (typeof SOURCES)[number];

  @IsOptional()
  @IsUUID()
  actorUserId?: string;

  @IsOptional()
  @IsEmail()
  actorEmail?: string;

  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  summary?: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}
