import { NextFunction, Request, Response } from 'express';
import { ForbiddenError, UnauthorizedError } from '../errors/app.error';

export const requireAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.auth) {
    next(new UnauthorizedError('Authentication is required'));
    return;
  }

  if (req.auth.role !== 'admin') {
    next(new ForbiddenError('Administrator access is required'));
    return;
  }

  next();
};
