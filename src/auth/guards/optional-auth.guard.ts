import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Optional,
} from '@nestjs/common';
import { Request } from 'express';
import { verify } from 'jsonwebtoken';
import { getJwtSecret } from '../local-token.service';
import { isSupabaseAuthConfigured } from '../../config/supabase.config';
import { SupabaseService } from '../../supabase/supabase.service';

type RequestUser = {
  id: string;
  email?: string;
};

/** Attaches request.user when a valid Bearer token is present; otherwise allows through. */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(
    @Optional()
    @Inject(SupabaseService)
    private readonly supabaseService: SupabaseService | null,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractBearerToken(request);

    if (!token) {
      return true;
    }

    if (isSupabaseAuthConfigured() && this.supabaseService) {
      try {
        const user = await this.supabaseService.getUserFromToken(token);
        (request as Request & { user: RequestUser }).user = {
          id: user.id,
          email: user.email,
        };
      } catch {
        // Guest checkout still allowed if token is invalid
      }
      return true;
    }

    try {
      const payload = verify(token, getJwtSecret()) as {
        sub: string;
        email?: string;
      };
      (request as Request & { user: RequestUser }).user = {
        id: payload.sub,
        email: payload.email,
      };
    } catch {
      // Guest checkout still allowed
    }

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
