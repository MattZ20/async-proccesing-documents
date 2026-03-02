import { ResponseInterceptor } from './response.interceptor';
import { of } from 'rxjs';

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor<unknown>;
  let mockRequest: any;
  let mockContext: any;
  let mockCallHandler: any;

  beforeEach(() => {
    interceptor = new ResponseInterceptor();
    mockRequest = {};
    mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    };
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should wrap structured response (with code+message) and add traceId', (done) => {
    const payload = { code: 1000, message: 'OK', data: { id: '123' } };
    mockCallHandler = { handle: jest.fn().mockReturnValue(of(payload)) };

    interceptor.intercept(mockContext, mockCallHandler).subscribe((result) => {
      expect(result).toMatchObject({
        code: 1000,
        message: 'OK',
        data: { id: '123' },
      });
      expect(result.traceId).toBeDefined();
      expect(result.timestamp).toBeDefined();
      done();
    });
  });

  it('should wrap unstructured response with default code 1000', (done) => {
    const payload = { someField: 'value' };
    mockCallHandler = { handle: jest.fn().mockReturnValue(of(payload)) };

    interceptor.intercept(mockContext, mockCallHandler).subscribe((result) => {
      expect(result.code).toBe(1000);
      expect(result.data).toEqual(payload);
      done();
    });
  });

  it('should reuse existing traceId if already set on request', (done) => {
    mockRequest.traceId = 'existing-trace-id';
    mockCallHandler = {
      handle: jest.fn().mockReturnValue(of({ code: 1000, message: 'OK' })),
    };

    interceptor.intercept(mockContext, mockCallHandler).subscribe((result) => {
      expect(result.traceId).toBe('existing-trace-id');
      done();
    });
  });
});
