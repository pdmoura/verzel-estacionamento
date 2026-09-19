import {
  BadRequestException,
  INestApplication,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Express } from 'express';
import { AppModule } from './app.module';

/** Origins allowed to call the API. Comma separated in FRONTEND_URL. */
export function allowedOrigins(): (string | RegExp)[] {
  const list: (string | RegExp)[] = [
    'http://localhost:3000',
    // Vercel preview/production deployments of the frontend
    /^https:\/\/estacionamento(-[a-z0-9-]+)?(-[a-z0-9-]+)?\.vercel\.app$/,
  ];
  for (const raw of (process.env.FRONTEND_URL ?? '').split(',')) {
    const origin = raw.trim().replace(/\/$/, '');
    if (origin) list.push(origin);
  }
  return list;
}

function flattenValidationErrors(errors: ValidationError[]): string[] {
  const messages: string[] = [];
  const walk = (list: ValidationError[]) => {
    for (const err of list) {
      if (err.constraints) messages.push(...Object.values(err.constraints));
      if (err.children?.length) walk(err.children);
    }
  };
  walk(errors);
  return messages;
}

/**
 * Builds the Nest application. Shared by the local server (main.ts) and the
 * Vercel serverless entry point (api/index.js).
 */
export async function createApp(express?: Express): Promise<INestApplication> {
  const app = express
    ? await NestFactory.create(AppModule, new ExpressAdapter(express), { logger: ['error', 'warn', 'log'] })
    : await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });

  app.enableCors({
    origin: allowedOrigins(),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      // Keep the API error contract: { statusCode, code, message }
      exceptionFactory: (errors) =>
        new BadRequestException({
          statusCode: 400,
          code: 'VALIDATION_ERROR',
          message: flattenValidationErrors(errors).join('; ') || 'Dados inválidos.',
        }),
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Estacionamento Rotativo API')
    .setDescription(
      'Gestão de setores, reservas, lista de espera (FIFO com promoção automática), ranking e histórico de eventos do estacionamento rotativo da praça central.',
    )
    .setVersion('1.1.0')
    .addTag('sectors', 'Setores e ranking')
    .addTag('reservations', 'Reservas de vagas')
    .addTag('waitlist', 'Lista de espera')
    .addTag('history', 'Histórico de eventos')
    .addTag('system', 'Status e saúde da API')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'Estacionamento Rotativo API',
    jsonDocumentUrl: 'docs-json',
  });

  return app;
}
