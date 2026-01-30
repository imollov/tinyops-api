import app from './app';
import { appConfig } from './config/app';
import { logger } from './utils/logger';
import { redis } from './utils/redis';
import { db } from './utils/db';

const server = app.listen(appConfig.port, appConfig.hostname, () => {
  logger.info(`Server running on http://${appConfig.hostname}:${appConfig.port}`);
});

async function gracefulShutdown(signal: string) {
  logger.info(`${signal} received, shutting down gracefully`);

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      await db.$disconnect();
      logger.info('Database connection closed');
      await redis.quit();
      logger.info('Redis connection closed');
      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Error during shutdown');
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.fatal({ reason, promise }, 'Unhandled promise rejection');
  process.exit(1);
});
