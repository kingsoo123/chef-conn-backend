import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChefProfile } from '../chefs/chef-profile.entity';
import { ChatMessage } from './chat-message.entity';

@Entity('chat_conversations')
export class ChatConversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'chef_profile_id' })
  chefProfileId: string;

  @ManyToOne(() => ChefProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chef_profile_id' })
  chefProfile: ChefProfile;

  @Column({ name: 'guest_name' })
  guestName: string;

  @Column({ name: 'guest_token' })
  guestToken: string;

  @Column({ name: 'last_message_at', type: 'timestamptz' })
  lastMessageAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => ChatMessage, (message) => message.conversation)
  messages?: ChatMessage[];
}
