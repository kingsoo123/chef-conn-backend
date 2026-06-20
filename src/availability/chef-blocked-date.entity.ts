import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChefProfile } from '../chefs/chef-profile.entity';

@Entity('chef_blocked_dates')
export class ChefBlockedDate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'chef_profile_id' })
  chefProfileId: string;

  @ManyToOne(() => ChefProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chef_profile_id' })
  chefProfile: ChefProfile;

  @Column({ name: 'blocked_date', type: 'date' })
  blockedDate: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
