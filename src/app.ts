import express from 'express';
import helmet from 'helmet';
import nocache from 'nocache';
import pinoHttp from 'pino-http';
import cors from 'cors';
import timeout from 'connect-timeout';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import { RedisStore } from 'connect-redis';
import { appConfig } from './config/app';
import { logger } from './utils/logger';
import { redis } from './utils/redis';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { jobsRouter } from './routes/jobs';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();

app.use(helmet());
app.use(nocache());
app.use(cors());
app.use(timeout(appConfig.requestTimeoutMs));
app.use(express.json());
app.use(pinoHttp({ logger }));

app.use(
  session({
    store: new RedisStore({ client: redis }),
    secret: appConfig.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: appConfig.cookieSecure,
      sameSite: 'lax',
    },
  }),
);

app.use(
  rateLimit({
    windowMs: appConfig.rateLimitWindowSeconds * 1000,
    max: appConfig.rateLimitMax,
    message: { error: 'Too many requests' },
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/jobs', jobsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
