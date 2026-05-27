import { PrismaClient } from '@prisma/client';
import { ENV } from './environment';
import { InMemoryDb } from './inMemoryDb';

let realPrisma: PrismaClient | null = null;
let proxiedPrisma: any = null;

export function getPrismaClient(): PrismaClient {
  if (!proxiedPrisma) {
    if (!realPrisma) {
      try {
        realPrisma = new PrismaClient({
          datasources: {
            db: {
              url: ENV.DATABASE_URL,
            },
          },
        });
        console.log('ORM Prisma Client lazily initialized successfully with target database URL.');
      } catch (error) {
        console.error('Critical warning: Failed to initialize PrismaClient lazily.', error);
        realPrisma = new PrismaClient();
      }
    }

    // Flag to track whether we have determined that PostgreSQL is permanently offline
    let isDbOffline = false;

    // Create custom Proxy to intercept all requests to Prisma Client
    proxiedPrisma = new Proxy(realPrisma, {
      get(target: any, prop: string | symbol) {
        // Intercept $transaction
        if (prop === '$transaction') {
          return async function (arg: any) {
            if (isDbOffline) {
              console.warn('[RESILIENCE] Performing transaction in-memory (PostgreSQL Offline).');
              if (typeof arg === 'function') {
                return await arg(proxiedPrisma);
              }
              return [];
            }
            try {
              // Try executing on real database
              if (typeof arg === 'function') {
                return await target.$transaction(async (tx: any) => {
                  const txProxy = createModelProxy(tx, () => { isDbOffline = true; });
                  return await arg(txProxy);
                });
              } else if (Array.isArray(arg)) {
                return await target.$transaction(arg);
              }
            } catch (error: any) {
              const errMsg = String(error.message || error);
              if (
                errMsg.includes('InitializationError') ||
                errMsg.includes('connection') ||
                errMsg.includes('unreachable') ||
                error.code?.startsWith('P1') ||
                error.code?.startsWith('P5') ||
                error.name === 'PrismaClientInitializationError'
              ) {
                console.error('[RESILIENCE] Transaction failed due to PostgreSQL offline. Diverting to in-memory.', error);
                isDbOffline = true;
                if (typeof arg === 'function') {
                  return await arg(proxiedPrisma);
                }
                return [];
              }
              throw error; // Let logic-specific errors bubble up
            }
          };
        }

        // Intercept raw query
        if (prop === '$queryRaw' || prop === '$executeRaw') {
          return async function (...args: any[]) {
            if (isDbOffline) return [{ '?column?': 1 }];
            try {
              return await target[prop](...args);
            } catch (error: any) {
              isDbOffline = true;
              console.error('[RESILIENCE] Raw query failed, falling back to static schema mock.', error);
              return [{ '?column?': 1 }];
            }
          };
        }

        // Standard properties
        if (typeof prop === 'string' && prop in target) {
          const propertyValue = target[prop];
          // If property is a model object (has findMany, findFirst etc.)
          if (propertyValue && typeof propertyValue === 'object') {
            return createModelProxyForProp(propertyValue, prop, () => { isDbOffline = true; }, isDbOffline);
          }
          return propertyValue;
        }

        // Catch model instances dynamically if not directly exposed
        if (typeof prop === 'string') {
          return createModelProxyForProp(null, prop, () => { isDbOffline = true; }, isDbOffline);
        }

        return target[prop];
      }
    });
  }

  return proxiedPrisma as PrismaClient;
}

/**
 * Creates a proxy on a specific model property (e.g., prisma.customer)
 */
function createModelProxyForProp(realModel: any, modelName: string, markOffline: () => void, isDbOfflineFlag: boolean) {
  const inMemoryDb = InMemoryDb.getInstance();

  return new Proxy(realModel || {}, {
    get(modelTarget: any, method: string | symbol) {
      if (typeof method !== 'string') return modelTarget[method];

      return async function (...args: any[]) {
        // If we already know the database is offline, execute directly in-memory for instant feedback
        if (isDbOfflineFlag) {
          console.log(`[RESILIENCE] [OFFLINE-MODE] Resolved query ${modelName}.${method} on In-Memory store.`);
          const inMemMethod = inMemoryDb[method as keyof InMemoryDb];
          if (typeof inMemMethod === 'function') {
            return inMemMethod.call(inMemoryDb, modelName, ...args);
          }
          return null;
        }

        try {
          if (realModel && typeof realModel[method] === 'function') {
            return await realModel[method](...args);
          }
        } catch (error: any) {
          const errMsg = String(error.message || error);
          if (
            errMsg.includes('InitializationError') ||
            errMsg.includes('connection') ||
            errMsg.includes('unreachable') ||
            error.code?.startsWith('P1') ||
            error.code?.startsWith('P5') ||
            error.name === 'PrismaClientInitializationError'
          ) {
            console.warn(`[RESILIENCE] PostgreSQL Offline detected during ${modelName}.${method}. Diverting query to InMemoryDb.`);
            markOffline();
            const inMemMethod = inMemoryDb[method as keyof InMemoryDb];
            if (typeof inMemMethod === 'function') {
              return inMemMethod.call(inMemoryDb, modelName, ...args);
            }
            return null;
          }
          throw error;
        }

        const inMemMethod = inMemoryDb[method as keyof InMemoryDb];
        if (typeof inMemMethod === 'function') {
          return inMemMethod.call(inMemoryDb, modelName, ...args);
        }
        return null;
      };
    }
  });
}

function createModelProxy(realTx: any, markOffline: () => void) {
  return new Proxy(realTx, {
    get(target: any, prop: string | symbol) {
      if (typeof prop === 'string' && prop in target) {
        const value = target[prop];
        if (value && typeof value === 'object') {
          return createModelProxyForProp(value, prop, markOffline, false);
        }
        return value;
      }
      return target[prop];
    }
  });
}
