import { FileSizeValidationPipe } from './file-size-validation.pipe.js';
import { BusinessException } from '../../common/exceptions/business.exception.js';
import { RESPONSE_CATALOG } from '../../common/constants/response-catalog.js';

describe('FileSizeValidationPipe', () => {
  let pipe: FileSizeValidationPipe;

  beforeEach(() => {
    pipe = new FileSizeValidationPipe();
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should pass with valid file size', () => {
    const mockFile: Express.Multer.File = {
      size: 1024 * 1024, // 1MB
      originalname: 'test.pdf',
      mimetype: 'application/pdf',
    } as Express.Multer.File;

    expect(pipe.transform(mockFile)).toBe(mockFile);
  });

  it('should throw BusinessException when file is missing', () => {
    expect(() => pipe.transform(null as any)).toThrow(BusinessException);
    expect(() => pipe.transform(null as any)).toThrow(
      expect.objectContaining({
        catalogCode: RESPONSE_CATALOG.FILE_REQUIRED.code,
      }),
    );
  });

  it('should throw BusinessException when file exceeds 5MB', () => {
    const mockFile: Express.Multer.File = {
      size: 6 * 1024 * 1024, // 6MB
      originalname: 'large.pdf',
      mimetype: 'application/pdf',
    } as Express.Multer.File;

    expect(() => pipe.transform(mockFile)).toThrow(BusinessException);
    expect(() => pipe.transform(mockFile)).toThrow(
      expect.objectContaining({
        catalogCode: RESPONSE_CATALOG.FILE_SIZE_EXCEEDED.code,
      }),
    );
  });

  it('should pass with file exactly at 5MB limit', () => {
    const mockFile: Express.Multer.File = {
      size: 5 * 1024 * 1024, // 5MB exactly
      originalname: 'limit.pdf',
      mimetype: 'application/pdf',
    } as Express.Multer.File;

    expect(pipe.transform(mockFile)).toBe(mockFile);
  });
});
