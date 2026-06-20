import { Inject, Injectable } from '@nestjs/common';
import { AuthError, Session, SupabaseClient, User } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from './supabase.constants';

type CreateChefUserInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
};

@Injectable()
export class SupabaseService {
  private readonly usesServiceRole: boolean;

  constructor(
    @Inject(SUPABASE_CLIENT)
    private readonly client: SupabaseClient,
  ) {
    this.usesServiceRole = Boolean(
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
    );
  }

  getClient(): SupabaseClient {
    return this.client;
  }

  async getUserFromToken(accessToken: string): Promise<User> {
    const { data, error } = await this.client.auth.getUser(accessToken);

    if (error || !data.user) {
      throw error ?? new Error('Invalid or expired access token');
    }

    return data.user;
  }

  async createChefUser(input: CreateChefUserInput): Promise<User> {
    if (this.usesServiceRole) {
      const { data, error } = await this.client.auth.admin.createUser({
        email: input.email,
        password: input.password,
        email_confirm: true,
        user_metadata: {
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          role: 'chef',
        },
      });

      if (error || !data.user) {
        throw error ?? new Error('Failed to create Supabase user');
      }

      return data.user;
    }

    const { data, error } = await this.client.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          role: 'chef',
        },
      },
    });

    if (error || !data.user) {
      throw error ?? new Error('Failed to create Supabase user');
    }

    return data.user;
  }

  async signInWithPassword(
    email: string,
    password: string,
  ): Promise<Session | null> {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return null;
    }

    return data.session;
  }

  async deleteUser(userId: string): Promise<void> {
    if (!this.usesServiceRole) {
      return;
    }

    const { error } = await this.client.auth.admin.deleteUser(userId);

    if (error) {
      throw error;
    }
  }

  async revokeUserSessions(userId: string): Promise<void> {
    if (!this.usesServiceRole) {
      return;
    }

    const { error } = await this.client.auth.admin.signOut(userId, 'global');

    if (error) {
      throw error;
    }
  }
}

export function isAuthError(error: unknown): error is AuthError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as AuthError).message === 'string'
  );
}
