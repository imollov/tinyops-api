import bcrypt from 'bcrypt';
import { db } from '../src/utils/db';
import { claimJobs } from '../src/worker/dbPollingWorker';

describe('claimJobs', () => {
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
  });

  async function createPendingJobs(count: number) {
    await db.job.createMany({
      data: Array.from({ length: count }, (_, i) => ({
        type: 'test-job',
        payload: { index: i },
        userId,
      })),
    });
  }

  it('claims pending jobs and marks them as PROCESSING', async () => {
    await createPendingJobs(3);

    const claimed = await claimJobs();

    expect(claimed).toHaveLength(3);

    const jobs = await db.job.findMany({ where: { id: { in: claimed.map((j) => j.id) } } });
    expect(jobs.every((j) => j.status === 'PROCESSING')).toBe(true);
  });

  it('does not double-claim jobs when two workers poll concurrently', async () => {
    await createPendingJobs(5);

    // Simulate two worker instances claiming at the same time
    const [claimedByWorker1, claimedByWorker2] = await Promise.all([claimJobs(), claimJobs()]);

    const ids1 = new Set(claimedByWorker1.map((j) => j.id));
    const ids2 = new Set(claimedByWorker2.map((j) => j.id));

    // No job should appear in both claim sets
    const overlap = [...ids1].filter((id) => ids2.has(id));
    expect(overlap).toHaveLength(0);

    // All 5 jobs should be claimed exactly once across both workers
    expect(ids1.size + ids2.size).toBe(5);
  });

  it('respects the limit and leaves remaining jobs for the next poll', async () => {
    await createPendingJobs(6);

    const claimed = await claimJobs(4);

    expect(claimed).toHaveLength(4);

    const remaining = await db.job.count({ where: { status: 'PENDING' } });
    expect(remaining).toBe(2);
  });

  it('skips jobs scheduled in the future', async () => {
    await db.job.create({
      data: {
        type: 'future-job',
        payload: {},
        userId,
        runAt: new Date(Date.now() + 60_000),
      },
    });

    const claimed = await claimJobs();

    expect(claimed).toHaveLength(0);
  });
});
