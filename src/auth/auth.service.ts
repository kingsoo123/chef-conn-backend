import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { DataSource, Repository } from 'typeorm';
import { ChefProfile } from '../chefs/chef-profile.entity';
import { buildUniqueChefSlug } from '../chefs/slug.util';
import { isSupabaseAuthConfigured } from '../config/supabase.config';
import { SupabaseService } from '../supabase/supabase.service';
import { User } from '../users/user.entity';
import { ChefSignInDto } from './dto/chef-signin.dto';
import { ChefSignOutDto } from './dto/chef-signout.dto';
import { ChefSignupDto } from './dto/chef-signup.dto';
import { ChefUpdateProfileRequestDto } from './dto/chef-update-profile.dto';
import { HostSignupDto } from './dto/host-signup.dto';
import { createLocalAccessToken } from './local-token.service';

@Injectable()
export class AuthService {
  constructor(
    @Optional()
    @Inject(SupabaseService)
    private readonly supabaseService: SupabaseService | null,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(ChefProfile)
    private readonly chefProfilesRepository: Repository<ChefProfile>,
    private readonly dataSource: DataSource,
  ) {}

  async chefSignup(dto: ChefSignupDto) {
    if (dto.account.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    if (isSupabaseAuthConfigured() && this.supabaseService) {
      return this.supabaseChefSignup(dto);
    }

    return this.localChefSignup(dto);
  }

  async chefSignIn(dto: ChefSignInDto) {
    const email = dto.email.trim().toLowerCase();

    if (isSupabaseAuthConfigured() && this.supabaseService) {
      return this.supabaseChefSignIn(email, dto.password);
    }

    return this.localChefSignIn(email, dto.password);
  }

  async chefSignOut(userId: string, _dto?: ChefSignOutDto) {
    if (isSupabaseAuthConfigured() && this.supabaseService) {
      try {
        await this.supabaseService.revokeUserSessions(userId);
      } catch {
        // Cookie clearing on the client is the primary sign-out path.
        // Supabase revocation is best-effort when service role is configured.
      }
    }

    return { success: true };
  }

  async getCurrentChef(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const chefProfile = await this.chefProfilesRepository.findOne({
      where: { userId },
    });

    if (!chefProfile) {
      throw new NotFoundException('Chef profile not found');
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
      },
      chefProfile: {
        id: chefProfile.id,
        displayName: chefProfile.displayName,
        bio: chefProfile.bio,
        experience: chefProfile.experience,
        specialties: chefProfile.specialties,
        services: chefProfile.services,
        areas: chefProfile.areas,
        status: chefProfile.status,
        createdAt: chefProfile.createdAt,
      },
    };
  }

  async getSession(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async hostSignup(dto: HostSignupDto) {
    if (!dto.agreedToTerms) {
      throw new BadRequestException('You must agree to the terms');
    }

    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    if (isSupabaseAuthConfigured()) {
      throw new BadRequestException('Host signup is not available in this environment yet');
    }

    return this.localHostSignup(dto);
  }

  async hostSignIn(dto: ChefSignInDto) {
    if (isSupabaseAuthConfigured()) {
      throw new BadRequestException('Host sign in is not available in this environment yet');
    }

    return this.localHostSignIn(dto.email.trim().toLowerCase(), dto.password);
  }

  async updateChefProfile(userId: string, dto: ChefUpdateProfileRequestDto) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const chefProfile = await this.chefProfilesRepository.findOne({
      where: { userId },
    });

    if (!chefProfile) {
      throw new NotFoundException('Chef profile not found');
    }

    const nextAccount = {
      firstName: dto.account.firstName.trim(),
      lastName: dto.account.lastName.trim(),
      phone: dto.account.phone.trim(),
    };

    const nextProfile = {
      displayName: dto.profile.displayName.trim(),
      bio: dto.profile.bio.trim(),
      experience: dto.profile.experience,
      specialties: dto.profile.specialties,
      services: dto.profile.services,
      areas: dto.profile.areas,
    };

    const publicProfileChanged =
      chefProfile.displayName !== nextProfile.displayName ||
      chefProfile.bio !== nextProfile.bio ||
      chefProfile.experience !== nextProfile.experience ||
      !this.arraysEqual(chefProfile.specialties, nextProfile.specialties) ||
      !this.arraysEqual(chefProfile.services, nextProfile.services) ||
      !this.arraysEqual(chefProfile.areas, nextProfile.areas);

    user.firstName = nextAccount.firstName;
    user.lastName = nextAccount.lastName;
    user.phone = nextAccount.phone;

    chefProfile.displayName = nextProfile.displayName;
    chefProfile.bio = nextProfile.bio;
    chefProfile.experience = nextProfile.experience;
    chefProfile.specialties = nextProfile.specialties;
    chefProfile.services = nextProfile.services;
    chefProfile.areas = nextProfile.areas;

    if (
      publicProfileChanged &&
      (chefProfile.status === 'approved' || chefProfile.status === 'rejected')
    ) {
      chefProfile.status = 'pending_review';
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.save(user);
      await manager.save(chefProfile);
    });

