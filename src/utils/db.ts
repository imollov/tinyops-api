import { PrismaClient } from '../generated/prisma/client';
import logger from './logger';

const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'event' },
  ],
});

prisma.$on('query', (e) => {
  logger.debug(
    { query: e.query, params: e.params, duration: `${e.duration}ms` },
    'Prisma Query',
  );
});

prisma.$on('error', (e) => {
  logger.error(e.message);
});

export default prisma;
