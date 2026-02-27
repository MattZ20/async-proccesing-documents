import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { StorageService } from '../src/storage/storage.service';
import { RESPONSE_CATALOG } from '../src/common/constants/response-catalog';

describe('API Gateway (e2e)', () => {
  let app: INestApplication;
  let storageService: StorageService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    storageService = app.get<StorageService>(StorageService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/health (GET)', () => {
    it('should return health status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('code', RESPONSE_CATALOG.HEALTHY.code);
          expect(res.body).toHaveProperty('message');
          expect(res.body.data).toHaveProperty('status');
          expect(res.body.data).toHaveProperty('uptime');
        });
    });
  });

  describe('/documents/upload (POST)', () => {
    const validApiKey = process.env.API_KEY || 'my-secret-api-key-12345';

    it('should reject request without API key', () => {
      return request(app.getHttpServer())
        .post('/documents/upload')
        .expect(401)
        .expect((res) => {
          expect(res.body.code).toBe(RESPONSE_CATALOG.API_KEY_REQUIRED.code);
        });
    });

    it('should reject request with invalid API key', () => {
      return request(app.getHttpServer())
        .post('/documents/upload')
        .set('x-api-key', 'invalid-key')
        .expect(401)
        .expect((res) => {
          expect(res.body.code).toBe(RESPONSE_CATALOG.API_KEY_INVALID.code);
        });
    });

    it('should reject request without file', () => {
      return request(app.getHttpServer())
        .post('/documents/upload')
        .set('x-api-key', validApiKey)
        .field('documentType', 'invoice')
        .expect(400)
        .expect((res) => {
          expect(res.body.code).toBe(RESPONSE_CATALOG.FILE_REQUIRED.code);
        });
    });

    it('should reject file with invalid type', () => {
      return request(app.getHttpServer())
        .post('/documents/upload')
        .set('x-api-key', validApiKey)
        .field('documentType', 'invoice')
        .attach('file', Buffer.from('test'), {
          filename: 'test.txt',
          contentType: 'text/plain',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.code).toBe(
            RESPONSE_CATALOG.FILE_TYPE_NOT_ALLOWED.code,
          );
        });
    });

    it('should reject file exceeding size limit', () => {
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
      return request(app.getHttpServer())
        .post('/documents/upload')
        .set('x-api-key', validApiKey)
        .field('documentType', 'invoice')
        .attach('file', largeBuffer, {
          filename: 'large.pdf',
          contentType: 'application/pdf',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.code).toBe(
            RESPONSE_CATALOG.FILE_SIZE_EXCEEDED.code,
          );
        });
    });

    it('should reject request with invalid documentType', () => {
      return request(app.getHttpServer())
        .post('/documents/upload')
        .set('x-api-key', validApiKey)
        .field('documentType', 'invalid-type')
        .attach('file', Buffer.from('test'), {
          filename: 'test.pdf',
          contentType: 'application/pdf',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.code).toBe(RESPONSE_CATALOG.VALIDATION_ERROR.code);
        });
    });

    it('should successfully upload a valid document', () => {
      return request(app.getHttpServer())
        .post('/documents/upload')
        .set('x-api-key', validApiKey)
        .field('documentType', 'invoice')
        .field('description', 'Test invoice')
        .field('priority', 'high')
        .attach('file', Buffer.from('test pdf content'), {
          filename: 'test.pdf',
          contentType: 'application/pdf',
        })
        .expect(202)
        .expect((res) => {
          expect(res.body.code).toBe(RESPONSE_CATALOG.DOCUMENT_QUEUED.code);
          expect(res.body.data).toHaveProperty('request_id');
          expect(res.body.data.status).toBe('PENDING');
          expect(res.body.data.documentType).toBe('invoice');
          expect(res.body).toHaveProperty('traceId');
        });
    });
  });

  describe('/documents/:request_id/status (GET)', () => {
    const validApiKey = process.env.API_KEY || 'my-secret-api-key-12345';
    let requestId: string;

    beforeAll(() => {
      // Create a mock document in storage
      const mockRecord = {
        requestId: 'test-request-id',
        status: 'COMPLETED' as const,
        documentType: 'invoice',
        priority: 'high',
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          pages: 5,
          fileSize: '1.00 MB',
          originalName: 'test.pdf',
          mimeType: 'application/pdf',
          processedAt: new Date().toISOString(),
          processingTime: '5.0s',
        },
      };

      storageService.create(mockRecord);
      requestId = mockRecord.requestId;
    });

    it('should reject request without API key', () => {
      return request(app.getHttpServer())
        .get(`/documents/${requestId}/status`)
        .expect(401)
        .expect((res) => {
          expect(res.body.code).toBe(RESPONSE_CATALOG.API_KEY_REQUIRED.code);
        });
    });

    it('should return 404 for non-existent document', () => {
      return request(app.getHttpServer())
        .get('/documents/non-existent-uuid/status')
        .set('x-api-key', validApiKey)
        .expect(404)
        .expect((res) => {
          expect(res.body.code).toBe(RESPONSE_CATALOG.DOCUMENT_NOT_FOUND.code);
        });
    });

    it('should return document status for valid request_id', () => {
      return request(app.getHttpServer())
        .get(`/documents/${requestId}/status`)
        .set('x-api-key', validApiKey)
        .expect(200)
        .expect((res) => {
          expect(res.body.code).toBe(RESPONSE_CATALOG.STATUS_RETRIEVED.code);
          expect(res.body.data.request_id).toBe(requestId);
          expect(res.body.data.status).toBe('COMPLETED');
          expect(res.body.data).toHaveProperty('metadata');
          expect(res.body).toHaveProperty('traceId');
        });
    });
  });
});
