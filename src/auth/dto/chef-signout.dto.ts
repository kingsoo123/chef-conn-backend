import { IsOptional, IsString } from 'class-validator';

export class ChefSignOutDto {
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
