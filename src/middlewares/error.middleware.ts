import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { AppError, ValidationError } from '../errors/app.error';
import { envConfig } from '../config/env.config';
import { logger } from '../logger';
import { ApiResponse } from '../utils/response.util';

export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const isProduction = envConfig.NODE_ENV === 'production';
  const logFields = {
    requestId: req.requestId,
    errorName: err.name,
    errorMessage: isProduction ? 'Request failed' : err.message,
    ...(!isProduction ? { stack: err.stack } : {}),
  };

  if (err instanceof multer.MulterError) {
    logger.warn({ ...logFields, statusCode: 400 });
    let message = 'Kesalahan saat mengunggah file';
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'Ukuran file melebihi batas maksimal (5 MB)';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = `Field upload tidak sesuai: ${err.field || ''}`;
    }
    ApiResponse.error({
      res,
      statusCode: 400,
      message,
    });
    return;
  }

  const parserError = err as Error & { type?: string };
  if (parserError.type === 'entity.parse.failed') {
    logger.warn({ ...logFields, statusCode: 400 });
    ApiResponse.error({
      res,
      statusCode: 400,
      message: 'Request body JSON tidak valid.',
    });
    return;
  }

  if (parserError.type === 'entity.too.large') {
    logger.warn({ ...logFields, statusCode: 413 });
    ApiResponse.error({
      res,
      statusCode: 413,
      message: 'Ukuran request melebihi batas yang diizinkan.',
    });
    return;
  }

  if (err instanceof AppError && err.isOperational && err.statusCode >= 400 && err.statusCode < 500) {
    logger.warn({ ...logFields, statusCode: err.statusCode });
    ApiResponse.error({
      res,
      statusCode: err.statusCode,
      message: err.message,
      ...(err instanceof ValidationError ? { errors: err.errors } : {}),
    });
    return;
  }

  logger.error({
    ...logFields,
    errorMessage: err.message,
    stack: err.stack,
    statusCode: 500,
  });
  ApiResponse.error({
    res,
    statusCode: 500,
    message: isProduction ? 'Internal Server Error' : err.message || 'Something went wrong',
  });
};
