import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChefProfile } from './chef-profile.entity';

@Entity('chef_reviews')
export class ChefReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'chef_profile_id' })
  chefProfileId: string;

  @ManyToOne(() => ChefProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chef_profile_id' })
  chefProfile: ChefProfile;

  @Column({ name: 'reviewer_name' })
  reviewerName: string;

  @Column({ type: 'smallint' })
  rating: number;

  @Column({ type: 'text' })
  comment: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
