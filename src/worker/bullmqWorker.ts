import { Worker } from 'bullmq';
import { db } from '../utils/db';
import { logger } from '../utils/logger';
import { workerConfig } from '../config/worker';
import { connection } from '../utils/queue';
import { simulateWork } from './processor';
import { JobStatus } from '../generated/prisma/client';

export function createBullMQWorker() {
  const worker = new Worker(
    'jobs',
    async (job) => {
      const { jobId } = job.data as { jobId: string };

      logger.info({ jobId, bullmqJobId: job.id }, 'BullMQ processing job');

      await db.job.update({
        where: { id: jobId },
        data: { status: JobStatus.PROCESSING },
      });

      await simulateWork(jobId);
    },
    {
      connection,
      concurrency: workerConfig.concurrency,
    },
  );

  worker.on('completed', async (job) => {
    const { jobId } = job.data as { jobId: string };

    await db.job.update({
      where: { id: jobId },
      data: { status: JobStatus.COMPLETED },
    });

    logger.info({ jobId }, 'Job completed successfully');
  });

  worker.on('failed', async (job, err) => {
    if (!job) return;

    const { jobId } = job.data as { jobId: string };
    const isFinalFailure = job.attemptsMade >= (job.opts.attempts ?? 1);

    if (isFinalFailure) {
      await db.job.update({
        where: { id: jobId },
        data: {
          status: JobStatus.FAILED,
          lastError: err.message,
        },
      });
      logger.error({ jobId }, 'Job failed permanently after max retries');
    } else {
      logger.warn({ jobId, attempt: job.attemptsMade }, 'Job failed, will be retried by BullMQ');
    }
  });

  worker.on('error', (err) => {
    logger.error({ err }, 'BullMQ worker error');
  });

  logger.info(
    { concurrency: workerConfig.concurrency, maxRetries: workerConfig.maxRetries },
    'BullMQ worker started',
  );

  return worker;
}
