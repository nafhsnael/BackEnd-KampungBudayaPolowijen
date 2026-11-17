import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rootRouter from './routes';
import { globalErrorHandler } from './middlewares/error.middleware';
import { ForbiddenError, NotFoundError } from './errors/app.error';
import { envConfig } from './config/env.config';
import { apiRateLimiter, authRateLimiter } from './middlewares/rate-limit.middleware';
import {
  requestContextMiddleware,
  requestLoggerMiddleware,
} from './middlewares/request-context.middleware';

const app: Application = express();
const allowedOrigins = envConfig.CORS_ORIGINS
  ?? (envConfig.NODE_ENV === 'production' ? [] : ['http://localhost:3000']);

app.set('trust proxy', envConfig.TRUST_PROXY_HOPS);

app.use(requestContextMiddleware);
app.use(requestLoggerMiddleware);
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new ForbiddenError('Origin is not allowed by CORS'));
  },
  exposedHeaders: ['X-Request-ID'],
}));
app.use('/api', apiRateLimiter);
app.use('/api/auth/login', authRateLimiter);
app.use('/api/auth/admin/login', authRateLimiter);
app.use('/api/auth/google', authRateLimiter);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '64kb' }));

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'Backend Service is healthy and operational',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', rootRouter);

app.use((_req: Request, _res: Response, next) => {
  next(new NotFoundError('Requested API endpoint does not exist'));
});

app.use(globalErrorHandler);

export default app;
