import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class ChefUpdateAccountDto {
  @IsString()
  @MinLength(1)
  firstName: string;

  @IsString()
  @MinLength(1)
  lastName: string;

  @IsString()
  @MinLength(1)
  phone: string;
}

export class ChefUpdateProfileDto {
  @IsString()
  @MinLength(1)
  displayName: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  specialties: string[];

  @IsString()
  @MinLength(1)
  experience: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  services: string[];

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  areas: string[];

  @IsString()
  @MinLength(20)
  @MaxLength(1000)
  bio: string;
}

export class ChefUpdateProfileRequestDto {
  @ValidateNested()
  @Type(() => ChefUpdateAccountDto)
  account: ChefUpdateAccountDto;

  @ValidateNested()
  @Type(() => ChefUpdateProfileDto)
  profile: ChefUpdateProfileDto;
}
