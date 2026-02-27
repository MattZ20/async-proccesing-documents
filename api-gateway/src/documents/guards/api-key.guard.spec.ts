import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiKeyGuard } from './api-key.guard.js';
import { BusinessException } from '../../common/exceptions/business.exception.js';
import { RESPONSE_CATALOG } from '../../common/constants/response-catalog.js';

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyGuard,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('valid-api-key'),
          },
        },
      ],
    }).compile();

    guard = module.get<ApiKeyGuard>(ApiKeyGuard);
    configService = module.get<ConfigService>(ConfigService);
  });

  const createMockContext = (apiKey?: string): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: apiKey ? { 'x-api-key': apiKey } : {},
        }),
      }),
    } as ExecutionContext;
  };

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow request with valid API key', () => {
    const context = createMockContext('valid-api-key');

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw BusinessException when API key is missing', () => {
    const context = createMockContext();

    expect(() => guard.canActivate(context)).toThrow(BusinessException);
    expect(() => guard.canActivate(context)).toThrow(
      expect.objectContaining({
        catalogCode: RESPONSE_CATALOG.API_KEY_REQUIRED.code,
      }),
    );
  });

  it('should throw BusinessException when API key is invalid', () => {
    const context = createMockContext('invalid-api-key');

    expect(() => guard.canActivate(context)).toThrow(BusinessException);
    expect(() => guard.canActivate(context)).toThrow(
      expect.objectContaining({
        catalogCode: RESPONSE_CATALOG.API_KEY_INVALID.code,
      }),
    );
  });
});
