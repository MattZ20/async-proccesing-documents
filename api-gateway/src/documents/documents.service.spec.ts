import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { DocumentsService } from './documents.service.js';
import { StorageService } from '../storage/storage.service.js';
import { RESPONSE_CATALOG } from '../common/constants/response-catalog.js';
import { BusinessException } from '../common/exceptions/business.exception.js';
import { DocumentType } from './enums/document-type.enum.js';
import { Priority } from './enums/priority.enum.js';

describe('DocumentsService', () => {
  let service: DocumentsService;
  let storageService: StorageService;
  let mockQueue: any;

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        {
          provide: getQueueToken('document-processing'),
          useValue: mockQueue,
        },
        {
          provide: StorageService,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
    storageService = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadDocument', () => {
    it('should create a document record and enqueue a job', async () => {
      const mockFile: Express.Multer.File = {
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        size: 1024,
      } as Express.Multer.File;

      const dto = {
        documentType: DocumentType.INVOICE,
        description: 'Test document',
        priority: Priority.HIGH,
      };

      const result = await service.uploadDocument(mockFile, dto);

      expect(storageService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'PENDING',
          documentType: DocumentType.INVOICE,
          priority: Priority.HIGH,
          originalName: 'test.pdf',
          mimeType: 'application/pdf',
          fileSize: 1024,
        }),
      );

      expect(mockQueue.add).toHaveBeenCalledWith(
        'process-document',
        expect.objectContaining({
          originalName: 'test.pdf',
          mimeType: 'application/pdf',
          fileSize: 1024,
          documentType: DocumentType.INVOICE,
        }),
        expect.objectContaining({
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
        }),
      );

      expect(result).toEqual({
        code: RESPONSE_CATALOG.DOCUMENT_QUEUED.code,
        message: RESPONSE_CATALOG.DOCUMENT_QUEUED.message,
        data: expect.objectContaining({
          status: 'PENDING',
          documentType: DocumentType.INVOICE,
          originalName: 'test.pdf',
        }),
      });
    });

    it('should use default priority when not provided', async () => {
      const mockFile: Express.Multer.File = {
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        size: 1024,
      } as Express.Multer.File;

      const dto = {
        documentType: DocumentType.INVOICE,
      };

      await service.uploadDocument(mockFile, dto as any);

      expect(storageService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 'normal',
        }),
      );
    });
  });

  describe('getStatus', () => {
    it('should return document status when found', () => {
      const mockRecord = {
        requestId: 'test-uuid',
        status: 'COMPLETED' as const,
        documentType: 'invoice',
        priority: 'high',
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:05:00.000Z',
        metadata: {
          pages: 5,
          fileSize: '1.00 MB',
          originalName: 'test.pdf',
          mimeType: 'application/pdf',
          processedAt: '2026-01-01T00:05:00.000Z',
          processingTime: '5.0s',
        },
      };

      jest.spyOn(storageService, 'findById').mockReturnValue(mockRecord);

      const result = service.getStatus('test-uuid');

      expect(result).toEqual({
        code: RESPONSE_CATALOG.STATUS_RETRIEVED.code,
        message: RESPONSE_CATALOG.STATUS_RETRIEVED.message,
        data: expect.objectContaining({
          request_id: 'test-uuid',
          status: 'COMPLETED',
          metadata: mockRecord.metadata,
        }),
      });
    });

    it('should throw BusinessException when document not found', () => {
      jest.spyOn(storageService, 'findById').mockReturnValue(undefined);

      expect(() => service.getStatus('non-existent-uuid')).toThrow(
        BusinessException,
      );

      expect(() => service.getStatus('non-existent-uuid')).toThrow(
        expect.objectContaining({
          catalogCode: RESPONSE_CATALOG.DOCUMENT_NOT_FOUND.code,
        }),
      );
    });
  });
});
