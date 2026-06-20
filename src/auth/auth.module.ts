import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChefProfile } from '../chefs/chef-profile.entity';
import { User } from '../users/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ChefAuthGuard } from './guards/chef-auth.guard';

@Module({
  imports: [TypeOrmModule.forFeature([User, ChefProfile])],
  controllers: [AuthController],
  providers: [AuthService, ChefAuthGuard],
  exports: [AuthService, ChefAuthGuard],
})
export class AuthModule {}
