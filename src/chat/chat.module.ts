import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ChefProfile } from '../chefs/chef-profile.entity';
import { ChefChatController } from './chef-chat.controller';
import { ChatConversation } from './chat-conversation.entity';
import { ChatMessage } from './chat-message.entity';
import { ChatService } from './chat.service';
import { GuestChatController } from './guest-chat.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatConversation, ChatMessage, ChefProfile]),
    AuthModule,
  ],
  controllers: [GuestChatController, ChefChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
