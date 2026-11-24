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
  CORS_ORIGINS: z.string().optional().transform((value) =>
    value?.split(',').map((origin) => origin.trim()).filter(Boolean)
  ),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(0),
  API_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1).default(15 * 60 * 1000),
  API_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(100),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1).default(15 * 60 * 1000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(10),

  // ── MySQL Database ─────────────────────────────────────────
  DB_HOST:     z.string().default('localhost'),
  DB_PORT:     z.string().default('3306').transform((val) => parseInt(val, 10)),
  DB_USER:     z.string().min(1, 'DB_USER is required'),
  DB_PASSWORD: z.string().default(''),
  DB_NAME:     z.string().min(1, 'DB_NAME is required'),

  // ── Vercel Blob Storage ─────────────────────────────────────
  BLOB_READ_WRITE_TOKEN: z.string().optional(),

  // ── Cloudinary image storage ────────────────────────────────
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
}).superRefine((config, context) => {
  const cloudinaryValues = [
    config.CLOUDINARY_CLOUD_NAME,
    config.CLOUDINARY_API_KEY,
    config.CLOUDINARY_API_SECRET,
  ];
  if (cloudinaryValues.some(Boolean) && !cloudinaryValues.every(Boolean)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['CLOUDINARY_CLOUD_NAME'],
      message: 'CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET must be configured together',
    });
  }

  if (config.NODE_ENV === 'production' && !config.CORS_ORIGINS?.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['CORS_ORIGINS'],
      message: 'CORS_ORIGINS must contain the frontend origin in production',
    });
  }

  for (const origin of config.CORS_ORIGINS ?? []) {
    try {
      if (new URL(origin).origin !== origin) {
        throw new Error('Origin must not include a path or trailing slash');
      }
    } catch {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['CORS_ORIGINS'],
        message: `Invalid CORS origin: ${origin}`,
      });
    }
  }
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('❌ Invalid environment variables:', parseResult.error.format());
  throw new Error('Invalid environment variables configuration');
}

export const envConfig = parseResult.data;
