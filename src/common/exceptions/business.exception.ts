import { HttpException } from '@nestjs/common';
import { CatalogEntry } from '../constants/response-catalog.js';

export class BusinessException extends HttpException {
  public readonly catalogCode: number;
  public readonly catalogMessage: string;

  constructor(
    catalogEntry: CatalogEntry,
    httpStatus: number,
    details?: string,
  ) {
    super(details || catalogEntry.message, httpStatus);
    this.catalogCode = catalogEntry.code;
    this.catalogMessage = catalogEntry.message;
  }
}
