import { exec } from 'child_process';
import { promisify } from 'util';
import { db } from '../src/utils/db';
import RedisMock from 'ioredis-mock';

const execAsync = promisify(exec);

jest.setTimeout(10000);

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL || 'postgresql://tinyops:password@localhost:5432/tinyops_test';
process.env.SESSION_SECRET = 'test-secret-key-minimum-32-chars-long';

jest.mock('../src/utils/redis', () => ({
  redis: new RedisMock(),
}));

beforeAll(async () => {
  await execAsync('npx prisma db push --skip-generate --accept-data-loss', { env: process.env });
});

afterEach(async () => {
  await db.job.deleteMany();
  await db.user.deleteMany();
});

afterAll(async () => {
  await db.$disconnect();
});
