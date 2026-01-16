import { Router } from 'express';
import { createJob } from '../controllers/jobController';

export const jobsRouter = Router();

jobsRouter.post('/', createJob);
