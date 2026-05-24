import { Request, Response, NextFunction } from 'express';
import { ENV } from '../config/environment';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Unhandled API Exception:', err);

  const statusCode = err.status || err.statusCode || 500;
  
  res.status(statusCode).json({
    error: err.message || 'Une erreur interne est survenue sur le serveur AKPBF.',
    timestamp: new Date().toISOString(),
    ...(ENV.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}
