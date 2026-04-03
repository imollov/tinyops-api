import { Queue } from 'bullmq';
import { baseConfig } from '../config/base';
import { workerConfig } from '../config/worker';

const url = new URL(baseConfig.redisUrl);

export const connection = {
  host: url.hostname,
  port: Number(url.port) || 6379,
};

export const jobQueue = new Queue('jobs', {
  connection,
  defaultJobOptions: {
    attempts: workerConfig.maxRetries,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
});
