import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { ValidationError } from '../utils/errors';

export const validate = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        console.log('VALIDATION ERROR:', {
          errors: error.errors,
          body: req.body,
        });
        
        const messages = error.errors.map((err: any) => {
          const field = err.path.slice(1).join('.'); // Remove 'body'/'query'/'params' prefix
          return `${field}: ${err.message}`;
        });
        
        const errorMessage = messages.join(', ');
        console.log('Validation failed:', errorMessage);
        next(new ValidationError(errorMessage));
      } else {
        next(error);
      }
    }
  };
};
