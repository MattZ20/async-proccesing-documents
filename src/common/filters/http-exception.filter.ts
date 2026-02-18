import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { StandardResponse } from '../interfaces/standard-response.interface.js';
import { RESPONSE_CATALOG } from '../constants/response-catalog.js';
import { BusinessException } from '../exceptions/business.exception.js';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = 500;
    let catalogCode: number = RESPONSE_CATALOG.INTERNAL_ERROR.code;
    let message: string = RESPONSE_CATALOG.INTERNAL_ERROR.message;
    let data: unknown = null;

    if (exception instanceof BusinessException) {
      status = exception.getStatus();
      catalogCode = exception.catalogCode;
      message = exception.catalogMessage;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (
        status === 400 &&
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'message' in exceptionResponse
      ) {
        catalogCode = RESPONSE_CATALOG.VALIDATION_ERROR.code;
        message = RESPONSE_CATALOG.VALIDATION_ERROR.message;
        data = {
          errors: (exceptionResponse as { message: unknown }).message,
        };
      } else {
        message =
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : (exceptionResponse as { message?: string }).message ??
              'Error desconocido';
      }
    }

    const body: StandardResponse = {
      code: catalogCode,
      message,
      data,
      timestamp: new Date().toISOString(),
      traceId: (request as Request & { traceId?: string }).traceId ?? null,
    };

    response.status(status).json(body);
  }
}
