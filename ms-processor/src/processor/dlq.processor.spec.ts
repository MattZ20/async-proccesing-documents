import { Test, TestingModule } from '@nestjs/testing';
import { DlqProcessor } from './dlq.processor';
import { StorageService } from '../storage/storage.service';
import { Job } from 'bullmq';

describe('DlqProcessor', () => {
  let processor: DlqProcessor;
  let storageService: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DlqProcessor,
        {
          provide: StorageService,
          useValue: { update: jest.fn() },
        },
      ],
    }).compile();

    processor = module.get<DlqProcessor>(DlqProcessor);
    storageService = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  it('should update status to DEAD_LETTER', async () => {
    const mockJob = {
      data: {
        requestId: 'test-123',
        originalError: 'Simulated processing failure',
        originalAttempts: 3,
        originalJobData: {},
        failedAt: '2026-01-01T00:00:00.000Z',
      },
    } as Job;

    await processor.process(mockJob);

    expect(storageService.update).toHaveBeenCalledWith(
      'test-123',
      expect.objectContaining({
        status: 'DEAD_LETTER',
        error: 'Simulated processing failure',
        attempts: 3,
      }),
    );
  });

  it('should log the error with [DLQ] prefix', async () => {
    const logSpy = jest
      .spyOn((processor as any).logger, 'error')
      .mockImplementation(() => {});

    const mockJob = {
      data: {
        requestId: 'test-456',
        originalError: 'Disk full',
        originalAttempts: 3,
        originalJobData: {},
        failedAt: '2026-01-01T00:00:00.000Z',
      },
    } as Job;

    await processor.process(mockJob);

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('[DLQ]'),
    );
  });
});
