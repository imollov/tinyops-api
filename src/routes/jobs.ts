import { Router } from 'express';
import { createJob, getAllJobs } from '../controllers/jobController';
import { requireAuth } from '../middleware/auth';
export const jobsRouter = Router();

jobsRouter.post('/', requireAuth, createJob);
jobsRouter.get('/', requireAuth, getAllJobs);
