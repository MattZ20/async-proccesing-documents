import { Test, TestingModule } from '@nestjs/testing';
import { DocumentProcessor } from './document.processor';
import { StorageService } from '../storage/storage.service';
import { Job } from 'bullmq';

describe('DocumentProcessor', () => {
  let processor: DocumentProcessor;
  let storageService: StorageService;

  beforeEach(async () => {
    jest.useFakeTimers();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentProcessor,
        {
          provide: StorageService,
          useValue: {
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    processor = module.get<DocumentProcessor>(DocumentProcessor);
    storageService = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('process', () => {
    it('should update status to PROCESSING at start', async () => {
      const mockJob = {
        data: {
          requestId: 'test-123',
          originalName: 'test.pdf',
          mimeType: 'application/pdf',
          fileSize: 1024,
        },
        attemptsMade: 0,
      } as Job;

      // Math.random: primera llamada controla el delay (cualquier valor),
      // segunda llamada controla éxito/fallo: >= 0.8 => éxito
      jest.spyOn(Math, 'random').mockReturnValue(0.9);

      const processPromise = processor.process(mockJob);
      await jest.runAllTimersAsync();
      await processPromise;

      expect(storageService.update).toHaveBeenCalledWith(
        'test-123',
        expect.objectContaining({
          status: 'PROCESSING',
        }),
      );
    });

    it('should update status to COMPLETED on success', async () => {
      const mockJob = {
        data: {
          requestId: 'test-123',
          originalName: 'test.pdf',
          mimeType: 'application/pdf',
          fileSize: 1024,
        },
        attemptsMade: 0,
      } as Job;

      // >= 0.8 => éxito
      jest.spyOn(Math, 'random').mockReturnValue(0.9);

      const processPromise = processor.process(mockJob);
      await jest.runAllTimersAsync();
      const result = await processPromise;

      expect(result).toHaveProperty('pages');
      expect(result).toHaveProperty('fileSize');
      expect(result).toHaveProperty('processedAt');
      expect(result).toHaveProperty('processingTime');

      expect(storageService.update).toHaveBeenCalledWith(
        'test-123',
        expect.objectContaining({
          status: 'COMPLETED',
          metadata: expect.any(Object),
        }),
      );
    });

    it('should throw error and update to RETRYING on failure', async () => {
      const mockJob = {
        data: {
          requestId: 'test-123',
          originalName: 'test.pdf',
          mimeType: 'application/pdf',
          fileSize: 1024,
        },
        attemptsMade: 1,
      } as Job;

      // < 0.8 => fallo
      jest.spyOn(Math, 'random').mockReturnValue(0.5);

      const processPromise = processor.process(mockJob).catch((e) => e);
      await jest.runAllTimersAsync();
      const result = await processPromise;

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('Simulated processing failure');

      expect(storageService.update).toHaveBeenCalledWith(
        'test-123',
        expect.objectContaining({
          status: 'RETRYING',
          attempts: 2,
        }),
      );
    });
  });

  describe('onFailed', () => {
    it('should mark as ERROR when max attempts reached', () => {
      const mockJob = {
        data: { requestId: 'test-123' },
        attemptsMade: 3,
        opts: { attempts: 3 },
      } as Job;

      const error = new Error('Test error');

      processor.onFailed(mockJob, error);

      expect(storageService.update).toHaveBeenCalledWith(
        'test-123',
        expect.objectContaining({
          status: 'ERROR',
          error: 'Test error',
          attempts: 3,
        }),
      );
    });

    it('should not mark as ERROR when attempts remain', () => {
      const mockJob = {
        data: { requestId: 'test-123' },
        attemptsMade: 1,
        opts: { attempts: 3 },
      } as Job;

      const error = new Error('Test error');

      processor.onFailed(mockJob, error);

      // No debería llamar a update con status ERROR
      expect(storageService.update).not.toHaveBeenCalledWith(
        'test-123',
        expect.objectContaining({ status: 'ERROR' }),
      );
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });
});
