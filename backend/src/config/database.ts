import { PrismaClient } from '@prisma/client';
import { ENV } from './environment';

let prismaInstance: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    try {
      prismaInstance = new PrismaClient({
        datasources: {
          db: {
            url: ENV.DATABASE_URL,
          },
        },
      });
      console.log('ORM Prisma Client lazily initialized successfully with target database URL.');
    } catch (error) {
      console.error('Critical warning: Failed to initialize PrismaClient lazily.', error);
      // Create fallback dummy structure to prevent server crashes
      prismaInstance = new PrismaClient();
    }
  }
  return prismaInstance;
}
