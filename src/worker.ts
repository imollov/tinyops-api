import 'dotenv/config';
import { db } from './utils/db';
import { config } from './config';
import { logger } from './utils/logger';
import { JobStatus } from './generated/prisma/client';

async function processJob(jobId: string) {
  logger.info({ jobId }, 'Processing job');

  try {
    await db.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.PROCESSING,
        updatedAt: new Date(),
      },
    });

    await simulateWork(jobId);

    await db.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.COMPLETED,
        updatedAt: new Date(),
      },
    });

    logger.info({ jobId }, 'Job completed successfully');
  } catch (error) {
    const job = await db.job.findUnique({ where: { id: jobId } });
    const attempts = (job?.attempts || 0) + 1;

    logger.error({ jobId, error, attempts }, 'Job failed');

    if (attempts >= config.maxRetries) {
      await db.job.update({
        where: { id: jobId },
        data: {
          status: JobStatus.FAILED,
          attempts,
          lastError: error instanceof Error ? error.message : 'Unknown error',
          updatedAt: new Date(),
        },
      });
      logger.error({ jobId }, 'Job failed permanently after max retries');
    } else {
      await db.job.update({
        where: { id: jobId },
        data: {
          status: JobStatus.PENDING,
          attempts,
          lastError: error instanceof Error ? error.message : 'Unknown error',
          updatedAt: new Date(),
        },
      });
      logger.warn({ jobId, attempts }, 'Job will be retried');
    }
  }
}

async function simulateWork(jobId: string): Promise<void> {
  const job = await db.job.findUnique({ where: { id: jobId } });

  if (!job) {
    throw new Error('Job not found');
  }

  logger.info({ jobId, type: job.type, payload: job.payload }, 'Simulating job work');

  const workTime = 2000 + Math.random() * 3000;
  await new Promise((resolve) => setTimeout(resolve, workTime));

  if (Math.random() < 0.2) {
    throw new Error('Simulated job failure');
  }
}

async function pollJobs() {
  try {
    const jobs = await db.job.findMany({
      where: {
        status: JobStatus.PENDING,
        runAt: {
          lte: new Date(),
        },
      },
      take: 10,
      orderBy: {
        runAt: 'asc',
      },
    });

    if (jobs.length > 0) {
      logger.info({ count: jobs.length }, 'Found pending jobs');

      await Promise.all(jobs.map((job) => processJob(job.id)));
    }
  } catch (error) {
    logger.error({ error }, 'Error polling jobs');
  }
}

async function startWorker() {
  logger.info('Worker started');

  while (true) {
    await pollJobs();
    await new Promise((resolve) => setTimeout(resolve, config.pollIntervalMs));
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
