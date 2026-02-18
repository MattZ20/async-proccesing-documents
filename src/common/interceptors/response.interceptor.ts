import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import { StandardResponse } from '../interfaces/standard-response.interface.js';

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, StandardResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardResponse<T>> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { traceId?: string }>();

    if (!request.traceId) {
      request.traceId = uuidv4();
    }

    return next.handle().pipe(
      map((data: unknown) => {
        if (
          data &&
          typeof data === 'object' &&
          'code' in data &&
          'message' in data
        ) {
          const structured = data as {
            code: number;
            message: string;
            data?: T;
          };
          return {
            code: structured.code,
            message: structured.message,
            data: structured.data ?? null,
            timestamp: new Date().toISOString(),
            traceId: request.traceId ?? null,
          };
        }

        return {
          code: 1000,
          message: 'Operación exitosa',
          data: (data as T) ?? null,
          timestamp: new Date().toISOString(),
          traceId: request.traceId ?? null,
        };
      }),
    );
  }
}
