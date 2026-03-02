import { HttpException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';
import { BusinessException } from '../exceptions/business.exception';
import { RESPONSE_CATALOG } from '../constants/response-catalog';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: any;
  let mockRequest: any;
  let mockHost: any;

  beforeEach(() => {
    filter = new HttpExceptionFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockRequest = { traceId: 'test-trace-id' };

    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    };
  });

  it('should handle BusinessException with correct catalog code', () => {
    const exception = new BusinessException(
      RESPONSE_CATALOG.DOCUMENT_NOT_FOUND,
      404,
    );

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: RESPONSE_CATALOG.DOCUMENT_NOT_FOUND.code,
        message: RESPONSE_CATALOG.DOCUMENT_NOT_FOUND.message,
      }),
    );
  });

  it('should handle HttpException 400 with validation errors', () => {
    const exception = new HttpException(
      { message: ['field must not be empty'] },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: RESPONSE_CATALOG.VALIDATION_ERROR.code,
        data: { errors: ['field must not be empty'] },
      }),
    );
  });

  it('should handle generic HttpException', () => {
    const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Forbidden' }),
    );
  });

  it('should handle unknown errors with 500 and INTERNAL_ERROR code', () => {
    const exception = new Error('Unexpected crash');

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: RESPONSE_CATALOG.INTERNAL_ERROR.code,
      }),
    );
  });
});
