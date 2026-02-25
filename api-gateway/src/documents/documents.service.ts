import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import { UploadDocumentDto } from './dto/upload-document.dto.js';
import { RESPONSE_CATALOG } from '../common/constants/response-catalog.js';
import { BusinessException } from '../common/exceptions/business.exception.js';
import { StorageService } from '../storage/storage.service.js';
import { DocumentRecord } from '../common/interfaces/document-record.interface.js';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectQueue('document-processing') private readonly documentQueue: Queue,
    private readonly storageService: StorageService,
  ) {}

  async uploadDocument(file: Express.Multer.File, dto: UploadDocumentDto) {
    const requestId = uuidv4();

    const record: DocumentRecord = {
      requestId,
      status: 'PENDING',
      documentType: dto.documentType,
      description: dto.description,
      priority: dto.priority ?? 'normal',
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.storageService.create(record);

    await this.documentQueue.add(
      'process-document',
      {
        requestId,
        originalName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        documentType: dto.documentType,
        description: dto.description,
        priority: dto.priority,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: false,
        removeOnFail: false,
      },
    );

    return {
      code: RESPONSE_CATALOG.DOCUMENT_QUEUED.code,
      message: RESPONSE_CATALOG.DOCUMENT_QUEUED.message,
      data: {
        request_id: requestId,
        status: 'PENDING',
        documentType: dto.documentType,
        originalName: file.originalname,
      },
    };
  }

  getStatus(requestId: string) {
    const record = this.storageService.findById(requestId);

    if (!record) {
      throw new BusinessException(RESPONSE_CATALOG.DOCUMENT_NOT_FOUND, 404);
    }

    return {
      code: RESPONSE_CATALOG.STATUS_RETRIEVED.code,
      message: RESPONSE_CATALOG.STATUS_RETRIEVED.message,
      data: {
        request_id: record.requestId,
        status: record.status,
        metadata: record.metadata ?? null,
        error: record.error ?? null,
        attempts: record.attempts ?? null,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
    };
  }
}
