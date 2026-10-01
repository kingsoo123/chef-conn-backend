import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ActivityEvent,
  type ActivityEventType,
  type ActivitySource,
} from './activity-event.entity';
import { TrackActivityDto } from './dto/track-activity.dto';

export type RecordActivityInput = {
  type: ActivityEventType | string;
  source?: ActivitySource | string;
  actorUserId?: string | null;
  actorEmail?: string | null;
  title: string;
  summary?: string | null;
  payload?: Record<string, unknown>;
};

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(ActivityEvent)
    private readonly activityRepository: Repository<ActivityEvent>,
  ) {}

  async track(dto: TrackActivityDto) {
    return this.record({
      type: dto.type,
      source: dto.source ?? 'web',
      actorUserId: dto.actorUserId ?? null,
      actorEmail: dto.actorEmail?.trim().toLowerCase() ?? null,
      title: dto.title.trim(),
      summary: dto.summary?.trim() || null,
      payload: dto.payload ?? {},
    });
  }

  async record(input: RecordActivityInput): Promise<ActivityEvent> {
    const event = this.activityRepository.create({
      type: input.type,
      source: input.source ?? 'system',
      actorUserId: input.actorUserId ?? null,
      actorEmail: input.actorEmail?.trim().toLowerCase() || null,
      title: input.title.trim(),
      summary: input.summary?.trim() || null,
      payload: input.payload ?? {},
    });

    return this.activityRepository.save(event);
  }

  async list(options: {
    type?: string;
    source?: string;
    limit?: number;
    offset?: number;
  }) {
    const limit = Math.min(Math.max(options.limit ?? 50, 1), 200);
    const offset = Math.max(options.offset ?? 0, 0);

    const qb = this.activityRepository
      .createQueryBuilder('event')
      .orderBy('event.created_at', 'DESC')
      .take(limit)
      .skip(offset);

    if (options.type) {
      qb.andWhere('event.type = :type', { type: options.type });
    }

    if (options.source) {
      qb.andWhere('event.source = :source', { source: options.source });
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      data: items.map((event) => this.toPublic(event)),
      total,
      limit,
      offset,
    };
  }

  toPublic(event: ActivityEvent) {
    return {
      id: event.id,
      type: event.type,
      source: event.source,
      actorUserId: event.actorUserId,
      actorEmail: event.actorEmail,
      title: event.title,
      summary: event.summary,
      payload: event.payload,
      createdAt: event.createdAt,
    };
  }
}
