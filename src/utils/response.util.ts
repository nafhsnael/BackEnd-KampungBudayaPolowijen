import { Response } from 'express';

export interface ApiResponseOptions<T = any> {
  res: Response;
  statusCode?: number;
  message: string;
  data?: T;
  errors?: any;
}

export class ApiResponse {
  static success<T>({ res, statusCode = 200, message, data }: ApiResponseOptions<T>): Response {
    return res.status(statusCode).json({
      success: true,
      message,
      data: data ?? null,
    });
  }

  static error({ res, statusCode = 500, message, errors }: ApiResponseOptions): Response {
    return res.status(statusCode).json({
      success: false,
      message,
      ...(errors && { errors }),
    });
  }
}
