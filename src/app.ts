import express from 'express';
import pinoHttp from 'pino-http';
import cors from 'cors';
import { logger } from './utils/logger';
import { healthRouter } from './routes/health';
import { jobsRouter } from './routes/jobs';

const app = express();

app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger }));

app.use('/health', healthRouter);
app.use('/jobs', jobsRouter);

export default app;
