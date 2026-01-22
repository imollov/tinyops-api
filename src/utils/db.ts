import { PrismaClient } from '../generated/prisma/client';
import { logger } from './logger';

export const db = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'event' },
  ],
});

db.$on('query', (e) => {
  logger.debug({ query: e.query, params: e.params, duration: `${e.duration}ms` }, 'Prisma Query');
});

db.$on('error', (e) => {
  logger.error(e.message);
});
