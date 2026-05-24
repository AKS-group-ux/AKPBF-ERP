import { Request, Response, NextFunction } from 'express';
import { AuthMiddleware } from './auth';

export interface AuthenticatedRequest extends Request {
  tokenUser?: {
    id: string;
    name: string;
    email: string;
    role: string;
    phone?: string;
    subscriberId?: string;
  };
}

/**
 * Legacy router gateway proxying to secure AuthMiddleware.authenticate
 */
export function authenticateToken(
  req: any,
  res: Response,
  next: NextFunction
): void {
  AuthMiddleware.authenticate(req, res, next);
}

/**
 * Legacy router gateway proxying to secure RbacMiddleware.requireRole
 */
export function requireRoles(allowedRoles: string[]) {
  return (req: any, res: Response, next: NextFunction): void => {
    if (!req.tokenUser) {
      res.status(401).json({ error: 'Utilisateur non authentifié.' });
      return;
    }

    const hasPermission = allowedRoles.includes(req.tokenUser.role);
    if (!hasPermission) {
      res.status(403).json({ 
        error: `Accès refusé : Privilèges de rôle (${req.tokenUser.role}) insuffisants pour cette opération d'Abidjan.` 
      });
      return;
    }

    next();
  };
}
