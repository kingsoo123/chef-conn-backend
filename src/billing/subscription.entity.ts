import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type SubscriptionStatus =
  | 'pending'
  | 'active'
  | 'failed'
  | 'cancelled'
  | 'expired';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Index()
  @Column()
  email: string;

  @Column({ name: 'customer_name', type: 'varchar', nullable: true })
  customerName: string | null;

  @Column()
  audience: string;

  @Column({ name: 'plan_id' })
  planId: string;

  @Column({ name: 'billing_interval' })
  billingInterval: string;

  @Column({ type: 'int' })
  amount: number;

  @Column({ default: 'NGN' })
  currency: string;

  @Index()
  @Column({ default: 'pending' })
  status: SubscriptionStatus;

  @Index({ unique: true })
  @Column({ name: 'tx_ref' })
  txRef: string;

  @Column({ name: 'flw_transaction_id', type: 'varchar', nullable: true })
  flwTransactionId: string | null;

  @Column({ name: 'flw_flw_ref', type: 'varchar', nullable: true })
  flwFlwRef: string | null;

  @Column({ name: 'current_period_start', type: 'timestamptz', nullable: true })
  currentPeriodStart: Date | null;

  @Column({ name: 'current_period_end', type: 'timestamptz', nullable: true })
  currentPeriodEnd: Date | null;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
