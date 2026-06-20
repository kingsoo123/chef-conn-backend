import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ChefProfile } from '../chefs/chef-profile.entity';

export type BookingStatus =
  | 'new'
  | 'awaiting_response'
  | 'confirmed'
  | 'declined'
  | 'completed'
  | 'cancelled';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'chef_profile_id' })
  chefProfileId: string;

  @ManyToOne(() => ChefProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chef_profile_id' })
  chefProfile: ChefProfile;

  @Column({ name: 'host_name' })
  hostName: string;

  @Column({ name: 'host_email', type: 'varchar', nullable: true })
  hostEmail: string | null;

  @Column({ name: 'host_phone', type: 'varchar', nullable: true })
  hostPhone: string | null;

  @Column()
  service: string;

  @Column({ name: 'event_date', type: 'date' })
  eventDate: string;

  @Column({ name: 'event_time' })
  eventTime: string;

  @Column({ name: 'guest_count', type: 'int' })
  guestCount: number;

  @Column()
  location: string;

  @Column({ type: 'varchar', nullable: true })
  country: string | null;

  @Column({ type: 'varchar', nullable: true })
  state: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'text', default: '' })
  notes: string;

  @Column({ type: 'int', nullable: true })
  budget: number | null;

  @Column({ default: 'new' })
  status: BookingStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
