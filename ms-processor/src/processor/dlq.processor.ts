import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { StorageService } from '../storage/storage.service.js';

@Processor('document-processing-dlq')
export class DlqProcessor extends WorkerHost {
  private readonly logger = new Logger(DlqProcessor.name);

  constructor(private readonly storageService: StorageService) {
    super();
  }

  async process(job: Job): Promise<void> {
    const { requestId, originalError, originalAttempts } = job.data as {
      requestId: string;
      originalError: string;
      originalAttempts: number;
    };

    this.logger.error(
      `[DLQ] Document ${requestId} reached dead letter after ${originalAttempts} attempts: ${originalError}`,
    );

    this.storageService.update(requestId, {
      status: 'DEAD_LETTER',
      error: originalError,
      attempts: originalAttempts,
      updatedAt: new Date().toISOString(),
    });
  }
}
