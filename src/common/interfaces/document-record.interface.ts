export type DocumentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'RETRYING'
  | 'ERROR';

export interface DocumentMetadata {
  pages: number;
  fileSize: string;
  originalName: string;
  mimeType: string;
  processedAt: string;
  processingTime: string;
}

export interface DocumentRecord {
  requestId: string;
  status: DocumentStatus;
  documentType: string;
  description?: string;
  priority: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  updatedAt: string;
  metadata?: DocumentMetadata;
  error?: string;
  attempts?: number;
}
