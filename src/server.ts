import app from './app';
import dotenv from 'dotenv';
import { config } from './config';
import { logger } from './utils/logger';
import { db } from './utils/db';

dotenv.config();

const server = app.listen(config.port, () => {
  logger.info(`Server running on http://localhost:${config.port}`);
});

async function gracefulShutdown(signal: string) {
  logger.info(`${signal} received, shutting down gracefully`);

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      await db.$disconnect();
      logger.info('Database connection closed');
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

