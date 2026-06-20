import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('chef_profiles')
export class ChefProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', unique: true })
  userId: string;

  @OneToOne(() => User, (user) => user.chefProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'display_name' })
  displayName: string;

  @Column({ type: 'text' })
  bio: string;

  @Column()
  experience: string;

  @Column('text', { array: true })
  specialties: string[];

  @Column('text', { array: true })
  services: string[];

  @Column('text', { array: true })
  areas: string[];

  @Column({ default: 'pending_review' })
  status: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  slug: string | null;

  @Column({ name: 'price_per_day', type: 'int', default: 350 })
  pricePerDay: number;

  @Column({ type: 'decimal', precision: 2, scale: 1, default: 0 })
  rating: number;

  @Column({ name: 'review_count', type: 'int', default: 0 })
  reviewCount: number;

  @Column({ name: 'is_available', default: true })
  isAvailable: boolean;

  @Column({ name: 'weekly_schedule', type: 'jsonb', nullable: true })
  weeklySchedule: Record<string, unknown> | null;

  @Column({ name: 'service_schedules', type: 'jsonb', nullable: true })
  serviceSchedules: Record<string, unknown> | null;

  @Column({ name: 'calendar_feed_token', type: 'varchar', nullable: true })
  calendarFeedToken: string | null;

  @Column({ name: 'external_calendar_url', type: 'text', nullable: true })
  externalCalendarUrl: string | null;

  @Column({ name: 'calendar_synced_at', type: 'timestamptz', nullable: true })
  calendarSyncedAt: Date | null;

  @Column({ name: 'image_url', type: 'varchar', nullable: true })
  imageUrl: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
