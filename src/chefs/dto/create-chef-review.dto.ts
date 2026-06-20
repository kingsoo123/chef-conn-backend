import { Type } from 'class-transformer';
import { IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateChefReviewDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  reviewerName: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  comment: string;
}
