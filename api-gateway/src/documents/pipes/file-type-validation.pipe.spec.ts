import { FileTypeValidationPipe } from './file-type-validation.pipe';
import { BusinessException } from '../../common/exceptions/business.exception';

describe('FileTypeValidationPipe', () => {
  let pipe: FileTypeValidationPipe;

  beforeEach(() => {
    pipe = new FileTypeValidationPipe();
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should pass through a valid PDF file', () => {
    const file = { mimetype: 'application/pdf' } as Express.Multer.File;
    expect(pipe.transform(file)).toBe(file);
  });

  it('should pass through a valid PNG file', () => {
    const file = { mimetype: 'image/png' } as Express.Multer.File;
    expect(pipe.transform(file)).toBe(file);
  });

  it('should pass through a valid JPEG file', () => {
    const file = { mimetype: 'image/jpeg' } as Express.Multer.File;
    expect(pipe.transform(file)).toBe(file);
  });

  it('should throw BusinessException for a disallowed file type', () => {
    const file = { mimetype: 'text/plain' } as Express.Multer.File;
    expect(() => pipe.transform(file)).toThrow(BusinessException);
  });

  it('should return file as-is when no file is provided', () => {
    expect(pipe.transform(null as any)).toBeNull();
  });
});
