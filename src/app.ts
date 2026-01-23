import express from 'express';
import pinoHttp from 'pino-http';
import cors from 'cors';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
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
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
  }),
);

app.use(
  rateLimit({
    windowMs: process.env.RATE_LIMIT_WINDOW_SECONDS
      ? parseInt(process.env.RATE_LIMIT_WINDOW_SECONDS) * 1000
      : 15 * 60 * 1000,
    max: process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX) : 100,
    message: { error: 'Too many requests' },
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/jobs', jobsRouter);

export default app;
