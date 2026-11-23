import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof ZodError) {
    const errors = error.issues.reduce<Record<string, string[]>>((result, issue) => {
      const field = issue.path.join('.') || 'request';
      (result[field] ??= []).push(issue.message);
      return result;
    }, {});
    res.status(422).json({ message: 'Validasi gagal', errors });
    return;
  }

  if (error instanceof HttpError) {
    res.status(error.status).json({
      message: error.message,
      ...(error.errors ? { errors: error.errors } : {}),
    });
    return;
  }

  if (isMysqlDuplicateError(error)) {
    res.status(422).json({
      message: 'Data sudah digunakan',
      errors: { email: ['Email sudah terdaftar'] },
    });
    return;
  }

  if (isMulterError(error)) {
    const status = error.code === 'LIMIT_FILE_SIZE' ? 422 : 400;
    res.status(status).json({
      message: status === 422 ? 'Ukuran foto maksimal 2 MB' : 'Unggahan foto tidak valid',
      ...(status === 422 ? { errors: { photo: ['Ukuran foto maksimal 2 MB'] } } : {}),
    });
    return;
  }

  console.error('Mobile API unexpected error:', error);
  res.status(500).json({ message: 'Terjadi kesalahan pada server' });
}

function isMysqlDuplicateError(error: unknown): error is { code: string } {
  return typeof error === 'object' && error !== null && 'code' in error
    && (error as { code?: unknown }).code === 'ER_DUP_ENTRY';
}

function isMulterError(error: unknown): error is { code: string } {
  return typeof error === 'object' && error !== null && 'code' in error
    && typeof (error as { code?: unknown }).code === 'string'
    && (error as { code: string }).code.startsWith('LIMIT_');
}
