import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const ValidationMiddleware = {
  /**
   * Validates request body with custom Zod schema
   */
  validateBody(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        // Pass directly to globalErrorHandler
        next(result.error);
        return;
      }
      // Re-assign sanitized data
      req.body = result.data;
      next();
    };
  },

  /**
   * Validates request query parameters with custom Zod schema
   */
  validateQuery(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const result = schema.safeParse(req.query);
      if (!result.success) {
        next(result.error);
        return;
      }
      req.query = result.data as any;
      next();
    };
  }
};
