import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  MicroserviceHealthIndicator,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';
import { RESPONSE_CATALOG } from '../common/constants/response-catalog.js';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly microservice: MicroserviceHealthIndicator,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Verificar estado del servicio y Redis' })
  async check() {
    const redisHost = this.configService.get<string>('redis.host');
    const redisPort = this.configService.get<number>('redis.port');

    const result = await this.health.check([
      () =>
        this.microservice.pingCheck('redis', {
          transport: Transport.REDIS,
          options: { host: redisHost, port: redisPort },
        }),
    ]);

    return {
      code: RESPONSE_CATALOG.HEALTHY.code,
      message: RESPONSE_CATALOG.HEALTHY.message,
      data: {
        status: result.status,
        uptime: `${Math.floor(process.uptime())}s`,
        checks: result.details,
      },
    };
  }
}
