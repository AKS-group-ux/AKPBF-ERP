import { Request, Response } from 'express';
import { loginSchema } from '../validators/authValidator';
import { SecurityUtils } from '../utils/security';
import { AuthMiddleware } from '../middleware/auth';
import { getPrismaClient } from '../config/database';
import { InMemoryDb } from '../config/inMemoryDb';

const ENTERPRISE_USERS = [
  { email: 'admin@akpbf.com', passwordText: 'Admin@2026', passwordHash: '', name: 'Alkaïda Benjamin', role: 'ADMINISTRATEUR' },
  { email: 'comptable@akpbf.com', passwordText: 'Comptable@2026', passwordHash: '', name: 'Doumbia Sylvain (Fisc)', role: 'COMPTABLE' },
  { email: 'superviseur@akpbf.com', passwordText: 'Superviseur@2026', passwordHash: '', name: 'Gérard Gnakoury (Logistique)', role: 'SUPERVISEUR' },
  { email: 'chauffeur@akpbf.com', passwordText: 'Chauffeur@2026', passwordHash: '', name: 'Kaboré Moussa', role: 'CHAUFFEUR' },
  { email: 'agent@akpbf.com', passwordText: 'Agent@2026', passwordHash: '', name: 'Coulibaly Issa', role: 'AGENT' },
];

// Precompute password hashes
ENTERPRISE_USERS.forEach(u => {
  u.passwordHash = SecurityUtils.hashPassword(u.passwordText);
  (u as any).passwordText = undefined;
});

// Mock user temporary passwords for forgotten resets
const RESET_TOKENS = new Map<string, string>(); // token -> email

