import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import rootRouter from './routes';
import { globalErrorHandler } from './middlewares/error.middleware';
import { NotFoundError } from './errors/app.error';

const app: Application = express();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Route
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'Backend Service is healthy and operational',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api', rootRouter);

// Handle 404 Undefined Routes
app.use((_req: Request, _res: Response, next) => {
  next(new NotFoundError('Requested API endpoint does not exist'));
});

// Global Error Handler Middleware
app.use(globalErrorHandler);

export default app;
