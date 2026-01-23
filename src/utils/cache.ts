import NodeCache from 'node-cache';
import { logger } from './logger';

const nodeCache = new NodeCache();

export const cacheKeys = {
  user: (userId: string) => `user:${userId}`,
};

export const cache = {
  get: <T>(key: string): T | undefined => {
    const value = nodeCache.get<T>(key);
    if (value) {
      logger.info({ key }, 'Cache hit');
    } else {
      logger.info({ key }, 'Cache miss');
    }
    return value;
  },
  set: <T>(key: string, value: T, ttlSeconds: number = 0): boolean => {
    const result = nodeCache.set<T>(key, value, ttlSeconds);
    logger.debug({ key }, 'Cache set');
    return result;
  },
  del: (key: string): number => {
    const result = nodeCache.del(key);
    logger.debug({ key }, 'Cache invalidated');
    return result;
  },
  flush: (): void => {
    nodeCache.flushAll();
    logger.debug('Cache flushed');
  },
};
