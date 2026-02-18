import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { DocumentsService } from './documents.service.js';
import { UploadDocumentDto } from './dto/upload-document.dto.js';
import { ApiKeyGuard } from './guards/api-key.guard.js';
import { FileSizeValidationPipe } from './pipes/file-size-validation.pipe.js';
import { FileTypeValidationPipe } from './pipes/file-type-validation.pipe.js';

@ApiTags('Documents')
@ApiSecurity('x-api-key')
@Controller('documents')
@UseGuards(ApiKeyGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Subir documento para procesamiento' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  uploadDocument(
    @UploadedFile(new FileSizeValidationPipe(), new FileTypeValidationPipe())
    file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
  ) {
    return this.documentsService.processDocument(file, dto);
  }
}
