export interface ApiSuccessResponse<T> {
  code: number;
  data: T;
}

export interface ApiErrorResponse {
  code: number;
  message: string;
  details?: unknown;
}

export const successResponse = <T>(code: number, data: T): ApiSuccessResponse<T> => ({
  code,
  data,
});

export const errorResponse = (code: number, message: string, details?: unknown): ApiErrorResponse =>
  details === undefined ? { code, message } : { code, message, details };
