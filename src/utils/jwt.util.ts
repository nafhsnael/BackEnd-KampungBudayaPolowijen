import jwt, { SignOptions } from 'jsonwebtoken';
import { envConfig } from '../config/env.config';

export interface JwtPayload {
  userId: string;
  email: string;
  fullName: string;
}

export class JwtUtil {
  static generateToken(payload: JwtPayload): string {
    const options: SignOptions = {
      expiresIn: envConfig.JWT_EXPIRES_IN as any,
    };
    return jwt.sign(payload, envConfig.JWT_SECRET, options);
  }

  static verifyToken(token: string): JwtPayload {
    return jwt.verify(token, envConfig.JWT_SECRET) as JwtPayload;
  }
}
