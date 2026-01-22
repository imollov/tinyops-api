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
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

function encodeCursor(createdAt: Date, id: string) {
  const str = JSON.stringify({ createdAt: createdAt.toISOString(), id });
  return Buffer.from(str, 'utf-8').toString('base64url');
}

function decodeCursor(cursor: string): { createdAt: Date; id: string } | null {
  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf-8');
    const parsed = JSON.parse(decoded);
    if (typeof parsed.createdAt !== 'string' || typeof parsed.id !== 'string') return null;
    const d = new Date(parsed.createdAt);
    if (isNaN(d.getTime())) return null;
    return { createdAt: d, id: parsed.id };
  } catch {
    return null;
  }
}

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
    return sendError(res, 400, 'Invalid query parameters', parsed.error.format());
  }

  const { status, type, limit, cursor } = parsed.data;

  const cursorData = cursor ? decodeCursor(cursor) : null;
  if (cursor && !cursorData) {
    return sendError(res, 400, 'Invalid cursor');
  }

  let where: any = { userId: req.session.userId! };
  if (status) where.status = status;
  if (type) where.type = type;

  if (cursorData)
    where.OR = [
      { createdAt: { lt: cursorData.createdAt } },
      { createdAt: cursorData.createdAt, id: { lte: cursorData.id } },
    ];

  try {
    const jobs = await db.job.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });

    const jobsResponse = jobs.slice(0, limit).map((job) => ({
      id: job.id,
      type: job.type,
      payload: job.payload,
      runAt: job.runAt.toISOString(),
      createdAt: job.createdAt.toISOString(),
      status: job.status,
    }));

    const hasMore = jobs.length > limit;
    const nextCursor = hasMore ? encodeCursor(jobs[limit].createdAt, jobs[limit].id) : null;

    res.status(200).send({ jobs: jobsResponse, nextCursor });
  } catch (error) {
    return sendError(res, 500, 'Failed to retrieve jobs');
  }
};
