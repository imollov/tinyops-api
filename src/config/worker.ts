import { z } from 'zod';
import { baseConfigSchema, baseConfig } from './base';

const workerConfigSchema = baseConfigSchema.extend({
  pollIntervalMs: z.coerce.number().int().min(1000).default(5000),
  maxRetries: z.coerce.number().int().min(1).default(3),
});

export type WorkerConfig = z.infer<typeof workerConfigSchema>;

function loadWorkerConfig(): WorkerConfig {
  const parsed = workerConfigSchema.safeParse({
    ...baseConfig,
    pollIntervalMs: process.env.POLL_INTERVAL_MS,
    maxRetries: process.env.MAX_RETRIES,
  });

  if (!parsed.success) {
    console.error('Worker configuration error:', parsed.error.format());
    process.exit(1);
  }

  return parsed.data;
}

export const workerConfig = loadWorkerConfig();
