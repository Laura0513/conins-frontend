import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors.js';

type Target = 'body' | 'query' | 'params';

export const validate = (schema: ZodSchema, target: Target = 'body') => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse(req[target]);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const messages = err.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
        throw new ValidationError(messages);
      }
      throw err;
    }
  };
};
