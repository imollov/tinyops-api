import { Request, Response } from 'express';
import * as z from 'zod';
import { db } from '../utils/db';

const createJobSchema = z.object({
  type: z.string().min(1).max(64),
  payload: z.record(z.any()).default({}),
  runAt: z.string().datetime().optional(),
});

export const createJob = async (req: Request, res: Response) => {
  const parseResult = createJobSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res
      .status(400)
      .send({ error: 'Invalid job data', details: parseResult.error.errors });
  }

  const job = parseResult.data;

  try {
    const createdJob = await db.job.create({
      data: {
        type: job.type,
        payload: job.payload,
        runAt: job.runAt ? new Date(job.runAt) : undefined,
        userId: req.session.userId!,
      },
    });

    const jobResponse = {
      id: createdJob.id,
      type: createdJob.type,
      payload: createdJob.payload,
      runAt: createdJob.runAt,
      status: createdJob.status,
    };

    res.status(201).send({ message: 'Job created', job: jobResponse });
  } catch (error) {
    res.status(500).send({ error: 'Failed to create job' });
  }
};
