import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityModule } from '../activity/activity.module';
import { ChefProfile } from '../chefs/chef-profile.entity';
import { User } from '../users/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { ChefAuthGuard } from './guards/chef-auth.guard';
import { OptionalAuthGuard } from './guards/optional-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, ChefProfile]),
    forwardRef(() => ActivityModule),
  ],
  controllers: [AuthController],
  providers: [AuthService, ChefAuthGuard, OptionalAuthGuard, AdminAuthGuard],
  exports: [AuthService, ChefAuthGuard, OptionalAuthGuard, AdminAuthGuard],
})
export class AuthModule {}
