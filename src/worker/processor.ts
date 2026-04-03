import { db } from '../utils/db';
import { logger } from '../utils/logger';

export async function simulateWork(jobId: string): Promise<void> {
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
