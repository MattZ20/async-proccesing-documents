import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RESPONSE_CATALOG } from '../common/constants/response-catalog.js';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Verificar estado del servicio' })
  check() {
    return {
      code: RESPONSE_CATALOG.HEALTHY.code,
      message: RESPONSE_CATALOG.HEALTHY.message,
      data: {
        status: 'ok',
        uptime: `${Math.floor(process.uptime())}s`,
      },
    };
  }
}
