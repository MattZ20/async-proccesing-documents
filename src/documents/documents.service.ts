import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { UploadDocumentDto } from './dto/upload-document.dto.js';
import { RESPONSE_CATALOG } from '../common/constants/response-catalog.js';

@Injectable()
export class DocumentsService {
  processDocument(file: Express.Multer.File, dto: UploadDocumentDto) {
    const requestId = uuidv4();

    return {
      code: RESPONSE_CATALOG.DOCUMENT_QUEUED.code,
      message: RESPONSE_CATALOG.DOCUMENT_QUEUED.message,
      data: {
        request_id: requestId,
        status: 'COMPLETED',
        documentType: dto.documentType,
        originalName: file.originalname,
      },
    };
  }
}
