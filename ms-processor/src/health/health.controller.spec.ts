import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HealthController } from './health.controller';

// Mock ioredis to avoid real network calls
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    ping: jest.fn(),
    quit: jest.fn(),
  }));
});

describe('HealthController', () => {
  let controller: HealthController;
  let RedisMock: jest.Mock;

  beforeEach(async () => {
    RedisMock = require('ioredis') as jest.Mock;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'redis.host') return 'localhost';
              if (key === 'redis.port') return 6379;
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return status ok when Redis responds to ping', async () => {
    RedisMock.mockImplementation(() => ({
      connect: jest.fn().mockResolvedValue(undefined),
      ping: jest.fn().mockResolvedValue('PONG'),
      quit: jest.fn().mockResolvedValue(undefined),
    }));

    const result = await controller.check();

    expect(result.status).toBe('ok');
    expect(result.checks.redis.status).toBe('up');
  });

  it('should return status error when Redis connection fails', async () => {
    RedisMock.mockImplementation(() => ({
      connect: jest.fn().mockRejectedValue(new Error('Connection refused')),
      ping: jest.fn(),
      quit: jest.fn(),
    }));

    const result = await controller.check();

    expect(result.status).toBe('error');
    expect(result.checks.redis.status).toBe('down');
  });
});
