import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { BusinessException } from '../../common/exceptions/business.exception.js';
import { RESPONSE_CATALOG } from '../../common/constants/response-catalog.js';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-api-key'] as string | undefined;

    if (!apiKey) {
      throw new BusinessException(RESPONSE_CATALOG.API_KEY_REQUIRED, 401);
    }

    const validApiKey = this.configService.get<string>('apiKey');

    if (apiKey !== validApiKey) {
      throw new BusinessException(RESPONSE_CATALOG.API_KEY_INVALID, 401);
    }

    return true;
  }
}
