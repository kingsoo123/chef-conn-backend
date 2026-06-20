import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BookingsModule } from './bookings/bookings.module';
import { AvailabilityModule } from './availability/availability.module';
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
        const usesSupabase = databaseUrl.includes('supabase');

        return {
          type: 'postgres' as const,
          url: databaseUrl,
          autoLoadEntities: true,
          synchronize: process.env.TYPEORM_SYNCHRONIZE === 'true',
          logging: process.env.TYPEORM_LOGGING === 'true',
          ssl: usesSupabase ? { rejectUnauthorized: false } : false,
        };
      },
    }),
    SupabaseModule.register(),
    AuthModule,
    ChefsModule,
    ChatModule,
    BookingsModule,
    AvailabilityModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
