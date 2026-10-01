import './database/neon';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as neonServerless from '@neondatabase/serverless';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ActivityModule } from './activity/activity.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { BookingsModule } from './bookings/bookings.module';
import { AvailabilityModule } from './availability/availability.module';
import { BillingModule } from './billing/billing.module';
import { ChatModule } from './chat/chat.module';
import { ChefsModule } from './chefs/chefs.module';
import appConfig, { requireEnv } from './config/configuration';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [appConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: () => {
        const databaseUrl = requireEnv('DATABASE_URL');
        const isNeon = databaseUrl.includes('neon.tech');

        return {
          type: 'postgres' as const,
          url: databaseUrl,
          // Neon WebSocket driver (port 443) — TCP :5432 times out on many networks.
          ...(isNeon
            ? { driver: neonServerless, ssl: false }
            : {
                ssl: databaseUrl.includes('sslmode=require')
                  ? { rejectUnauthorized: false }
                  : false,
              }),
          autoLoadEntities: true,
          synchronize: process.env.TYPEORM_SYNCHRONIZE === 'true',
          logging: process.env.TYPEORM_LOGGING === 'true',
          extra: {
            max: 5,
            connectionTimeoutMillis: 30_000,
          },
          retryAttempts: 5,
          retryDelay: 2000,
        };
      },
    }),
    SupabaseModule.register(),
    AuthModule,
    ChefsModule,
    ChatModule,
    BookingsModule,
    AvailabilityModule,
    BillingModule,
    ActivityModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
