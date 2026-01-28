import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../src/app';
import { db } from '../src/utils/db';
import { JobStatus } from '../src/generated/prisma/client';

describe('Job Endpoints', () => {
  let agent: ReturnType<typeof request.agent>;
  let userId: string;

  beforeEach(async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await db.user.create({
      data: {
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword,
      },
    });
    userId = user.id;

    agent = request.agent(app);
    await agent.post('/auth/login').send({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  describe('POST /jobs', () => {
    it('should create a job', async () => {
      const jobData = {
        type: 'test-job',
        payload: { data: 'test' },
      };

      const response = await agent.post('/jobs').send(jobData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Job created');
      expect(response.body.job).toHaveProperty('type', jobData.type);
      expect(response.body.job).toHaveProperty('status', JobStatus.PENDING);
      expect(response.body.job).toHaveProperty('payload', jobData.payload);
    });

    it('should schedule a job for future', async () => {
      const runAt = new Date(Date.now() + 60000);
      const jobData = {
        type: 'test-job',
        payload: { data: 'test' },
        runAt: runAt.toISOString(),
      };

      const response = await agent.post('/jobs').send(jobData);

      expect(response.status).toBe(201);
      expect(new Date(response.body.job.runAt).getTime()).toBeGreaterThan(Date.now());
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app).post('/jobs').send({ type: 'test', payload: {} });

      expect(response.status).toBe(401);
    });

    it('should validate input', async () => {
      const response = await agent.post('/jobs').send({ type: 123 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /jobs', () => {
    beforeEach(async () => {
      await db.job.createMany({
        data: [
          {
            userId,
            type: 'job1',
            payload: {},
            status: JobStatus.PENDING,
          },
          {
            userId,
            type: 'job2',
            payload: {},
            status: JobStatus.COMPLETED,
          },
          {
            userId,
            type: 'job3',
            payload: {},
            status: JobStatus.PROCESSING,
          },
        ],
      });

      const otherUser = await db.user.create({
        data: {
          username: 'other',
          email: 'other@example.com',
          name: 'Other',
          password: 'hash',
        },
      });
      await db.job.create({
        data: {
          userId: otherUser.id,
          type: 'other-job',
          payload: {},
          status: JobStatus.PENDING,
        },
      });
    });

    it('should list user jobs', async () => {
      const response = await agent.get('/jobs');

      expect(response.status).toBe(200);
      expect(response.body.jobs).toHaveLength(3);
    });

    it('should filter by status', async () => {
      const response = await agent.get('/jobs?status=COMPLETED');

      expect(response.status).toBe(200);
      expect(response.body.jobs).toHaveLength(1);
      expect(response.body.jobs[0]).toHaveProperty('status', JobStatus.COMPLETED);
    });

    it('should filter by type', async () => {
      const response = await agent.get('/jobs?type=job1');

      expect(response.status).toBe(200);
      expect(response.body.jobs).toHaveLength(1);
      expect(response.body.jobs[0]).toHaveProperty('type', 'job1');
    });

    it('should paginate results', async () => {
      const response = await agent.get('/jobs?limit=2');

      expect(response.status).toBe(200);
      expect(response.body.jobs).toHaveLength(2);
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app).get('/jobs');

      expect(response.status).toBe(401);
    });
  });
});
