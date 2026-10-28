import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { AppError } from '../errors/app.error';
import { ApiResponse } from '../utils/response.util';

export const globalErrorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  console.error('💥 Error Caught in Middleware:', err);

  // Handle Multer upload errors
  if (err instanceof multer.MulterError || err.name === 'MulterError') {
    let message = 'Kesalahan saat mengunggah file';
    if ((err as any).code === 'LIMIT_FILE_SIZE') {
      message = 'Ukuran file melebihi batas maksimal (5 MB)';
    } else if ((err as any).code === 'LIMIT_UNEXPECTED_FILE') {
      message = `Field upload tidak sesuai: ${(err as any).field || ''}`;
    }
    return ApiResponse.error({
      res,
      statusCode: 400,
      message,
    });
  }

  if (err instanceof AppError) {
    let parsedErrors: any = undefined;
    
    // Check if error message is JSON stringified validation error list
    try {
      if (err.message.startsWith('[')) {
        parsedErrors = JSON.parse(err.message);
        return ApiResponse.error({
          res,
          statusCode: err.statusCode,
          message: 'Validation Error',
          errors: parsedErrors,
        });
      }
    } catch {
      // Not JSON, continue normally
    }

    return ApiResponse.error({
      res,
      statusCode: err.statusCode,
      message: err.message,
    });
  }

  // Handle generic / unexpected server error
  return ApiResponse.error({
    res,
    statusCode: 500,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal Server Error' 
      : err.message || 'Something went wrong',
  });
};
