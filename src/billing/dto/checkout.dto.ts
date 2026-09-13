import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCheckoutDto {
  @IsIn(['host', 'chef'])
  audience: 'host' | 'chef';

  @IsIn(['starter', 'pro', 'premium'])
  planId: 'starter' | 'pro' | 'premium';

  @IsIn(['monthly', 'quarterly', 'annually'])
  billing: 'monthly' | 'quarterly' | 'annually';

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2)
  customerName: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class VerifyCheckoutDto {
  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsString()
  txRef?: string;
}
