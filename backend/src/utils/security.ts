import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/environment';

export const SecurityUtils = {
  /**
   * Haches a plaintext password safely.
   */
  hashPassword(password: string): string {
    return bcrypt.hashSync(password, 10);
  },

  /**
   * Validates a password against its hash representation.
   */
  comparePassword(password: string, hash: string): boolean {
    try {
      return bcrypt.compareSync(password, hash);
    } catch (e) {
      console.error('Password comparison error:', e);
      return false;
    }
  },

  /**
   * Generates a JWT token signed with JWT_SECRET.
   */
  generateToken(payload: object, expiresIn: any = ENV.JWT_EXPIRES_IN): string {
    return jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: expiresIn as any });
  },

  /**
   * Verifies a JWT token signature.
   */
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, ENV.JWT_SECRET);
    } catch (err) {
      return null;
    }
  }
};
