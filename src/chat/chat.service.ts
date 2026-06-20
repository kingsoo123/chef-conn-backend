import { randomUUID } from 'node:crypto';
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { ChefProfile } from '../chefs/chef-profile.entity';
import { ChatConversation } from './chat-conversation.entity';
import { ChatMessage } from './chat-message.entity';
import { CreateChatSessionDto } from './dto/create-chat-session.dto';
import { SendChefChatMessageDto } from './dto/send-chef-chat-message.dto';
import { SendGuestChatMessageDto } from './dto/send-guest-chat-message.dto';
import { validateChatMessageBody } from './chat-content-policy';

function mapMessage(message: ChatMessage) {
  return {
    id: message.id,
    senderType: message.senderType,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
  };
}

function mapConversationSummary(conversation: ChatConversation) {
  return {
    id: conversation.id,
    guestName: conversation.guestName,
    lastMessageAt: conversation.lastMessageAt.toISOString(),
    createdAt: conversation.createdAt.toISOString(),
  };
}

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatConversation)
    private readonly conversationsRepository: Repository<ChatConversation>,
    @InjectRepository(ChatMessage)
    private readonly messagesRepository: Repository<ChatMessage>,
    @InjectRepository(ChefProfile)
    private readonly chefProfilesRepository: Repository<ChefProfile>,
  ) {}

  async createOrResumeSession(slug: string, dto: CreateChatSessionDto) {
    const profile = await this.findApprovedProfile(slug);
    const guestToken = dto.guestToken ?? randomUUID();

    let conversation = await this.conversationsRepository.findOne({
      where: {
        chefProfileId: profile.id,
        guestToken,
      },
    });

    if (!conversation) {
      conversation = this.conversationsRepository.create({
        chefProfileId: profile.id,
        guestName: dto.guestName.trim(),
        guestToken,
        lastMessageAt: new Date(),
      });
      conversation = await this.conversationsRepository.save(conversation);
    } else if (conversation.guestName !== dto.guestName.trim()) {
      conversation.guestName = dto.guestName.trim();
      conversation = await this.conversationsRepository.save(conversation);
    }

    const messages = await this.messagesRepository.find({
      where: { conversationId: conversation.id },
      order: { createdAt: 'ASC' },
      take: 100,
    });

    return {
      conversation: mapConversationSummary(conversation),
      guestToken: conversation.guestToken,
      messages: messages.map(mapMessage),
    };
  }

  async listGuestMessages(slug: string, guestToken: string, since?: string) {
    const conversation = await this.findGuestConversation(slug, guestToken);
    const messages = await this.listMessagesSince(conversation.id, since);

    return {
      data: messages.map(mapMessage),
    };
  }

  async sendGuestMessage(slug: string, dto: SendGuestChatMessageDto) {
    const conversation = await this.findGuestConversation(slug, dto.guestToken);

    const message = await this.saveMessage(
      conversation,
      'guest',
      dto.body.trim(),
    );

    return {
      message: mapMessage(message),
    };
  }

  async listChefConversations(userId: string) {
    const profile = await this.findChefProfileForUser(userId);

    const conversations = await this.conversationsRepository.find({
      where: { chefProfileId: profile.id },
      order: { lastMessageAt: 'DESC' },
      take: 50,
    });

    const summaries = await Promise.all(
      conversations.map(async (conversation) => {
        const latestMessage = await this.messagesRepository.findOne({
          where: { conversationId: conversation.id },
          order: { createdAt: 'DESC' },
        });

        return {
          ...mapConversationSummary(conversation),
          latestMessage: latestMessage ? mapMessage(latestMessage) : null,
        };
      }),
    );

    return { data: summaries };
  }

  async listChefConversationMessages(
    userId: string,
    conversationId: string,
    since?: string,
  ) {
    const conversation = await this.findChefConversation(userId, conversationId);
    const messages = await this.listMessagesSince(conversation.id, since);

    return {
      conversation: mapConversationSummary(conversation),
      data: messages.map(mapMessage),
    };
  }

  async sendChefMessage(
    userId: string,
    conversationId: string,
    dto: SendChefChatMessageDto,
  ) {
    const conversation = await this.findChefConversation(userId, conversationId);

    const message = await this.saveMessage(
      conversation,
      'chef',
      dto.body.trim(),
    );

    return {
      message: mapMessage(message),
    };
  }

  private async saveMessage(
    conversation: ChatConversation,
    senderType: 'guest' | 'chef',
    body: string,
  ) {
    const policyError = validateChatMessageBody(body);
    if (policyError) {
      throw new BadRequestException(policyError);
    }

    const message = this.messagesRepository.create({
      conversationId: conversation.id,
      senderType,
      body,
    });

    const saved = await this.messagesRepository.save(message);

    conversation.lastMessageAt = saved.createdAt;
    await this.conversationsRepository.save(conversation);

    return saved;
  }

  private async listMessagesSince(conversationId: string, since?: string) {
    if (since) {
      const sinceDate = new Date(since);
      if (!Number.isNaN(sinceDate.getTime())) {
        return this.messagesRepository.find({
          where: {
            conversationId,
            createdAt: MoreThan(sinceDate),
          },
          order: { createdAt: 'ASC' },
          take: 100,
        });
      }
    }

    return this.messagesRepository.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
      take: 100,
    });
  }

  private async findApprovedProfile(slug: string) {
    const profile = await this.chefProfilesRepository.findOne({
      where: { slug, status: 'approved' },
    });

    if (!profile) {
      throw new NotFoundException('Chef not found');
    }

    return profile;
  }

  private async findGuestConversation(slug: string, guestToken: string) {
    const profile = await this.findApprovedProfile(slug);

    const conversation = await this.conversationsRepository.findOne({
      where: {
        chefProfileId: profile.id,
        guestToken,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  private async findChefProfileForUser(userId: string) {
    const profile = await this.chefProfilesRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Chef profile not found');
    }

    return profile;
  }

  private async findChefConversation(userId: string, conversationId: string) {
    const profile = await this.findChefProfileForUser(userId);

    const conversation = await this.conversationsRepository.findOne({
      where: {
        id: conversationId,
        chefProfileId: profile.id,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }
}
