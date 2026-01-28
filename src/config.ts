import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  port: z.coerce.number().int().min(1).max(65535).default(3000),
  hostname: z.string().default('0.0.0.0'),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  databaseUrl: z.string().url(),
  sessionSecret: z.string().min(32, 'Session secret must be at least 32 characters'),
  rateLimitMax: z.coerce.number().int().min(1).default(100),
  rateLimitWindowSeconds: z.coerce.number().int().min(1).default(900),
  logLevel: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  pollIntervalMs: z.coerce.number().int().min(1000).default(5000),
  maxRetries: z.coerce.number().int().min(1).default(3),
});

type AppConfig = z.infer<typeof configSchema>;

function loadConfig(): AppConfig {
  const parsed = configSchema.safeParse({
    port: process.env.PORT,
    hostname: process.env.HOSTNAME,
    nodeEnv: process.env.NODE_ENV,
    databaseUrl: process.env.DATABASE_URL,
    sessionSecret: process.env.SESSION_SECRET,
    rateLimitMax: process.env.RATE_LIMIT_MAX,
    rateLimitWindowSeconds: process.env.RATE_LIMIT_WINDOW_SECONDS,
    logLevel: process.env.LOG_LEVEL,
    pollIntervalMs: process.env.POLL_INTERVAL_MS,
    maxRetries: process.env.MAX_RETRIES,
  });

  if (!parsed.success) {
    console.error('Configuration error:', parsed.error.format());
    process.exit(1);
  }

  return parsed.data;
}

export const config = loadConfig();