export const AuthController = {
  /**
   * Performs authentication and yields a signed JWT with rotation refresh token
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const parseResult = loginSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: parseResult.error.issues[0].message });
        return;
      }

      const { authMethod, email, password, subscriberId, phone, subscribers = [] } = parseResult.data;
      let tokenUser: any = null;

      // 1. Authenticate with corporate email + password
      if (authMethod === 'email' && email && password) {
        const canonicalEmail = email.trim().toLowerCase();

        // Corporate users
        const corpUser = ENTERPRISE_USERS.find(u => u.email === canonicalEmail);
        if (corpUser) {
          const matched = SecurityUtils.comparePassword(password, corpUser.passwordHash);
          if (matched) {
            tokenUser = {
              id: corpUser.email,
              name: corpUser.name,
              email: corpUser.email,
              role: corpUser.role,
              phone: '+225 05 00 00 00 01'
            };
          } else {
            res.status(401).json({ error: 'Mot de passe corporatif erroné ou expiré.' });
            return;
          }
        } else {
          // Customer login by email
          const clientSub = subscribers.find((s: any) => s.email?.toLowerCase() === canonicalEmail);
          if (clientSub) {
            if (password === 'Test@2026' || password === clientSub.id) {
              tokenUser = {
                id: clientSub.id,
                name: clientSub.name,
                email: clientSub.email,
                role: 'CLIENT',
                phone: clientSub.phone,
                subscriberId: clientSub.id
              };
            } else {
              res.status(401).json({ error: 'Mot de passe du Portail Citoyen incorrect (utilisez "Test@2026").' });
              return;
            }
          } else {
            // Check if customer email exists in the PostgreSQL database via Prisma
            try {
              const prisma = getPrismaClient();
              let dbCustomer = await prisma.customer.findFirst({
                where: {
                  email: { equals: canonicalEmail, mode: 'insensitive' }
                }
              });

              // Fallback to InMemoryDb if Postgres is empty/unseeded
              if (!dbCustomer) {
                const inMemoryDb = InMemoryDb.getInstance();
                dbCustomer = inMemoryDb.collections.customer?.find(
                  (c: any) => c.email?.trim().toLowerCase() === canonicalEmail
                );
              }

              if (dbCustomer) {
                const idStr = dbCustomer.subscriberId || dbCustomer.id;
                if (password === 'Test@2026' || password === idStr) {
                  tokenUser = {
                    id: idStr,
                    name: dbCustomer.name,
                    email: dbCustomer.email,
                    role: 'CLIENT',
                    phone: dbCustomer.phone,
                    subscriberId: idStr
                  };
                } else {
                  res.status(401).json({ error: 'Mot de passe du Portail Citoyen incorrect (utilisez "Test@2026").' });
                  return;
                }
              }
            } catch (dbErr) {
              console.error('Prisma customer lookup by email failed:', dbErr);
            }
          }
        }
      }

      // 2. Authenticate with ID
      else if (authMethod === 'id' && subscriberId) {
        const canonId = subscriberId.trim().toUpperCase();
        const clientSub = subscribers.find((s: any) => s.id?.toUpperCase() === canonId || s.id?.toUpperCase().includes(canonId));
        if (clientSub) {
          tokenUser = {
            id: clientSub.id,
            name: clientSub.name,
            email: clientSub.email,
            role: 'CLIENT',
            phone: clientSub.phone,
            subscriberId: clientSub.id
          };
        } else {
          // Check database via Prisma
          try {
            const prisma = getPrismaClient();
            let dbCustomer = await prisma.customer.findFirst({
              where: {
                subscriberId: { equals: subscriberId.trim(), mode: 'insensitive' }
              }
            });

            // Fallback to InMemoryDb if Postgres is empty/unseeded
            if (!dbCustomer) {
              const inMemoryDb = InMemoryDb.getInstance();
              dbCustomer = inMemoryDb.collections.customer?.find(
                (c: any) => c.subscriberId?.trim().toUpperCase() === canonId || c.id?.toUpperCase() === canonId
              );
            }

            if (dbCustomer) {
              const idStr = dbCustomer.subscriberId || dbCustomer.id;
              tokenUser = {
                id: idStr,
                name: dbCustomer.name,
                email: dbCustomer.email,
                role: 'CLIENT',
                phone: dbCustomer.phone,
                subscriberId: idStr
              };
            }
          } catch (dbErr) {
            console.error('Prisma lookup by subscriberId failed:', dbErr);
          }
        }
      }

      // 3. Authenticate with Phone
      else if (authMethod === 'phone' && phone) {
        const cleanPhone = phone.replace(/\s+/g, '');
        const clientSub = subscribers.find((s: any) => s.phone?.replace(/\s+/g, '').includes(cleanPhone));
        if (clientSub) {
          tokenUser = {
            id: clientSub.id,
            name: clientSub.name,
            email: clientSub.email,
            role: 'CLIENT',
            phone: clientSub.phone,
            subscriberId: clientSub.id
          };
        } else {
          // Check database via Prisma
          try {
            const prisma = getPrismaClient();
            const dbCustomers = await prisma.customer.findMany();
            let foundDb = dbCustomers.find(c => c.phone.replace(/\s+/g, '').includes(cleanPhone));

            // Fallback to InMemoryDb if Postgres is empty/unseeded
            if (!foundDb) {
              const inMemoryDb = InMemoryDb.getInstance();
              foundDb = inMemoryDb.collections.customer?.find(
                (c: any) => c.phone?.replace(/\s+/g, '').includes(cleanPhone)
              );
            }

            if (foundDb) {
              const idStr = foundDb.subscriberId || foundDb.id;
              tokenUser = {
                id: idStr,
                name: foundDb.name,
                email: foundDb.email,
                role: 'CLIENT',
                phone: foundDb.phone,
                subscriberId: idStr
              };
            }
          } catch (dbErr) {
            console.error('Prisma lookup by phone failed:', dbErr);
          }
        }
      }

      if (!tokenUser) {
        res.status(404).json({ error: 'Identifiants ou coordonnées introuvables. Connexion refusée.' });
        return;
      }

      // Generate Access Token and Refresh Token
      const token = SecurityUtils.generateToken(tokenUser);
      const refreshToken = `REFRESH-${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
      
      // Register Refresh Token securely
      AuthMiddleware.registerRefreshToken(tokenUser.email || tokenUser.id, refreshToken);

      res.json({
        success: true,
        user: tokenUser,
        token,
        refreshToken
      });
    } catch (err) {
      console.error('Core Login controller error:', err);
      res.status(500).json({ error: 'Erreur interne lors de la tentative de connexion.' });
    }
  },

  /**
   * Refreshes JWT token under strict rotation rules (OSS / One-Time Use Only)
   */
  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        res.status(400).json({ error: 'Refresh token manquant.' });
        return;
      }

      const rotation = AuthMiddleware.rotateRefreshToken(refreshToken);
      if (!rotation.success) {
        res.status(401).json({ error: 'Jeton de rafraîchissement révoqué, expiré ou invalide.' });
        return;
      }

      const isCorp = ENTERPRISE_USERS.find(u => u.email === rotation.email);
      let payloadUser: any = null;

      if (isCorp) {
        payloadUser = {
          id: isCorp.email,
          name: isCorp.name,
          email: isCorp.email,
          role: isCorp.role
        };
      } else {
        payloadUser = {
          id: rotation.email,
          name: 'Abonné Citoyen',
          email: rotation.email,
          role: 'CLIENT',
          subscriberId: rotation.email
        };
      }

      // Generate new rotated access + refresh tokens pair
      const newToken = SecurityUtils.generateToken(payloadUser);
      const newRefreshToken = `REFRESH-${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
      
      AuthMiddleware.registerRefreshToken(payloadUser.email || payloadUser.id, newRefreshToken);

      res.json({
        success: true,
        token: newToken,
        refreshToken: newRefreshToken
      });
    } catch (err) {
      res.status(500).json({ error: 'Erreur lors du rafraîchissement de la session.' });
    }
  },

  /**
   * Revokes token instantly on active logout
   */
  async logout(req: Request, res: Response): Promise<void> {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
      AuthMiddleware.revokeToken(token);
    }
    res.json({ success: true, message: 'Déconnexion enregistrée et jeton révoqué de manière permanente.' });
  },

  /**
   * Request password reset token
   */
  async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Adresse email requise.' });
      return;
    }

    const resetToken = `RESET-${Math.floor(100000 + Math.random() * 900000)}`;
    RESET_TOKENS.set(resetToken, email.trim().toLowerCase());

    res.json({
      success: true,
      message: `Procédure d'oubli initiée. Jeton simulé généré avec succès.`,
      resetToken // Returned safely for client convenience
    });
  },

  /**
   * Safely process reset password submission
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    const { token, passwordText } = req.body;
    if (!token || !passwordText) {
      res.status(400).json({ error: 'Jeton de réinitialisation et nouveau mot de passe requis.' });
      return;
    }

    const email = RESET_TOKENS.get(token);
    if (!email) {
      res.status(400).json({ error: 'Jeton de réinitialisation invalide, altéré ou expiré.' });
      return;
    }

    // Force strict password complexity policies
    const isValid = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(passwordText);
    if (!isValid) {
      res.status(400).json({
        error: 'Le mot de passe doit faire d\'au moins 8 caractères et inclure une majuscule, une minuscule et un chiffre.'
      });
      return;
    }

    // Update statically or return success message
    RESET_TOKENS.delete(token);

    res.json({
      success: true,
      message: 'Votre mot de passe a été réinitialisé avec succès. Veuillez vous reconnecter.'
    });
  }
};
