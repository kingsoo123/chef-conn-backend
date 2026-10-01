import './database/neon';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { runDatabaseMigrations } from './database/run-migrations';

function explainDatabaseError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code?: unknown }).code)
      : '';

  if (
    code === 'ETIMEDOUT' ||
    code === 'ENETUNREACH' ||
    code === 'ENOTFOUND' ||
    code === 'ECONNREFUSED' ||
    message.includes('ETIMEDOUT') ||
    message.includes('ENETUNREACH') ||
    message.includes('ENOTFOUND')
  ) {
    return [
      '',
      'Neon database connection failed.',
      '',
      'This project uses Neon over WebSockets (port 443), not raw TCP 5432.',
      'If it still fails:',
      '  1. Open https://console.neon.tech and confirm the project / compute is Active',
      '  2. Connection details → copy a fresh Pooled connection string',
      '  3. Replace DATABASE_URL in chef-conn-backend/.env (keep sslmode=require)',
      '  4. If DNS fails (ENOTFOUND), switch this machine to 1.1.1.1 or 8.8.8.8 DNS',
      '',
      `Underlying error: ${code || 'unknown'} ${message}`,
      '',
    ].join('\n');
  }

  return `\nDatabase bootstrap failed: ${message}\n`;
}

async function bootstrap() {
  try {
    if (process.env.RUN_MIGRATIONS_ON_STARTUP !== 'false') {
      await runDatabaseMigrations();
    }
  } catch (error) {
    console.error(explainDatabaseError(error));
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const configService = app.get(ConfigService);
  const corsOrigin = configService.get<string | string[]>('app.corsOrigin');
  const port = configService.get<number>('app.port', 3002);

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  await app.listen(port);
  console.log(`Backend listening on http://127.0.0.1:${port} (Neon via WebSocket)`);
}

bootstrap().catch((error) => {
  console.error(explainDatabaseError(error));
  process.exit(1);
});
