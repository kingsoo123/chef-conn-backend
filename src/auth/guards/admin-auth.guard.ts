import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { verify } from 'jsonwebtoken';
import { Repository } from 'typeorm';
import { isSupabaseAuthConfigured } from '../../config/supabase.config';
import { SupabaseService } from '../../supabase/supabase.service';
import { User } from '../../users/user.entity';
import { getJwtSecret } from '../local-token.service';

type RequestUser = {
  id: string;
  email?: string;
  role?: string;
};

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    @Optional()
    @Inject(SupabaseService)
    private readonly supabaseService: SupabaseService | null,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    let userId: string | undefined;
    let email: string | undefined;

    if (isSupabaseAuthConfigured() && this.supabaseService) {
      try {
        const user = await this.supabaseService.getUserFromToken(token);
        userId = user.id;
        email = user.email;
      } catch {
        throw new UnauthorizedException('Invalid or expired access token');
      }
    } else {
      try {
        const payload = verify(token, getJwtSecret()) as {
          sub: string;
          email?: string;
          role?: string;
        };
        userId = payload.sub;
        email = payload.email;
      } catch {
        throw new UnauthorizedException('Invalid or expired access token');
      }
    }

    if (!userId) {
      throw new UnauthorizedException('Invalid access token');
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user || user.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }

    (request as Request & { user: RequestUser }).user = {
      id: user.id,
      email: user.email ?? email,
      role: user.role,
    };

    return true;
  }

  private extractBearerToken(request: Request): string | undefined {
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      return undefined;
    }

    return authorization.slice('Bearer '.length).trim() || undefined;
  }
}
