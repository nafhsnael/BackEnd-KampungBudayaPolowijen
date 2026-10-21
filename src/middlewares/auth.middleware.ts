import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../errors/app.error';
import { TokenRepository } from '../repositories/token.repository';
import { UserRepository } from '../repositories/user.repository';
import { JwtUtil } from '../utils/jwt.util';

export type AuthenticatedUser = ReturnType<typeof JwtUtil.verifyToken>;

declare global {
  namespace Express {
    interface Request {
      auth?: AuthenticatedUser;
    }
  }
}

const tokenRepository = new TokenRepository();
const userRepository = new UserRepository();

export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authorization = req.header('Authorization');
    const match = authorization?.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      throw new UnauthorizedError('Authentication token is required');
    }

    const payload = JwtUtil.verifyToken(match[1]);
    if (await tokenRepository.isRevoked(payload.jti)) {
      throw new UnauthorizedError('Access token has been revoked');
    }

    const user = await userRepository.findById(payload.userId);
    if (!user || user.role !== payload.role) {
      throw new UnauthorizedError('Invalid or expired access token');
    }

    req.auth = payload;
    next();
  } catch (error) {
    next(error);
  }
};
