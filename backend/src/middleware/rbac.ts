import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware';

// System Roles Enum mapping
export enum UserRole {
  CLIENT = 'CLIENT',
  AGENT = 'AGENT',
  CHAUFFEUR = 'CHAUFFEUR',
  SUPERVISEUR = 'SUPERVISEUR',
  CAISSIER = 'CAISSIER',
  COMPTABLE = 'COMPTABLE',
  ADMIN = 'ADMINISTRATEUR',
  RECOUVREMENT = 'AGENT_RECOUVREMENT',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

// Role Hierarchy and authorized permissions list
const ROLE_PEER_LEVELS: Record<UserRole, number> = {
  [UserRole.CLIENT]: 1,
  [UserRole.AGENT]: 2,
  [UserRole.CHAUFFEUR]: 2,
  [UserRole.RECOUVREMENT]: 3,
  [UserRole.CAISSIER]: 3,
  [UserRole.COMPTABLE]: 4,
  [UserRole.SUPERVISEUR]: 5,
  [UserRole.ADMIN]: 10,
  [UserRole.SUPER_ADMIN]: 20
};

export const RbacMiddleware = {
  /**
   * Enforces role requirements.
   */
  requireRole(requiredRole: UserRole) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.tokenUser) {
        res.status(401).json({ error: 'Identification absente. Accès refusé.' });
        return;
      }

      const userRoleStr = req.tokenUser.role as UserRole;
      const userLevel = ROLE_PEER_LEVELS[userRoleStr] || 0;
      const requiredLevel = ROLE_PEER_LEVELS[requiredRole] || 0;

      if (userLevel < requiredLevel) {
        res.status(403).json({
          error: `Accès refusé. Le groupe d'utilisateur (${userRoleStr}) ne possède pas l'autorité de sécurité requise (${requiredRole}).`,
          code: 'INSUFFICIENT_ROLE_LEVEL'
        });
        return;
      }

      next();
    };
  },

  /**
   * Enforces that the active logged in identity matches either the requested route subscriberId or is an Administrator
   */
  requireSelfOrCorporate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    if (!req.tokenUser) {
      res.status(401).json({ error: 'Dossier d\'accès absent.' });
      return;
    }

    const { role, subscriberId } = req.tokenUser;
    const isCorp = [UserRole.ADMIN, UserRole.SUPERVISEUR, UserRole.COMPTABLE].includes(role as UserRole);

    if (isCorp) {
      next();
      return;
    }

    const targetSubscriberId = req.params.subscriberId || req.query.subscriberId;
    if (targetSubscriberId && subscriberId === targetSubscriberId) {
      next();
      return;
    }

    res.status(403).json({ error: 'Accès restreint. Vous pouvez consulter uniquement vos données d\'abonné citoyen.' });
  }
};
