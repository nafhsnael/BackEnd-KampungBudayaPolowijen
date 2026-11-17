import { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';
import { parseValidatedInput } from '../utils/validation.util';

export const validateBody = (schema: ZodType) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = parseValidatedInput(schema, req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};
