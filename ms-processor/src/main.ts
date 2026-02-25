import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const logger = new Logger('MsProcessor');

  const app = await NestFactory.create(AppModule);

  // Internal health endpoint only (not public)
  await app.listen(3001);
  logger.log('ms-processor worker started (health on port 3001)');
}

void bootstrap();
