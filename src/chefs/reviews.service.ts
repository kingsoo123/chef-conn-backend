import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChefProfile } from './chef-profile.entity';
import { ChefReview } from './chef-review.entity';
import { CreateChefReviewDto } from './dto/create-chef-review.dto';

function mapReview(review: ChefReview) {
  return {
    id: review.id,
    reviewerName: review.reviewerName,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
  };
}

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(ChefReview)
    private readonly reviewsRepository: Repository<ChefReview>,
    @InjectRepository(ChefProfile)
    private readonly chefProfilesRepository: Repository<ChefProfile>,
  ) {}

  async listByChefSlug(slug: string) {
    const profile = await this.findApprovedProfile(slug);

    const reviews = await this.reviewsRepository.find({
      where: { chefProfileId: profile.id },
      order: { createdAt: 'DESC' },
    });

    return {
      data: reviews.map(mapReview),
      meta: {
        total: reviews.length,
        averageRating: Number(profile.rating ?? 0),
      },
    };
  }

  async createForChefSlug(slug: string, dto: CreateChefReviewDto) {
    const profile = await this.findApprovedProfile(slug);

    const review = this.reviewsRepository.create({
      chefProfileId: profile.id,
      reviewerName: dto.reviewerName.trim(),
      rating: dto.rating,
      comment: dto.comment.trim(),
    });

    const saved = await this.reviewsRepository.save(review);
    await this.refreshChefRating(profile.id);

    const updatedProfile = await this.chefProfilesRepository.findOne({
      where: { id: profile.id },
    });

    return {
      review: mapReview(saved),
      chef: {
        rating: Number(updatedProfile?.rating ?? 0),
        reviewCount: updatedProfile?.reviewCount ?? 0,
      },
    };
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

  private async refreshChefRating(chefProfileId: string) {
    const aggregate = await this.reviewsRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'average')
      .addSelect('COUNT(review.id)', 'count')
      .where('review.chef_profile_id = :chefProfileId', { chefProfileId })
      .getRawOne<{ average: string | null; count: string }>();

    const average = aggregate?.average
      ? Math.round(Number(aggregate.average) * 10) / 10
      : 0;
    const count = Number(aggregate?.count ?? 0);

    await this.chefProfilesRepository.update(chefProfileId, {
      rating: average,
      reviewCount: count,
    });
  }
}
