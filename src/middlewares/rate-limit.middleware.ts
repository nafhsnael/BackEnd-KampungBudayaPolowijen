import type { Request } from 'express';
import rateLimit from 'express-rate-limit';
import { envConfig } from '../config/env.config';
import { ApiResponse } from '../utils/response.util';

const AUTH_ENDPOINTS = new Set([
  '/api/auth/login',
  '/api/auth/admin/login',
  '/api/auth/google',
]);

const isAuthEndpoint = (req: Request): boolean => {
  const path = req.originalUrl.split('?')[0].replace(/\/+$/, '').toLowerCase();
  return AUTH_ENDPOINTS.has(path);
};

const createRateLimiter = (
  windowMs: number,
  limit: number,
  message: string,
  skip?: (req: Request) => boolean
) =>
  rateLimit({
    windowMs,
    limit,
    skip,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      ApiResponse.error({
        res,
        statusCode: 429,
        message,
      });
    },
  });

export const apiRateLimiter = createRateLimiter(
  envConfig.API_RATE_LIMIT_WINDOW_MS,
  envConfig.API_RATE_LIMIT_MAX,
  'Terlalu banyak permintaan. Silakan coba lagi nanti.',
  isAuthEndpoint
);

export const authRateLimiter = createRateLimiter(
  envConfig.AUTH_RATE_LIMIT_WINDOW_MS,
  envConfig.AUTH_RATE_LIMIT_MAX,
  'Terlalu banyak percobaan autentikasi. Silakan coba lagi nanti.'
);
