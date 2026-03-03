import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DocumentProcessor } from './document.processor.js';
import { DlqProcessor } from './dlq.processor.js';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'document-processing' },
      { name: 'document-processing-dlq' },
    ),
  ],
  providers: [DocumentProcessor, DlqProcessor],
})
export class ProcessorModule {}
