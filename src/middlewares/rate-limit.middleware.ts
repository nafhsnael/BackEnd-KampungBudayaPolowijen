import rateLimit from 'express-rate-limit';
import { envConfig } from '../config/env.config';
import { ApiResponse } from '../utils/response.util';

const createRateLimiter = (windowMs: number, limit: number, message: string) =>
  rateLimit({
    windowMs,
    limit,
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
  'Terlalu banyak permintaan. Silakan coba lagi nanti.'
);

export const authRateLimiter = createRateLimiter(
  envConfig.AUTH_RATE_LIMIT_WINDOW_MS,
  envConfig.AUTH_RATE_LIMIT_MAX,
  'Terlalu banyak percobaan autentikasi. Silakan coba lagi nanti.'
);
