import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Controller('health')
export class HealthController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  async check() {
    const redisHost = this.configService.get<string>('redis.host')!;
    const redisPort = this.configService.get<number>('redis.port')!;

    let redisStatus = 'down';
    try {
      const redis = new Redis({ host: redisHost, port: redisPort, lazyConnect: true });
      await redis.connect();
      await redis.ping();
      redisStatus = 'up';
      await redis.quit();
    } catch {
      redisStatus = 'down';
    }

    return {
      status: redisStatus === 'up' ? 'ok' : 'error',
      checks: {
        redis: { status: redisStatus },
      },
    };
  }
}
