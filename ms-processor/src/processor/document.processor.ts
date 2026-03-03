import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { StorageService } from '../storage/storage.service.js';
import { DocumentMetadata } from '../common/interfaces/document-record.interface.js';

@Processor('document-processing')
export class DocumentProcessor extends WorkerHost {
  private readonly logger = new Logger(DocumentProcessor.name);

  constructor(
    private readonly storageService: StorageService,
    @InjectQueue('document-processing-dlq') private readonly dlqQueue: Queue,
  ) {
    super();
  }

  async process(job: Job): Promise<DocumentMetadata> {
    const { requestId, originalName, mimeType, fileSize } = job.data as {
      requestId: string;
      originalName: string;
      mimeType: string;
      fileSize: number;
    };

    this.logger.log(`Processing document ${requestId} (attempt ${job.attemptsMade + 1})`);

    // 1. Update status to PROCESSING
    this.storageService.update(requestId, {
      status: 'PROCESSING',
      updatedAt: new Date().toISOString(),
    });

    // 2. Simulate processing delay (5-10 seconds)
    const delay = Math.floor(Math.random() * 5000) + 5000;
    await new Promise((resolve) => setTimeout(resolve, delay));

    // 3. Simulate random failure (~20% chance) for retry testing
    if (Math.random() < 0.8) {
      this.logger.warn(`Simulated failure for document ${requestId}`);

      this.storageService.update(requestId, {
        status: 'RETRYING',
        attempts: job.attemptsMade + 1,
        updatedAt: new Date().toISOString(),
      });

      throw new Error('Simulated processing failure');
    }

    // 4. Generate mock metadata
    const metadata: DocumentMetadata = {
      pages: Math.floor(Math.random() * 50) + 1,
      fileSize: (fileSize / (1024 * 1024)).toFixed(2) + ' MB',
      originalName,
      mimeType,
      processedAt: new Date().toISOString(),
      processingTime: (delay / 1000).toFixed(1) + 's',
    };

    // 5. Update status to COMPLETED
    this.storageService.update(requestId, {
      status: 'COMPLETED',
      metadata,
      updatedAt: new Date().toISOString(),
    });

    this.logger.log(`Document ${requestId} processed successfully`);

    return metadata;
  }

  onFailed(job: Job, error: Error): void {
    const { requestId } = job.data as { requestId: string };

    if (job.attemptsMade >= (job.opts.attempts ?? 3)) {
      this.logger.error(
        `Document ${requestId} failed permanently after ${job.attemptsMade} attempts, sending to DLQ`,
      );

      void this.dlqQueue.add('dead-letter', {
        requestId,
        originalError: error.message,
        originalAttempts: job.attemptsMade,
        originalJobData: job.data,
        failedAt: new Date().toISOString(),
      });
    } else {
      this.logger.warn(
        `Document ${requestId} failed attempt ${job.attemptsMade}, will retry`,
      );
    }
  }
}
