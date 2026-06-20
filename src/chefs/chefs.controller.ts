import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ChefsService } from './chefs.service';
import { ChefSearchDto } from './dto/chef-search.dto';
import { CreateChefReviewDto } from './dto/create-chef-review.dto';
import { ReviewsService } from './reviews.service';

@Controller('chefs')
export class ChefsController {
  constructor(
    private readonly chefsService: ChefsService,
    private readonly reviewsService: ReviewsService,
  ) {}

  @Get()
  search(@Query() query: ChefSearchDto) {
    return this.chefsService.search(query);
  }

  @Get(':slug/reviews')
  listReviews(@Param('slug') slug: string) {
    return this.reviewsService.listByChefSlug(slug);
  }

  @Post(':slug/reviews')
  createReview(
    @Param('slug') slug: string,
    @Body() dto: CreateChefReviewDto,
  ) {
    return this.reviewsService.createForChefSlug(slug, dto);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.chefsService.findBySlug(slug);
  }
}
