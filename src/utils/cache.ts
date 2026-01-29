import { logger } from './logger';
import { redis } from './redis';

export const cacheKeys = {
  user: (userId: string) => `user:${userId}`,
};

export const cache = {
  get: async <T>(key: string): Promise<T | undefined> => {
    try {
      const value = await redis.get(key);
      if (value) {
        logger.info({ key }, 'Cache hit');
        return JSON.parse(value) as T;
      } else {
        logger.info({ key }, 'Cache miss');
        return undefined;
      }
    } catch (err) {
      logger.error({ err, key }, 'Cache get error');
      return undefined;
    }
  },
  set: async <T>(key: string, value: T, ttlSeconds: number = 0): Promise<boolean> => {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await redis.setex(key, ttlSeconds, serialized);
      } else {
        await redis.set(key, serialized);
      }
      logger.debug({ key }, 'Cache set');
      return true;
    } catch (error) {
      logger.error({ error, key }, 'Cache set error');
      return false;
    }
  },
  del: async (key: string): Promise<number> => {
    try {
      const result = await redis.del(key);
      logger.debug({ key }, 'Cache invalidated');
      return result;
    } catch (error) {
      logger.error({ error, key }, 'Cache del error');
      return 0;
    }
  },
  flush: async (): Promise<void> => {
    try {
      await redis.flushall();
      logger.debug('Cache flushed');
    } catch (error) {
      logger.error({ error }, 'Cache flush error');
    }
  },
};
