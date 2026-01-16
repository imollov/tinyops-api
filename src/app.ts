import express from 'express';
import pinoHttp from 'pino-http';
import cors from 'cors';
import session from 'express-session';
import { logger } from './utils/logger';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { jobsRouter } from './routes/jobs';

const app = express();

app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'default_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
    },
  }),
);

app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/jobs', jobsRouter);

export default app;
