import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type ActivitySource = 'web' | 'mobile' | 'system' | 'admin';

export type ActivityEventType =
  | 'user_signed_up'
  | 'user_signed_in'
  | 'user_signed_out'
  | 'location_changed'
  | 'payment_checkout_started'
  | 'payment_completed'
  | 'payment_failed'
  | 'payment_abandoned'
  | 'booking_created'
  | 'booking_status_changed'
  | 'chef_profile_updated'
  | 'page_view'
  | 'search_performed'
  | 'custom';

@Entity('activity_events')
export class ActivityEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  type: ActivityEventType | string;

  @Column({ type: 'varchar', default: 'web' })
  source: ActivitySource | string;

  @Column({ name: 'actor_user_id', type: 'uuid', nullable: true })
  actorUserId: string | null;

  @Column({ name: 'actor_email', type: 'varchar', nullable: true })
  actorEmail: string | null;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text', nullable: true })
  summary: string | null;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  payload: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
