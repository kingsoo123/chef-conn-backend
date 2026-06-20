import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ChefSignInDto } from './dto/chef-signin.dto';
import { ChefSignOutDto } from './dto/chef-signout.dto';
import { ChefSignupDto } from './dto/chef-signup.dto';
import { ChefUpdateProfileRequestDto } from './dto/chef-update-profile.dto';
import { HostSignupDto } from './dto/host-signup.dto';
import { ChefAuthGuard } from './guards/chef-auth.guard';
import { CurrentUser } from '../supabase/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('chef/signup')
  chefSignup(@Body() dto: ChefSignupDto) {
    return this.authService.chefSignup(dto);
  }

  @Post('chef/signin')
  @HttpCode(200)
  chefSignIn(@Body() dto: ChefSignInDto) {
    return this.authService.chefSignIn(dto);
  }

  @Post('chef/signout')
  @HttpCode(200)
  @UseGuards(ChefAuthGuard)
  chefSignOut(
    @CurrentUser() user: { id: string },
    @Body() dto: ChefSignOutDto,
  ) {
    return this.authService.chefSignOut(user.id, dto);
  }

  @Post('host/signup')
  hostSignup(@Body() dto: HostSignupDto) {
    return this.authService.hostSignup(dto);
  }

  @Post('host/signin')
  @HttpCode(200)
  hostSignIn(@Body() dto: ChefSignInDto) {
    return this.authService.hostSignIn(dto);
  }

  @Get('session')
  @UseGuards(ChefAuthGuard)
  getSession(@CurrentUser() user: { id: string }) {
    return this.authService.getSession(user.id);
  }

  @Get('me')
  @UseGuards(ChefAuthGuard)
  getMe(@CurrentUser() user: { id: string }) {
    return this.authService.getCurrentChef(user.id);
  }

  @Patch('chef/profile')
  @UseGuards(ChefAuthGuard)
  updateChefProfile(
    @CurrentUser() user: { id: string },
    @Body() dto: ChefUpdateProfileRequestDto,
  ) {
    return this.authService.updateChefProfile(user.id, dto);
  }
}
