import express from 'express';
import pinoHttp from 'pino-http';
import logger from './utils/logger';
import healthRouter from './routes/health';
import jobsRouter from './routes/jobs';

const app = express();

app.use(express.json());
app.use(pinoHttp({ logger }));

app.use('/health', healthRouter);
app.use('/jobs', jobsRouter);

export default app;
