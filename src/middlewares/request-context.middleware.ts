import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { logger } from '../logger';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]{1,64}$/;

export const requestContextMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const suppliedId = req.header('X-Request-ID');
  req.requestId = suppliedId && REQUEST_ID_PATTERN.test(suppliedId)
    ? suppliedId
    : randomUUID();
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

export const requestLoggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const statusCode = res.statusCode;
    const fields = {
      message: 'HTTP request completed',
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode,
      durationMs: Number(process.hrtime.bigint() - startedAt) / 1_000_000,
    };

    if (statusCode >= 500) {
      logger.error(fields);
    } else if (statusCode >= 400) {
      logger.warn(fields);
    } else {
      logger.info(fields);
    }
  });

  next();
};
