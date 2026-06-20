import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChefBlockedDate } from '../availability/chef-blocked-date.entity';
import { ChefProfile } from './chef-profile.entity';
import { ChefReview } from './chef-review.entity';
import { ChefsController } from './chefs.controller';
import { ChefsService } from './chefs.service';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [TypeOrmModule.forFeature([ChefProfile, ChefReview, ChefBlockedDate])],
  controllers: [ChefsController],
  providers: [ChefsService, ReviewsService],
  exports: [ChefsService, ReviewsService],
})
export class ChefsModule {}
