import { z } from 'zod';
import { baseConfigSchema, baseConfig } from './base';

const boolStringSchema = z.enum(['true', 'false']).transform((v) => v === 'true');

const appConfigSchema = baseConfigSchema.extend({
  port: z.coerce.number().int().min(1).max(65535).default(3000),
  hostname: z.string().default('0.0.0.0'),
  sessionSecret: z.string().min(32, 'Session secret must be at least 32 characters'),
  cookieSecure: boolStringSchema.default('false'),
  corsOrigin: z.string().url().optional(),
  requestTimeoutMs: z.coerce.number().int().min(1000).default(10000),
  rateLimitMax: z.coerce.number().int().min(1).default(100),
  rateLimitWindowSeconds: z.coerce.number().int().min(1).default(900),
});

export type AppConfig = z.infer<typeof appConfigSchema>;

function loadAppConfig(): AppConfig {
  const parsed = appConfigSchema.safeParse({
    ...baseConfig,
    port: process.env.PORT,
    hostname: process.env.HOSTNAME,
    sessionSecret: process.env.SESSION_SECRET,
    cookieSecure: process.env.COOKIE_SECURE,
    corsOrigin: process.env.CORS_ORIGIN,
    requestTimeoutMs: process.env.REQUEST_TIMEOUT_MS,
    rateLimitMax: process.env.RATE_LIMIT_MAX,
    rateLimitWindowSeconds: process.env.RATE_LIMIT_WINDOW_SECONDS,
  });

  if (!parsed.success) {
    console.error('App configuration error:', parsed.error.format());
    process.exit(1);
  }

  return parsed.data;
}

export const appConfig = loadAppConfig();
