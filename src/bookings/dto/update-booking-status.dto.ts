import { IsIn } from 'class-validator';

export class UpdateBookingStatusDto {
  @IsIn(['confirmed', 'declined', 'completed'])
  status: 'confirmed' | 'declined' | 'completed';
}
