import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';
import * as fs from 'fs';

jest.mock('fs');

describe('StorageService', () => {
  let service: StorageService;
  const mockFilePath = '/test/storage.json';
  let mockFileData: Record<string, any> = {};

  beforeEach(async () => {
    mockFileData = {};

    // Mock filesystem
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockImplementation(() =>
      JSON.stringify(mockFileData),
    );
    (fs.writeFileSync as jest.Mock).mockImplementation(
      (_path: string, data: string) => {
        mockFileData = JSON.parse(data);
      },
    );
    (fs.mkdirSync as jest.Mock).mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(mockFilePath),
          },
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should create directory and file when they do not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      service.onModuleInit();

      expect(fs.mkdirSync).toHaveBeenCalledWith(
        expect.any(String),
        { recursive: true },
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        mockFilePath,
        JSON.stringify({}, null, 2),
      );
    });

    it('should not overwrite file when it already exists', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.writeFileSync as jest.Mock).mockClear();

      service.onModuleInit();

      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
  });

  describe('readAll error handling', () => {
    it('should return empty object when file read throws', () => {
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('disk error');
      });

      // findById internally calls readAll
      expect(service.findById('any')).toBeUndefined();
    });
  });

  describe('create', () => {
    it('should create a new document record', () => {
      const mockRecord = {
        requestId: 'test-123',
        status: 'PENDING' as const,
        documentType: 'invoice',
        priority: 'high',
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      service.create(mockRecord);

      expect(mockFileData['test-123']).toEqual(mockRecord);
    });
  });

  describe('findById', () => {
    it('should return document record if exists', () => {
      const mockRecord = {
        requestId: 'test-123',
        status: 'COMPLETED' as const,
        documentType: 'invoice',
        priority: 'high',
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:05:00.000Z',
      };

      mockFileData = { 'test-123': mockRecord };

      const result = service.findById('test-123');

      expect(result).toEqual(mockRecord);
    });

    it('should return undefined if document not found', () => {
      mockFileData = {};

      const result = service.findById('non-existent');

      expect(result).toBeUndefined();
    });
  });

  describe('update', () => {
    it('should update existing document record', () => {
      const existingRecord = {
        requestId: 'test-123',
        status: 'PENDING' as const,
        documentType: 'invoice',
        priority: 'high',
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      mockFileData = { 'test-123': existingRecord };

      service.update('test-123', {
        status: 'COMPLETED',
        updatedAt: '2026-01-01T00:05:00.000Z',
      });

      expect(mockFileData['test-123'].status).toBe('COMPLETED');
      expect(mockFileData['test-123'].updatedAt).toBe(
        '2026-01-01T00:05:00.000Z',
      );
      expect(mockFileData['test-123'].originalName).toBe('test.pdf');
    });

    it('should not update if document does not exist', () => {
      mockFileData = {};

      service.update('non-existent', { status: 'COMPLETED' });

      expect(mockFileData['non-existent']).toBeUndefined();
    });
  });
});
