import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  Equals,
  IsArray,
  IsEmail,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class ChefSignupAccountDto {
  @IsString()
  @MinLength(1)
  firstName: string;

  @IsString()
  @MinLength(1)
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  phone: string;

  @IsString()
  @MinLength(8)
  password: string;
}

export class ChefSignupProfileDto {
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
  @MinLength(1)
  bio: string;
}

export class ChefSignupDto {
  @ValidateNested()
  @Type(() => ChefSignupAccountDto)
  account: ChefSignupAccountDto;

  @ValidateNested()
  @Type(() => ChefSignupProfileDto)
  profile: ChefSignupProfileDto;

  @IsString()
  @MinLength(8)
  confirmPassword: string;

  @Equals(true, { message: 'You must agree to the terms to continue' })
  agreedToTerms: boolean;
}