    return this.getCurrentChef(userId);
  }

  private arraysEqual(left: string[], right: string[]) {
    if (left.length !== right.length) {
      return false;
    }

    const sortedLeft = [...left].sort();
    const sortedRight = [...right].sort();

    return sortedLeft.every((value, index) => value === sortedRight[index]);
  }

  private formatHostAuthResponse(
    user: User,
    session: {
      accessToken: string;
      refreshToken: string | null;
      expiresIn: number;
    },
  ) {
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      session,
    };
  }

  private formatAuthResponse(user: User, chefProfile: ChefProfile, session: {
    accessToken: string;
    refreshToken: string | null;
    expiresIn: number;
  } | null) {
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      chefProfile: {
        id: chefProfile.id,
        displayName: chefProfile.displayName,
        status: chefProfile.status,
      },
      session,
    };
  }

  private async localChefSignIn(email: string, password: string) {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();

    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const chefProfile = await this.chefProfilesRepository.findOne({
      where: { userId: user.id },
    });

    if (!chefProfile) {
      throw new NotFoundException('Chef profile not found');
    }

    const { accessToken, expiresIn } = createLocalAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return this.formatAuthResponse(user, chefProfile, {
      accessToken,
      refreshToken: null,
      expiresIn,
    });
  }

  private async localHostSignup(dto: HostSignupDto) {
    const email = dto.email.trim().toLowerCase();
    const existingUser = await this.usersRepository.findOne({ where: { email } });

    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    const userId = randomUUID();
    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = this.usersRepository.create({
      id: userId,
      email,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      phone: null,
      passwordHash,
      role: 'host',
    });

    await this.usersRepository.save(user);

    const { accessToken, expiresIn } = createLocalAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return this.formatHostAuthResponse(user, {
      accessToken,
      refreshToken: null,
      expiresIn,
    });
  }

  private async localHostSignIn(email: string, password: string) {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();

    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.role !== 'host') {
      throw new UnauthorizedException('Use chef sign in for chef accounts');
    }

    const { accessToken, expiresIn } = createLocalAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return this.formatHostAuthResponse(user, {
      accessToken,
      refreshToken: null,
      expiresIn,
    });
  }

  private async supabaseChefSignIn(email: string, password: string) {
    if (!this.supabaseService) {
      throw new InternalServerErrorException('Supabase auth is not configured');
    }

    const session = await this.supabaseService.signInWithPassword(
      email,
      password,
    );

    if (!session) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const user = await this.usersRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('Chef account not found');
    }

    const chefProfile = await this.chefProfilesRepository.findOne({
      where: { userId: user.id },
    });

    if (!chefProfile) {
      throw new NotFoundException('Chef profile not found');
    }

    return this.formatAuthResponse(user, chefProfile, {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresIn: session.expires_in,
    });
  }

  private async localChefSignup(dto: ChefSignupDto) {
    const email = dto.account.email.trim().toLowerCase();
    const existingUser = await this.usersRepository.findOne({ where: { email } });

    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    const userId = randomUUID();
    const passwordHash = await bcrypt.hash(dto.account.password, 12);

    const user = this.usersRepository.create({
      id: userId,
      email,
      firstName: dto.account.firstName.trim(),
      lastName: dto.account.lastName.trim(),
      phone: dto.account.phone.trim(),
      passwordHash,
      role: 'chef',
    });

    const slug = await this.createChefSlug(dto.profile.displayName.trim());

    const chefProfile = this.chefProfilesRepository.create({
      userId,
      displayName: dto.profile.displayName.trim(),
      slug,
      bio: dto.profile.bio.trim(),
      experience: dto.profile.experience,
      specialties: dto.profile.specialties,
      services: dto.profile.services,
      areas: dto.profile.areas,
      status: 'pending_review',
      pricePerDay: 75000,
      rating: 0,
      reviewCount: 0,
      isAvailable: true,
    });

    await this.dataSource.transaction(async (manager) => {
      await manager.save(user);
      await manager.save(chefProfile);
    });

    const { accessToken, expiresIn } = createLocalAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      chefProfile: {
        id: chefProfile.id,
        displayName: chefProfile.displayName,
        status: chefProfile.status,
      },
      session: {
        accessToken,
        refreshToken: null,
        expiresIn,
      },
    };
  }

  private async supabaseChefSignup(dto: ChefSignupDto) {
    if (!this.supabaseService) {
      throw new InternalServerErrorException('Supabase auth is not configured');
    }

    const email = dto.account.email.trim().toLowerCase();
    const existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    let supabaseUserId: string | null = null;

    try {
      const supabaseUser = await this.supabaseService.createChefUser({
        email,
        password: dto.account.password,
        firstName: dto.account.firstName.trim(),
        lastName: dto.account.lastName.trim(),
        phone: dto.account.phone.trim(),
      });
      supabaseUserId = supabaseUser.id;

      const user = this.usersRepository.create({
        id: supabaseUser.id,
        email,
        firstName: dto.account.firstName.trim(),
        lastName: dto.account.lastName.trim(),
        phone: dto.account.phone.trim(),
        role: 'chef',
      });

      const slug = await this.createChefSlug(dto.profile.displayName.trim());

      const chefProfile = this.chefProfilesRepository.create({
        userId: supabaseUser.id,
        displayName: dto.profile.displayName.trim(),
        slug,
        bio: dto.profile.bio.trim(),
        experience: dto.profile.experience,
        specialties: dto.profile.specialties,
        services: dto.profile.services,
        areas: dto.profile.areas,
        status: 'pending_review',
        pricePerDay: 75000,
        rating: 0,
        reviewCount: 0,
        isAvailable: true,
      });

      await this.dataSource.transaction(async (manager) => {
        await manager.save(user);
        await manager.save(chefProfile);
      });

      const session = await this.supabaseService.signInWithPassword(
        email,
        dto.account.password,
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        chefProfile: {
          id: chefProfile.id,
          displayName: chefProfile.displayName,
          status: chefProfile.status,
        },
        session: session
          ? {
              accessToken: session.access_token,
              refreshToken: session.refresh_token,
              expiresIn: session.expires_in,
            }
          : null,
      };
    } catch (error) {
      if (supabaseUserId) {
        await this.supabaseService.deleteUser(supabaseUserId);
      }

      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      const message =
        error instanceof Error ? error.message : 'Chef signup failed';

      if (message.toLowerCase().includes('already been registered')) {
        throw new ConflictException('An account with this email already exists');
      }

      throw new InternalServerErrorException(message);
    }
  }

  private async createChefSlug(displayName: string) {
    return buildUniqueChefSlug(displayName, async (candidate) => {
      const existing = await this.chefProfilesRepository.findOne({
        where: { slug: candidate },
      });

      return Boolean(existing);
    });
  }
}
