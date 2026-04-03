import { db } from '../utils/db';
import { logger } from '../utils/logger';
import { createBullMQWorker } from './bullmqWorker';

const bullmqWorker = createBullMQWorker();

process.on('SIGINT', async () => {
  logger.info('Worker shutting down...');
  await bullmqWorker.close();
  await db.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Worker shutting down...');
  await bullmqWorker.close();
  await db.$disconnect();
  process.exit(0);
});
