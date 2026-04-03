/**
 * DB Polling Worker
 *
 * A self-contained job worker that uses the database as the queue.
 * Jobs are claimed atomically using SELECT ... FOR UPDATE SKIP LOCKED,
 * which prevents double-processing when multiple worker instances run concurrently.
 *
 * This module is kept alongside the BullMQ worker (bullmqWorker.ts) to illustrate
 * the difference between the two approaches:
 *  - BullMQ: Redis-backed, sub-second pickup latency, built-in retries/concurrency
 *  - DB polling: No extra infrastructure, audit trail in SQL, sufficient for low-medium throughput
 */
import { db } from '../utils/db';
import { logger } from '../utils/logger';
import { workerConfig } from '../config/worker';
import { simulateWork } from './processor';
import { JobStatus } from '../generated/prisma/client';

export async function startDbPollingWorker() {
  logger.info('DB polling worker started');

  while (true) {
    await pollJobs();
    await new Promise((resolve) => setTimeout(resolve, workerConfig.pollIntervalMs));
  }
}

export async function pollJobs() {
  try {
    const jobs = await claimJobs(workerConfig.concurrency);

    if (jobs.length > 0) {
      logger.info({ count: jobs.length }, 'Found pending jobs');

      await Promise.all(jobs.map((job) => processJob(job.id)));
    }
  } catch (error) {
    logger.error({ error }, 'Error polling jobs');
  }
}

export async function claimJobs(limit = 5): Promise<{ id: string }[]> {
  const safeLimit = Math.max(1, Math.floor(limit));
  return db.$queryRawUnsafe<{ id: string }[]>(`
    UPDATE jobs
    SET status = 'PROCESSING', updated_at = NOW()
    WHERE id IN (
      SELECT id FROM jobs
      WHERE status = 'PENDING'
        AND run_at <= NOW()
      ORDER BY run_at ASC
      LIMIT ${safeLimit}
      FOR UPDATE SKIP LOCKED
    )
    RETURNING id
  `);
}

async function processJob(jobId: string) {
  logger.info({ jobId }, 'Processing job');

  try {
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

    if (attempts >= workerConfig.maxRetries) {
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
