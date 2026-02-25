import { Injectable, PipeTransform } from '@nestjs/common';
import { BusinessException } from '../../common/exceptions/business.exception.js';
import { RESPONSE_CATALOG } from '../../common/constants/response-catalog.js';

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

@Injectable()
export class FileSizeValidationPipe implements PipeTransform {
  transform(file: Express.Multer.File): Express.Multer.File {
    if (!file) {
      throw new BusinessException(RESPONSE_CATALOG.FILE_REQUIRED, 400);
    }

    if (file.size > MAX_SIZE_BYTES) {
      throw new BusinessException(
        RESPONSE_CATALOG.FILE_SIZE_EXCEEDED,
        400,
        'Archivo excede tamaño máximo de 5MB',
      );
    }

    return file;
  }
}
