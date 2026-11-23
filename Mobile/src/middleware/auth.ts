import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { pool } from '../config/database';
import { env } from '../config/env';
import { HttpError } from '../errors';

export interface MobileToken extends JwtPayload {
  userId: string;
  email: string;
  jti: string;
}

declare global {
  namespace Express {
    interface Request {
      mobileUser?: MobileToken;
    }
  }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authorization = req.header('Authorization');
    if (!authorization) {
      next();
      return;
    }

    const match = authorization.match(/^Bearer\s+(.+)$/i);
    if (!match) throw new HttpError(401, 'Token autentikasi tidak valid');

    let decoded: string | JwtPayload;
    try {
      decoded = jwt.verify(match[1], env.JWT_SECRET);
    } catch {
      throw new HttpError(401, 'Token tidak valid atau kedaluwarsa');
    }
    if (typeof decoded === 'string' || typeof decoded.userId !== 'string'
      || typeof decoded.email !== 'string' || typeof decoded.jti !== 'string') {
      throw new HttpError(401, 'Token autentikasi tidak valid');
    }
    const token = decoded as MobileToken;
    const [rows] = await pool.query(
      'SELECT 1 FROM revoked_tokens WHERE token_id = ? AND expires_at > CURRENT_TIMESTAMP LIMIT 1',
      [token.jti],
    );
    if (Array.isArray(rows) && rows.length > 0) throw new HttpError(401, 'Token sudah dicabut');
    const [users] = await pool.query(
      'SELECT 1 FROM users WHERE id = ? AND status = ? LIMIT 1',
      [token.userId, 'Aktif'],
    );
    if (!Array.isArray(users) || users.length === 0) {
      throw new HttpError(401, 'Akun tidak aktif atau tidak ditemukan');
    }

    req.mobileUser = token;
    next();
  } catch (error) {
    next(error);
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  await optionalAuth(req, res, (error?: unknown) => {
    if (error) {
      next(error);
      return;
    }
    if (!req.mobileUser) {
      next(new HttpError(401, 'Token autentikasi wajib disertakan'));
      return;
    }
    next();
  });
}
