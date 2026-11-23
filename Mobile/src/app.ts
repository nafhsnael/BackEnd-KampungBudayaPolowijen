import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler, HttpError } from './errors';
import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/profile.routes';
import umkmRoutes, { wishlistRouter } from './routes/umkm.routes';

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || env.corsOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new HttpError(403, 'Origin tidak diizinkan'));
  },
}));
app.use(express.json({ limit: '1mb' }));
const rateLimitHandler = (_req: express.Request, res: express.Response): void => {
  res.status(429).json({ message: 'Terlalu banyak percobaan. Silakan coba lagi nanti.' });
};
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  handler: rateLimitHandler,
}));
app.use('/api/v1/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  handler: rateLimitHandler,
}));

app.get('/health', (_req, res) => res.json({ status: 'OK' }));
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/umkm', umkmRoutes);
app.use('/api/v1/wishlist', wishlistRouter);
app.use((_req, _res, next) => next(new HttpError(404, 'Endpoint tidak ditemukan')));
app.use(errorHandler);

export default app;
