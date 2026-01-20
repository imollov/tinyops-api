import { Request, Response } from 'express';
import * as z from 'zod';
import { db } from '../utils/db';
import { sendError } from '../utils/errors';
import { JobStatus } from '../generated/prisma/enums';

const createJobSchema = z.object({
  type: z.string().min(1).max(64),
  payload: z.record(z.any()).default({}),
  runAt: z.string().datetime().optional(),
});

const getAllJobsSchema = z.object({
  status: z.nativeEnum(JobStatus).optional(),
  type: z.string().max(64).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('100'),
  offset: z.string().regex(/^\d+$/).transform(Number).optional().default('0'),
});

export const createJob = async (req: Request, res: Response) => {
  const parsed = createJobSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, 'Invalid job data', parsed.error.format());
  }

  const job = parsed.data;

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
    return sendError(res, 500, 'Failed to create job');
  }
};

export const getAllJobs = async (req: Request, res: Response) => {
  const parsed = getAllJobsSchema.safeParse(req.query);
  if (!parsed.success) {
    return sendError(
      res,
      400,
      'Invalid query parameters',
      parsed.error.format(),
    );
  }

  const { status, type, limit, offset } = parsed.data;

  try {
    const jobs = await db.job.findMany({
      where: {
        userId: req.session.userId!,
        ...(status && { status }),
        ...(type && { type }),
      },
      select: {
        id: true,
        type: true,
        payload: true,
        runAt: true,
        status: true,
      },
      take: limit,
      skip: offset,
    });

    res.status(200).send({ jobs });
  } catch (error) {
    return sendError(res, 500, 'Failed to retrieve jobs');
  }
};
