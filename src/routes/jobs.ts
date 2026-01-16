import { Router } from 'express';
import { createJob } from '../controllers/jobController';
import { requireAuth } from '../middleware/auth';

export const jobsRouter = Router();

jobsRouter.post('/', requireAuth, createJob);
