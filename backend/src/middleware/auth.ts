import { Request, Response, NextFunction } from 'express';
import { SecurityUtils } from '../utils/security';
import { AuthenticatedRequest } from './authMiddleware';

// In-Memory Token Blacklist for security revocation (Logouts)
const TOKEN_BLACKLIST = new Set<string>();

// In-Memory Refresh Token database for rotation validations
const REFRESH_TOKENS_STORE = new Map<string, { email: string; expiresAt: number }>();

export const AuthMiddleware = {
  /**
   * Safe JWT authentication shield that checks against revoked/blacklisted sessions
   */
  authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Jeton d\'accès absent de la requête. Authentification requise.' });
      return;
    }

    // Check blacklist to defend against replayed/revoked tokens
    if (TOKEN_BLACKLIST.has(token)) {
      res.status(401).json({ error: 'Jeton révoqué ou session expirée. Veuillez vous reconnecter.' });
      return;
    }

    const payload = SecurityUtils.verifyToken(token);
    if (!payload) {
      res.status(401).json({ error: 'Signature du jeton invalide ou expirée.' });
      return;
    }

    req.tokenUser = payload;
    next();
  },

  /**
   * Blacklist / revoke a token during a secure user log-out session
   */
  revokeToken(token: string): void {
    if (token) {
      TOKEN_BLACKLIST.add(token);
    }
  },

  /**
   * Safe registration of generated refresh tokens with a 7-day expiration time
   */
  registerRefreshToken(email: string, token: string): void {
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 Days
    REFRESH_TOKENS_STORE.set(token, { email, expiresAt });
  },

  /**
   * Validate and rotate refresh token for robust security
   */
  rotateRefreshToken(oldToken: string): { email: string; success: boolean } {
    const record = REFRESH_TOKENS_STORE.get(oldToken);
    if (!record || record.expiresAt < Date.now()) {
      REFRESH_TOKENS_STORE.delete(oldToken);
      return { email: '', success: false };
    }

    // Delete old refresh token to enforce rigid 'One-Time-Use' Rotation security
    REFRESH_TOKENS_STORE.delete(oldToken);
    return { email: record.email, success: true };
  }
};
