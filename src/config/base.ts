import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

export const baseConfigSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  databaseUrl: z.string().url(),
  redisUrl: z.string().url().default('redis://localhost:6379'),
  logLevel: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export type BaseConfig = z.infer<typeof baseConfigSchema>;

export function loadBaseConfig(): BaseConfig {
  const parsed = baseConfigSchema.safeParse({
    nodeEnv: process.env.NODE_ENV,
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    logLevel: process.env.LOG_LEVEL,
  });

  if (!parsed.success) {
    console.error('Base configuration error:', parsed.error.format());
    process.exit(1);
  }

  return parsed.data;
}

export const baseConfig = loadBaseConfig();
