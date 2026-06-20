import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ChefAuthGuard } from '../auth/guards/chef-auth.guard';
import { CurrentUser } from '../supabase/decorators/current-user.decorator';
import { ChatService } from './chat.service';
import { SendChefChatMessageDto } from './dto/send-chef-chat-message.dto';

@Controller('auth/chef/chat')
@UseGuards(ChefAuthGuard)
export class ChefChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  listConversations(@CurrentUser() user: { id: string }) {
    return this.chatService.listChefConversations(user.id);
  }

  @Get('conversations/:conversationId/messages')
  listMessages(
    @CurrentUser() user: { id: string },
    @Param('conversationId') conversationId: string,
    @Query('since') since?: string,
  ) {
    return this.chatService.listChefConversationMessages(
      user.id,
      conversationId,
      since,
    );
  }

  @Post('conversations/:conversationId/messages')
  sendMessage(
    @CurrentUser() user: { id: string },
    @Param('conversationId') conversationId: string,
    @Body() dto: SendChefChatMessageDto,
  ) {
    return this.chatService.sendChefMessage(user.id, conversationId, dto);
  }
}
