import { Injectable } from '@nestjs/common';
import {
  DocumentRecord,
} from '../common/interfaces/document-record.interface.js';

@Injectable()
export class StorageService {
  private readonly records = new Map<string, DocumentRecord>();

  create(record: DocumentRecord): void {
    this.records.set(record.requestId, record);
  }

  findById(requestId: string): DocumentRecord | undefined {
    return this.records.get(requestId);
  }

  update(requestId: string, partial: Partial<DocumentRecord>): void {
    const existing = this.records.get(requestId);
    if (existing) {
      this.records.set(requestId, { ...existing, ...partial });
    }
  }
}
