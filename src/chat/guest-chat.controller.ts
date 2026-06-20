import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatSessionDto } from './dto/create-chat-session.dto';
import { SendGuestChatMessageDto } from './dto/send-guest-chat-message.dto';

@Controller('chefs/:slug/chat')
export class GuestChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('session')
  createSession(
    @Param('slug') slug: string,
    @Body() dto: CreateChatSessionDto,
  ) {
    return this.chatService.createOrResumeSession(slug, dto);
  }

  @Get('messages')
  listMessages(
    @Param('slug') slug: string,
    @Query('guestToken') guestToken: string,
    @Query('since') since?: string,
  ) {
    return this.chatService.listGuestMessages(slug, guestToken, since);
  }

  @Post('messages')
  sendMessage(
    @Param('slug') slug: string,
    @Body() dto: SendGuestChatMessageDto,
  ) {
    return this.chatService.sendGuestMessage(slug, dto);
  }
}
