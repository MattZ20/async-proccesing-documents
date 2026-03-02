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
          useValue: { get: jest.fn().mockReturnValue(mockFilePath) },
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create the storage file if it does not exist', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    service.onModuleInit();
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      mockFilePath,
      JSON.stringify({}, null, 2),
    );
  });

  describe('create', () => {
    it('should persist a new document record', () => {
      const record = {
        requestId: 'abc-123',
        status: 'PENDING' as const,
        documentType: 'invoice',
        priority: 'normal',
        originalName: 'doc.pdf',
        mimeType: 'application/pdf',
        fileSize: 2048,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      service.create(record);

      expect(mockFileData['abc-123']).toEqual(record);
    });
  });

  describe('findById', () => {
    it('should return the record when it exists', () => {
      const record = {
        requestId: 'abc-123',
        status: 'COMPLETED' as const,
        documentType: 'invoice',
        priority: 'high',
        originalName: 'doc.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:05:00.000Z',
      };
      mockFileData = { 'abc-123': record };

      expect(service.findById('abc-123')).toEqual(record);
    });

    it('should return undefined when the record does not exist', () => {
      mockFileData = {};
      expect(service.findById('missing')).toBeUndefined();
    });
  });

  describe('update', () => {
    it('should merge partial updates into an existing record', () => {
      const base = {
        requestId: 'abc-123',
        status: 'PENDING' as const,
        documentType: 'invoice',
        priority: 'normal',
        originalName: 'doc.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };
      mockFileData = { 'abc-123': base };

      service.update('abc-123', {
        status: 'COMPLETED',
        updatedAt: '2026-01-01T00:05:00.000Z',
      });

      expect(mockFileData['abc-123'].status).toBe('COMPLETED');
      expect(mockFileData['abc-123'].originalName).toBe('doc.pdf');
    });

    it('should do nothing when the record does not exist', () => {
      mockFileData = {};
      service.update('missing', { status: 'COMPLETED' });
      expect(mockFileData['missing']).toBeUndefined();
    });
  });

  describe('readAll error handling', () => {
    it('should return empty object when file content is invalid JSON', () => {
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('read error');
      });

      // findById triggers readAll internally
      expect(service.findById('any')).toBeUndefined();
    });
  });
});
