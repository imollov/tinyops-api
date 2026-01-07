import express from 'express';
import healthRouter from './routes/health';

const app = express();

app.use('/health', healthRouter);

export default app;
