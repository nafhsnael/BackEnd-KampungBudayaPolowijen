import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { envConfig } from '../config/env.config';
import { UnauthorizedError } from '../errors/app.error';

export interface JwtPayload {
  userId: string;
  email: string;
  fullName: string;
  role: 'user' | 'admin';
  jti: string;
  exp: number;
}

export class JwtUtil {
  static generateToken(payload: Omit<JwtPayload, 'jti' | 'exp'>): string {
    const options: SignOptions = {
      expiresIn: envConfig.JWT_EXPIRES_IN as SignOptions['expiresIn'],
      jwtid: uuidv4(),
    };
    return jwt.sign(payload, envConfig.JWT_SECRET, options);
  }

  static verifyToken(token: string): JwtPayload {
    let decoded: string | jwt.JwtPayload;
    try {
      decoded = jwt.verify(token, envConfig.JWT_SECRET);
    } catch {
      throw new UnauthorizedError('Invalid or expired access token');
    }
    if (
      typeof decoded === 'string' ||
      typeof decoded.userId !== 'string' ||
      typeof decoded.email !== 'string' ||
      typeof decoded.fullName !== 'string' ||
      (decoded.role !== 'user' && decoded.role !== 'admin') ||
      typeof decoded.jti !== 'string' ||
      typeof decoded.exp !== 'number'
    ) {
      throw new UnauthorizedError('Invalid or expired access token');
    }

    return {
      userId: decoded.userId,
      email: decoded.email,
      fullName: decoded.fullName,
      role: decoded.role,
      jti: decoded.jti,
      exp: decoded.exp,
    };
  }
}
