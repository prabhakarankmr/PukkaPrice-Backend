import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import multipart from '@fastify/multipart';
import fastifyCors from '@fastify/cors';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  const configService = app.get(ConfigService);

  // CORS configuration

  // Add the Vercel frontend URL to allowed CORS origins
  const corsOrigins = configService
    .get<string>('CORS_ORIGINS', 'http://localhost:3000')
    .split(',')
    .map(origin => origin.trim());
  if (!corsOrigins.includes('https://pukka-price-frontend.vercel.app/')) {
    corsOrigins.push('https://pukka-price-frontend.vercel.app/');
  }

  // ✅ Enable CORS for Fastify
  await app.register(fastifyCors, {
    origin: corsOrigins, // Use configurable origins
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  });

  // Register multipart for file uploads
  await app.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  });

  // Register static file serving plugin
  await app.register(require('@fastify/static'), {
    root: join(process.cwd(), 'uploads'),
    prefix: '/uploads/',
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = configService.get<number>('PORT', 3001);
  
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📝 Environment: ${configService.get('NODE_ENV', 'development')}`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
}

bootstrap();
