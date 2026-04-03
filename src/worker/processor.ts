import { db } from '../utils/db';
import { logger } from '../utils/logger';
import { workerConfig } from '../config/worker';
import { JobStatus } from '../generated/prisma/client';

export async function pollJobs() {
  try {
    const jobs = await claimJobs();

    if (jobs.length > 0) {
      logger.info({ count: jobs.length }, 'Found pending jobs');

      await Promise.all(jobs.map((job) => processJob(job.id)));
    }
  } catch (error) {
    logger.error({ error }, 'Error polling jobs');
  }
}

export async function claimJobs(limit = 10): Promise<{ id: string }[]> {
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
