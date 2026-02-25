import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { DocumentRecord } from '../common/interfaces/document-record.interface.js';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly filePath: string;

  constructor(private readonly configService: ConfigService) {
    this.filePath = this.configService.get<string>('storagePath')!;
  }

  onModuleInit(): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify({}, null, 2));
      this.logger.log(`Created storage file at ${this.filePath}`);
    }
  }

  private readAll(): Record<string, DocumentRecord> {
    try {
      const content = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(content) as Record<string, DocumentRecord>;
    } catch {
      return {};
    }
  }

  private writeAll(records: Record<string, DocumentRecord>): void {
    fs.writeFileSync(this.filePath, JSON.stringify(records, null, 2));
  }

  create(record: DocumentRecord): void {
    const records = this.readAll();
    records[record.requestId] = record;
    this.writeAll(records);
  }

  findById(requestId: string): DocumentRecord | undefined {
    const records = this.readAll();
    return records[requestId];
  }

  update(requestId: string, partial: Partial<DocumentRecord>): void {
    const records = this.readAll();
    const existing = records[requestId];
    if (existing) {
      records[requestId] = { ...existing, ...partial };
      this.writeAll(records);
    }
  }
}
