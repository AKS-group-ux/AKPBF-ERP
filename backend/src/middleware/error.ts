import { Request, Response, NextFunction } from 'express';
import { ENV } from '../config/environment';

export class AppError extends Error {
  public statusCode: number;
  public errorCode?: string;

  constructor(message: string, statusCode: number, errorCode?: string) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    Object.setPrototypeOf(this, new TargetClass(this)); // target class constructor bound safely
  }
}

// Internal binding fix
class TargetClass {
  constructor(instance: any) {
    return instance.constructor;
  }
}

export function globalErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const ip = req.ip || req.socket.remoteAddress;
  console.error(`[COMPREHENSIVE GLOBAL ERROR INTERCEPTOR] [IP: ${ip}] - Method: ${req.method} - URL: ${req.originalUrl}`);
  console.error(err);

  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Une erreur système inattendue est survenue.';
  let errorsList: any[] = [];
  let code = err.errorCode || 'INTERNAL_SERVER_ERROR';

  // 1. Check for Zod Schema Validation Errors
  if (err.name === 'ZodError' || err.issues) {
    statusCode = 400;
    message = 'Echec de validation de la charge de données (Schéma Zod).';
    code = 'VALIDATION_ERROR';
    errorsList = (err.issues || []).map((issue: any) => ({
      path: issue.path.join('.'),
      message: issue.message
    }));
  }

  // 2. Check for Prisma / PostgreSQL Database Errors
  else if (err.code && err.code.startsWith('P')) {
    statusCode = 409;
    code = `DATABASE_PRISMA_${err.code}`;
    
    switch (err.code) {
      case 'P2002':
        message = 'Violation d\'unicité : Une ressource de même identifiant existe déjà en base de données.';
        break;
      case 'P2003':
        message = 'Echec d\'intégrité référentielle : Clé étrangère inexistante ou contrainte violée.';
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Enregistrement cible introuvable dans la base d\'Abidjan.';
        break;
      default:
        message = `Erreur de persistance SQL de bas niveau (Prisma Code: ${err.code}).`;
    }
  }

  // 3. JWT verification failures
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Jeton d\'accès altéré ou invalide.';
    code = 'AUTH_TOKEN_CORRUPTED';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'La session d\'accès JWT a expiré. Veuillez obtenir un nouveau jeton.';
    code = 'AUTH_TOKEN_EXPIRED';
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    code,
    ...(errorsList.length > 0 ? { validationErrors: errorsList } : {}),
    timestamp: new Date().toISOString(),
    ...(ENV.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
}
