import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  GOOGLE_CLIENT_ID: z.string().optional(),

  // ── MySQL Database ─────────────────────────────────────────
  DB_HOST:     z.string().default('localhost'),
  DB_PORT:     z.string().default('3306').transform((val) => parseInt(val, 10)),
  DB_USER:     z.string().min(1, 'DB_USER is required'),
  DB_PASSWORD: z.string().default(''),
  DB_NAME:     z.string().min(1, 'DB_NAME is required'),

  // ── Vercel Blob Storage ─────────────────────────────────────
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('❌ Invalid environment variables:', parseResult.error.format());
  throw new Error('Invalid environment variables configuration');
}

export const envConfig = parseResult.data;
