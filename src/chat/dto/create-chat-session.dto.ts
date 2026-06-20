import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateChatSessionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  guestName: string;

  @IsOptional()
  @IsUUID()
  guestToken?: string;
}
