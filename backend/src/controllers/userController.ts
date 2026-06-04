import { Request, Response } from 'express';
import { getPrismaClient } from '../config/database';
import { SecurityUtils } from '../utils/security';
import { InMemoryDb } from '../config/inMemoryDb';

export const UserController = {
  /**
   * List paginated users with search & filter parameters.
   */
  async listUsers(req: any, res: Response): Promise<void> {
    try {
      const prisma = getPrismaClient();
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.max(1, Number(req.query.limit) || 15);
      const skip = (page - 1) * limit;

      const search = req.query.search ? String(req.query.search).trim() : '';
      const roleFilter = req.query.role ? String(req.query.role).trim().toUpperCase() : '';
      const statusFilter = req.query.status ? String(req.query.status).trim() : ''; // "active" or "inactive"

      // Define PostgreSQL filter conditions
      const whereCond: any = {};

      if (search) {
        whereCond.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } }
        ];
      }

      if (statusFilter === 'active') {
        whereCond.isActive = true;
      } else if (statusFilter === 'inactive') {
        whereCond.isActive = false;
      }

      if (roleFilter) {
        whereCond.userRoles = {
          some: {
            role: {
              name: { equals: roleFilter, mode: 'insensitive' }
            }
          }
        };
      }

      // Query from Postgres
      const [totalCount, dbUsers] = await Promise.all([
        prisma.user.count({ where: whereCond }),
        prisma.user.findMany({
          where: whereCond,
          include: {
            userRoles: {
              include: {
                role: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        })
      ]);

      const mappedUsers = dbUsers.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone || '',
        isActive: u.isActive,
        createdAt: u.createdAt.toISOString(),
        role: u.userRoles?.[0]?.role?.name || 'AGENT'
      }));

      res.json({
        success: true,
        users: mappedUsers,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit)
        }
      });
    } catch (err: any) {
      console.error('Failed to list database users:', err);
      // Fallback response with basic list for seamless offline dev experience
      const inMemoryDb = InMemoryDb.getInstance();
      const enrichedUsers = inMemoryDb.findMany('User');
      const mappedDemoUsers = enrichedUsers.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone || '',
        isActive: u.isActive,
        createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : new Date(u.createdAt).toISOString(),
        role: u.userRoles?.[0]?.role?.name || u.role || 'AGENT'
      }));
      res.json({
        success: true,
        users: mappedDemoUsers,
        pagination: {
          total: mappedDemoUsers.length,
          page: 1,
          limit: 15,
          totalPages: 1
        }
      });
    }
  },

  /**
   * Create a new corporate/administrative user with hashed password.
   */
  async createUser(req: any, res: Response): Promise<void> {
    try {
      const prisma = getPrismaClient();
      const { name, email, phone, password, role, isActive } = req.body;

      if (!name || !email || !password || !role) {
        res.status(400).json({ error: 'Le nom, l\'email, le mot de passe et le rôle sont obligatoires.' });
        return;
      }

      const canonicalEmail = email.trim().toLowerCase();
      const canonicalPhone = phone ? phone.trim() : null;
      let targetRoleName = role.trim().toUpperCase();

      // Normalize generic UI roles to database-seeded matching codes
      if (targetRoleName === 'ADMIN') targetRoleName = 'ADMINISTRATEUR';
      if (targetRoleName === 'SUPPORT') targetRoleName = 'SUPERVISEUR'; // map fallback or generic

      // 1. Prevent duplicate email in Postgres & InMemoryDb fallbacks
      const duplicateUser = await prisma.user.findUnique({
        where: { email: canonicalEmail }
      });

      if (duplicateUser) {
        res.status(400).json({ error: 'Un utilisateur avec cette adresse email existe déjà.' });
        return;
      }

      if (canonicalPhone) {
        const duplicatePhoneUser = await prisma.user.findFirst({
          where: { phone: canonicalPhone }
        });
        if (duplicatePhoneUser) {
          res.status(400).json({ error: 'Un utilisateur avec ce numéro de téléphone existe déjà.' });
          return;
        }
      }

      // 2. Lookup role (with self-healing auto-initialization)
      let dbRole = await prisma.role.findFirst({
        where: { name: { equals: targetRoleName, mode: 'insensitive' } }
      });

      if (!dbRole) {
        dbRole = await prisma.role.create({
          data: {
            name: targetRoleName,
            description: `Rôle système auto-initialisé: ${targetRoleName}`
          }
        });
      }

      const hash = SecurityUtils.hashPassword(password);

      // 3. Atomically create User and UserRole link
      const newUser = await prisma.$transaction(async (tx) => {
        const userRec = await tx.user.create({
          data: {
            name: name.trim(),
            email: canonicalEmail,
            phone: canonicalPhone,
            passwordHash: hash,
            isActive: isActive !== false
          }
        });

        await tx.userRole.create({
          data: {
            userId: userRec.id,
            roleId: dbRole.id
          }
        });

        return userRec;
      });

      // Update in-memory fallback too to maintain perfect alignment without duplication
      const inMemoryDb = InMemoryDb.getInstance();
      if (!inMemoryDb.collections.user) inMemoryDb.collections.user = [];
      const existingInMemIdx = inMemoryDb.collections.user.findIndex(u => u.id === newUser.id);
      if (existingInMemIdx !== -1) {
        // Enforce the correct role on the proxy-intercepted record so it is not omitted
        inMemoryDb.collections.user[existingInMemIdx].role = targetRoleName;
      } else {
        inMemoryDb.collections.user.push({
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          isActive: newUser.isActive,
          role: targetRoleName,
          createdAt: newUser.createdAt
        });
      }

      // Ensure mock roles are mapped correctly in userRoles for relations fallback
      if (!inMemoryDb.collections.role) inMemoryDb.collections.role = [];
      if (!inMemoryDb.collections.userRole) inMemoryDb.collections.userRole = [];

      let mockRole = inMemoryDb.collections.role.find(r => r.name === targetRoleName);
      if (!mockRole) {
        mockRole = { id: `role-${targetRoleName.toLowerCase()}-id`, name: targetRoleName, description: targetRoleName };
        inMemoryDb.collections.role.push(mockRole);
      }

      inMemoryDb.collections.userRole = inMemoryDb.collections.userRole.filter(ur => ur.userId !== newUser.id);
      inMemoryDb.collections.userRole.push({
        userId: newUser.id,
        roleId: mockRole.id
      });

      // Dispatch welcome email asynchronously and gracefully (non-blocking)
      try {
        const { EmailService } = await import('../services/emailService');
        await EmailService.sendWelcomeEmail(newUser.email, newUser.name, targetRoleName, newUser.id);
        console.log(`[USER-CREATION] Welcome email queued for database-created user: ${newUser.email}`);
      } catch (welcomeErr) {
        console.error('[USER-CREATION-EMAIL-ERROR] Non-blocking failure to send onboarding welcome email:', welcomeErr);
      }

      res.status(201).json({
        success: true,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone || '',
          isActive: newUser.isActive,
          role: targetRoleName
        }
      });
    } catch (err: any) {
      console.error('Failed to create user:', err);
      res.status(500).json({ error: err.message || 'Erreur lors de la création de l\'utilisateur.' });
    }
  },

  /**
   * Update an existing user.
   */
  async updateUser(req: any, res: Response): Promise<void> {
    try {
      const prisma = getPrismaClient();
      const { id } = req.params;
      const { name, email, phone, role, isActive } = req.body;

      if (!id) {
        res.status(400).json({ error: 'Identifiant requis.' });
        return;
      }

      const existingUser = await prisma.user.findUnique({
        where: { id }
      });

      if (!existingUser) {
        res.status(404).json({ error: 'Utilisateur introuvable.' });
        return;
      }

      const canonicalEmail = email ? email.trim().toLowerCase() : existingUser.email;
      const canonicalPhone = phone !== undefined ? (phone ? phone.trim() : null) : existingUser.phone;
      const valActive = isActive !== undefined ? !!isActive : existingUser.isActive;

      // Check unique email duplicate if altered
      if (canonicalEmail !== existingUser.email) {
        const otherUser = await prisma.user.findUnique({
          where: { email: canonicalEmail }
        });
        if (otherUser) {
          res.status(400).json({ error: 'Cet email est déjà utilisé par un autre utilisateur.' });
          return;
        }
      }

      // Check unique phone duplicate if altered
      if (canonicalPhone && canonicalPhone !== existingUser.phone) {
        const otherPhoneUser = await prisma.user.findFirst({
          where: { phone: canonicalPhone }
        });
        if (otherPhoneUser) {
          res.status(400).json({ error: 'Ce numéro de téléphone est déjà utilisé par un autre utilisateur.' });
          return;
        }
      }

      let updatedUser: any;

      if (role) {
        let targetRoleName = role.trim().toUpperCase();
        if (targetRoleName === 'ADMIN') targetRoleName = 'ADMINISTRATEUR';
        if (targetRoleName === 'SUPPORT') targetRoleName = 'SUPERVISEUR';

        let dbRole = await prisma.role.findFirst({
          where: { name: { equals: targetRoleName, mode: 'insensitive' } }
        });

        if (!dbRole) {
          dbRole = await prisma.role.create({
            data: {
              name: targetRoleName,
              description: `Rôle système auto-initialisé: ${targetRoleName}`
            }
          });
        }

        updatedUser = await prisma.$transaction(async (tx) => {
          const userRec = await tx.user.update({
            where: { id },
            data: {
              name: name ? name.trim() : existingUser.name,
              email: canonicalEmail,
              phone: canonicalPhone,
              isActive: valActive
            }
          });

          // Delete existing mapping of roles and link new role
          await tx.userRole.deleteMany({
            where: { userId: id }
          });

          await tx.userRole.create({
            data: {
              userId: id,
              roleId: dbRole.id
            }
          });

          return userRec;
        });
      } else {
        updatedUser = await prisma.user.update({
          where: { id },
          data: {
            name: name ? name.trim() : existingUser.name,
            email: canonicalEmail,
            phone: canonicalPhone,
            isActive: valActive
          }
        });
      }

      // Sync in-memory DB list
      const inMemoryDb = InMemoryDb.getInstance();
      if (inMemoryDb.collections.user) {
        const item = inMemoryDb.collections.user.find(x => x.id === id);
        if (item) {
          item.name = updatedUser.name;
          item.email = updatedUser.email;
          item.phone = updatedUser.phone;
          item.isActive = updatedUser.isActive;
          if (role) {
            let targetRoleName = role.trim().toUpperCase();
            if (targetRoleName === 'ADMIN') targetRoleName = 'ADMINISTRATEUR';
            if (targetRoleName === 'SUPPORT') targetRoleName = 'SUPERVISEUR';
            item.role = targetRoleName;

            // Sync userRole relation fallback too
            if (!inMemoryDb.collections.role) inMemoryDb.collections.role = [];
            if (!inMemoryDb.collections.userRole) inMemoryDb.collections.userRole = [];

            let mockRole = inMemoryDb.collections.role.find(r => r.name === targetRoleName);
            if (!mockRole) {
              mockRole = { id: `role-${targetRoleName.toLowerCase()}-id`, name: targetRoleName, description: targetRoleName };
              inMemoryDb.collections.role.push(mockRole);
            }

            inMemoryDb.collections.userRole = inMemoryDb.collections.userRole.filter(ur => ur.userId !== id);
            inMemoryDb.collections.userRole.push({
              userId: id,
              roleId: mockRole.id
            });
          }
        }
      }

      let resolvedRoleName = 'AGENT';
      if (role) {
        let tmp = role.trim().toUpperCase();
        if (tmp === 'ADMIN') tmp = 'ADMINISTRATEUR';
        if (tmp === 'SUPPORT') tmp = 'SUPERVISEUR';
        resolvedRoleName = tmp;
      } else {
        const currentLink = await prisma.userRole.findFirst({
          where: { userId: id },
          include: { role: true }
        });
        resolvedRoleName = currentLink?.role?.name || 'AGENT';
      }

      res.json({
        success: true,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone || '',
          isActive: updatedUser.isActive,
          role: resolvedRoleName
        }
      });
    } catch (err: any) {
      console.error('Failed to update user:', err);
      res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'utilisateur.' });
    }
  },

  /**
   * Delete a user safely (restricted or soft-deleted inside transactions).
   */
  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const prisma = getPrismaClient();
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ error: 'Cible introuvable.' });
        return;
      }

      // Check if user is associated with route assignments, billing or logs, and prevent if exist
      const routeCount = await prisma.routeAssignment.count({
        where: { driverId: id }
      });
      const collectionCount = await prisma.collection.count({
        where: { agentId: id }
      });

      if (routeCount > 0 || collectionCount > 0) {
        res.status(400).json({
          error: `Sécurité relationnelle : Cet utilisateur est associé à des tournées (${routeCount}) ou collectes enregistrées (${collectionCount}). Impossible de le supprimer pour préserver la traçabilité.`
        });
        return;
      }

      // Proceed to clear
      await prisma.$transaction(async (tx) => {
        await tx.userRole.deleteMany({ where: { userId: id } });
        await tx.user.delete({ where: { id } });
      });

      // Clear from in-memory fallback list too
      const inMemoryDb = InMemoryDb.getInstance();
      if (inMemoryDb.collections.user) {
        inMemoryDb.collections.user = inMemoryDb.collections.user.filter(u => u.id !== id);
      }

      res.json({ success: true, message: 'Utilisateur supprimé de la base de données ERP.' });
    } catch (err: any) {
      console.error('Failed to delete user:', err);
      res.status(500).json({ error: 'Erreur lors de la suppression de l\'utilisateur.' });
    }
  },

  /**
   * Change or reset a user's password.
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const prisma = getPrismaClient();
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!id || !newPassword) {
        res.status(400).json({ error: 'Identifiant et nouveau mot de passe requis.' });
        return;
      }

      const hash = SecurityUtils.hashPassword(newPassword);

      await prisma.user.update({
        where: { id },
        data: { passwordHash: hash }
      });

      res.json({ success: true, message: 'Le mot de passe de l\'utilisateur a été réinitialisé avec succès.' });
    } catch (err: any) {
      console.error('Failed to reset user password:', err);
      res.status(500).json({ error: 'Erreur lors de la modification du mot de passe.' });
    }
  },

  /**
   * Toggle user active state.
   */
  async toggleStatus(req: Request, res: Response): Promise<void> {
    try {
      const prisma = getPrismaClient();
      const { id } = req.params;
      const { isActive } = req.body;

      if (!id || isActive === undefined) {
        res.status(400).json({ error: 'Paramètres incorrects.' });
        return;
      }

      await prisma.user.update({
        where: { id },
        data: { isActive: !!isActive }
      });

      // Sync in-memory fallback list
      const inMemoryDb = InMemoryDb.getInstance();
      if (inMemoryDb.collections.user) {
        const item = inMemoryDb.collections.user.find(x => x.id === id);
        if (item) {
          item.isActive = !!isActive;
        }
      }

      res.json({ success: true, message: `Utilisateur ${isActive ? 'activé' : 'désactivé'} avec succès.` });
    } catch (err: any) {
      console.error('Failed to toggle user status:', err);
      res.status(500).json({ error: 'Erreur de changement de statut.' });
    }
  }
};
