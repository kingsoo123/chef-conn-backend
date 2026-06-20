import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { runDatabaseMigrations } from './database/run-migrations';

async function bootstrap() {
  if (process.env.RUN_MIGRATIONS_ON_STARTUP !== 'false') {
    await runDatabaseMigrations();
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
  const corsOrigin = configService.get<string>('app.corsOrigin');
  const port = configService.get<number>('app.port', 3002);

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  await app.listen(port);
}
bootstrap();
