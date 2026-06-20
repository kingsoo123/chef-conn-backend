import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

const SORT_OPTIONS = [
  'recommended',
  'rating',
  'reviews',
  'price-asc',
  'price-desc',
] as const;

const PRICE_RANGE_OPTIONS = [
  'all',
  'under-200',
  '200-400',
  '400-600',
  '600-plus',
] as const;

function parseCsv(value: unknown): string[] | undefined {
  if (typeof value !== 'string' || !value.trim()) {
    return undefined;
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  return value === 'true' || value === '1';
}

export class ChefSearchDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Transform(({ value }) => parseCsv(value))
  areas?: string[];

  @IsOptional()
  @Transform(({ value }) => parseCsv(value))
  specialties?: string[];

  @IsOptional()
  @Transform(({ value }) => parseCsv(value))
  services?: string[];

  @IsOptional()
  @Transform(({ value }) => parseCsv(value))
  experience?: string[];

  @IsOptional()
  @IsIn(PRICE_RANGE_OPTIONS)
  priceRange?: (typeof PRICE_RANGE_OPTIONS)[number];

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsNumber()
  @Min(0)
  priceMin?: number;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsNumber()
  @Min(0)
  priceMax?: number;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @IsOptional()
  @Transform(({ value }) => parseBoolean(value))
  @IsBoolean()
  availableOnly?: boolean;

  @IsOptional()
  @IsIn(SORT_OPTIONS)
  sort?: (typeof SORT_OPTIONS)[number];

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? 1 : Number(value)))
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? 24 : Number(value)))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
