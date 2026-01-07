import express from 'express';
import pinoHttp from 'pino-http';
import logger from './utils/logger';
import healthRouter from './routes/health';

const app = express();

app.use(pinoHttp({ logger }));

app.use('/health', healthRouter);

export default app;
