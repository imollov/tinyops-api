import Redis from 'ioredis';
import { logger } from './logger';
import { config } from '../config';

export const redis = new Redis(config.redisUrl);

redis.on('error', (err) => {
  logger.error({ err }, 'Redis error');
});

redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('ready', () => {
  logger.info('Redis ready');
});

redis.on('close', () => {
  logger.info('Redis connection closed');
});
