export interface SuccessResponse<T> {
  code: number;
  success: boolean;
  message: string;
  data: T;
}

export interface ErrorResponse {
  code: number;
  success: boolean;
  message: string;
}
