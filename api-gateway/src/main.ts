import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { getQueueToken } from '@nestjs/bullmq';
import { createBullBoard } from '@bull-board/api';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
import { ExpressAdapter } from '@bull-board/express';
import { Queue } from 'bullmq';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Document Processing API')
    .setDescription('API Gateway - Procesamiento y validación de documentos')
    .setVersion('3.0')
    .addApiKey(
      { type: 'apiKey', name: 'x-api-key', in: 'header' },
      'x-api-key',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // BullBoard setup
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  const documentQueue = app.get<Queue>(getQueueToken('document-processing'));
  const dlqQueue = app.get<Queue>(getQueueToken('document-processing-dlq'));
  createBullBoard({
    queues: [new BullMQAdapter(documentQueue), new BullMQAdapter(dlqQueue)],
    serverAdapter,
  });

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.use('/admin/queues', serverAdapter.getRouter());

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') ?? 3000;
  await app.listen(port);
}

void bootstrap();
