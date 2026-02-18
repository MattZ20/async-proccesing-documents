import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from '../enums/document-type.enum.js';
import { Priority } from '../enums/priority.enum.js';

export class UploadDocumentDto {
  @ApiProperty({
    enum: DocumentType,
    description: 'Tipo de documento',
    example: DocumentType.INVOICE,
  })
  @IsNotEmpty()
  @IsEnum(DocumentType, {
    message: 'documentType debe ser: invoice, contract, report, other',
  })
  documentType: DocumentType;

  @ApiPropertyOptional({
    description: 'Descripcion del documento',
    maxLength: 500,
    example: 'Factura Q1 2025',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    enum: Priority,
    default: Priority.NORMAL,
    description: 'Prioridad del documento',
  })
  @IsOptional()
  @IsEnum(Priority, {
    message: 'priority debe ser: low, normal, high',
  })
  priority?: Priority = Priority.NORMAL;
}
