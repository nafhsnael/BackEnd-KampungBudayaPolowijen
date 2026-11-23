import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const schema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(5001),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().int().min(1).max(65535).default(3306),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().min(1),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  CORS_ORIGINS: z.string().optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(`Invalid Mobile API environment: ${parsed.error.message}`);
}

const corsOrigins = parsed.data.CORS_ORIGINS?.split(',').map((origin) => origin.trim()).filter(Boolean)
  ?? ['http://localhost:3000'];

if (parsed.data.NODE_ENV === 'production' && corsOrigins.length === 0) {
  throw new Error('CORS_ORIGINS is required in production');
}

export const env = {
  ...parsed.data,
  corsOrigins,
};
