import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { requireEnv } from '../config/configuration';
import { isSupabaseAuthConfigured } from '../config/supabase.config';
import { SUPABASE_CLIENT } from './supabase.constants';
import { SupabaseService } from './supabase.service';

function resolveSupabaseKey(): string {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (serviceRoleKey) {
    return serviceRoleKey;
  }

  const anonKey = process.env.SUPABASE_ANON_KEY?.trim();
  if (anonKey) {
    return anonKey;
  }

  throw new Error(
    'Add SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY to chef-conn-backend/.env',
  );
}

@Global()
@Module({})
export class SupabaseModule {
  static register(): DynamicModule {
    if (!isSupabaseAuthConfigured()) {
      return { module: SupabaseModule };
    }

    return {
      module: SupabaseModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: SUPABASE_CLIENT,
          useFactory: () => {
            const url = requireEnv('SUPABASE_URL');
            const key = resolveSupabaseKey();

            return createClient(url, key, {
              auth: {
                autoRefreshToken: false,
                persistSession: false,
              },
            });
          },
        },
        SupabaseService,
      ],
      exports: [SupabaseService, SUPABASE_CLIENT],
    };
  }
}
