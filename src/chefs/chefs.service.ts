import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ChefBlockedDate } from '../availability/chef-blocked-date.entity';
import { ChefProfile } from './chef-profile.entity';
import {
  mapChefProfileToListItem,
  mapChefPublicAvailability,
  mapServicesToApi,
} from './chef.mapper';
import { ChefSearchDto } from './dto/chef-search.dto';

const PRICE_RANGES: Record<
  string,
  { min: number; max: number }
> = {
  all: { min: 0, max: Number.MAX_SAFE_INTEGER },
  'under-200': { min: 0, max: 199 },
  '200-400': { min: 200, max: 399 },
  '400-600': { min: 400, max: 599 },
  '600-plus': { min: 600, max: Number.MAX_SAFE_INTEGER },
};

@Injectable()
export class ChefsService {
  constructor(
    @InjectRepository(ChefProfile)
    private readonly chefProfilesRepository: Repository<ChefProfile>,
    @InjectRepository(ChefBlockedDate)
    private readonly blockedDatesRepository: Repository<ChefBlockedDate>,
  ) {}

  async search(dto: ChefSearchDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 24;

    const qb = this.chefProfilesRepository
      .createQueryBuilder('profile')
      .where('profile.status = :status', { status: 'approved' });

    this.applyFilters(qb, dto);

    const total = await qb.getCount();
    this.applySort(qb, dto.sort ?? 'recommended');

    const profiles = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data: profiles.map(mapChefProfileToListItem),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findBySlug(slug: string) {
    const profile = await this.chefProfilesRepository.findOne({
      where: { slug, status: 'approved' },
    });

    if (!profile) {
      throw new NotFoundException('Chef not found');
    }

    const blockedRows = await this.blockedDatesRepository.find({
      where: { chefProfileId: profile.id },
      order: { blockedDate: 'ASC' },
    });

    return {
      ...mapChefProfileToListItem(profile),
      availability: mapChefPublicAvailability(
        profile,
        blockedRows.map((row) => row.blockedDate),
      ),
    };
  }

  private applyFilters(
    qb: SelectQueryBuilder<ChefProfile>,
    dto: ChefSearchDto,
  ) {
    if (dto.q?.trim()) {
      const query = `%${dto.q.trim()}%`;
      qb.andWhere(
        `(
          profile.display_name ILIKE :query OR
          profile.bio ILIKE :query OR
          array_to_string(profile.specialties, ' ') ILIKE :query OR
          array_to_string(profile.areas, ' ') ILIKE :query
        )`,
        { query },
      );
    }

    if (dto.areas?.length) {
      qb.andWhere('profile.areas && :areas', { areas: dto.areas });
    }

    if (dto.specialties?.length) {
      qb.andWhere('profile.specialties && :specialties', {
        specialties: dto.specialties,
      });
    }

    if (dto.services?.length) {
      const services = mapServicesToApi(dto.services);
      qb.andWhere('profile.services && :services', { services });
    }

    if (dto.experience?.length) {
      qb.andWhere('profile.experience IN (:...experience)', {
        experience: dto.experience,
      });
    }

    if (dto.availableOnly) {
      qb.andWhere('profile.is_available = true');
    }

    if (dto.minRating !== undefined && dto.minRating > 0) {
      qb.andWhere('profile.rating >= :minRating', { minRating: dto.minRating });
    }

    const priceRange = dto.priceRange
      ? PRICE_RANGES[dto.priceRange]
      : undefined;
    const priceMin = dto.priceMin ?? priceRange?.min;
    const priceMax = dto.priceMax ?? priceRange?.max;

    if (priceMin !== undefined) {
      qb.andWhere('profile.price_per_day >= :priceMin', { priceMin });
    }

    if (priceMax !== undefined && priceMax < Number.MAX_SAFE_INTEGER) {
      qb.andWhere('profile.price_per_day <= :priceMax', { priceMax });
    }
  }

  private applySort(
    qb: SelectQueryBuilder<ChefProfile>,
    sort: NonNullable<ChefSearchDto['sort']>,
  ) {
    switch (sort) {
      case 'rating':
        qb.orderBy('profile.rating', 'DESC').addOrderBy(
          'profile.review_count',
          'DESC',
        );
        break;
      case 'reviews':
        qb.orderBy('profile.review_count', 'DESC').addOrderBy(
          'profile.rating',
          'DESC',
        );
        break;
      case 'price-asc':
        qb.orderBy('profile.price_per_day', 'ASC');
        break;
      case 'price-desc':
        qb.orderBy('profile.price_per_day', 'DESC');
        break;
      default:
        qb
          .orderBy('profile.review_count', 'DESC')
          .addOrderBy('profile.rating', 'DESC');
    }
  }
}
