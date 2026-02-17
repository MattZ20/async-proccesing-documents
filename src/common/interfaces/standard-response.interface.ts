export interface StandardResponse<T = any> {
  code: number;
  message: string;
  data: T | null;
  timestamp: string;
  traceId: string | null;
}
