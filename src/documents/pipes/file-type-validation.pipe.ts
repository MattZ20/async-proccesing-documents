import { Injectable, PipeTransform } from '@nestjs/common';
import { BusinessException } from '../../common/exceptions/business.exception.js';
import { RESPONSE_CATALOG } from '../../common/constants/response-catalog.js';

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];

@Injectable()
export class FileTypeValidationPipe implements PipeTransform {
  transform(file: Express.Multer.File): Express.Multer.File {
    if (!file) {
      return file;
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BusinessException(
        RESPONSE_CATALOG.FILE_TYPE_NOT_ALLOWED,
        400,
        'Tipo de archivo no permitido. Use: pdf, png, jpg, jpeg',
      );
    }

    return file;
  }
}
