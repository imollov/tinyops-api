import { db } from '../utils/db';
import { logger } from '../utils/logger';
import { workerConfig } from '../config/worker';
import { pollJobs } from './processor';

async function startWorker() {
  logger.info('Worker started');

  while (true) {
    await pollJobs();
    await new Promise((resolve) => setTimeout(resolve, workerConfig.pollIntervalMs));
  }
}

process.on('SIGINT', async () => {
  logger.info('Worker shutting down...');
  await db.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Worker shutting down...');
  await db.$disconnect();
  process.exit(0);
});

startWorker().catch((error) => {
  logger.error({ error }, 'Worker crashed');
  process.exit(1);
});
