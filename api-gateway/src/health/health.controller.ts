import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RESPONSE_CATALOG } from '../common/constants/response-catalog.js';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Verificar estado del servicio y Redis' })
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
      code: RESPONSE_CATALOG.HEALTHY.code,
      message: RESPONSE_CATALOG.HEALTHY.message,
      data: {
        status: redisStatus === 'up' ? 'ok' : 'error',
        uptime: `${Math.floor(process.uptime())}s`,
        checks: {
          redis: { status: redisStatus },
        },
      },
    };
  }
}
