# TinyOps API

A modern, production-ready REST API built with Node.js, TypeScript, Express, and Prisma. Features include authentication, job management with background workers, Redis caching, and automated testing.

## Features

- 🚀 **TypeScript** - Type-safe development
- 🔐 **Authentication** - Session-based auth with password hashing
- 📊 **Job Management** - Background job processing with worker service
- 💾 **PostgreSQL** - Prisma ORM for database management
- ⚡ **Redis** - Session storage and caching
- 🐂 **BullMQ** - Job queue with retries, backoff, and delayed jobs
- 🛡️ **Security** - Helmet, CORS, rate limiting
- 🧪 **Testing** - Jest with supertest
- 🖥️ **Dashboard** - Minimal React UI for managing jobs
- 🐳 **Docker** - Containerized development and deployment
- ☸️ **Kubernetes** - Ready for orchestration
- 📝 **Logging** - Pino structured logging

## Prerequisites

- Node.js 18+
- Docker and Docker Compose
- npm or yarn

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd tinyops-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment setup

Copy `.env.example` to `.env` and update the variables as needed:

```env
# Server
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# Security
SESSION_SECRET=your-super-secret-session-key-change-in-production
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_SECONDS=900

# Database
DATABASE_URL=postgresql://tinyops:password@localhost:5432/tinyops

# Redis
REDIS_URL=redis://localhost:6379

# Worker
POLL_INTERVAL_MS=5000
WORKER_CONCURRENCY=5
MAX_RETRIES=3
```

### 4. Start services

Start PostgreSQL and Redis:

```bash
npm run db:up
```

### 5. Database setup

Generate Prisma client and run migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 6. Start development server

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

### 7. Start worker

In a separate terminal:

```bash
npm run worker
```

## API Endpoints

### Health

- `GET /health` - Health check endpoint

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Jobs

- `POST /api/jobs` - Create a new job
- `GET /api/jobs` - List all jobs
- `GET /api/jobs?status=...&type=...` - Filter jobs by status and type
- `GET /api/jobs?cursor=...&limit=...` - Cursor pagination

## User Interface

A lightweight React dashboard for monitoring and creating jobs is available under `/web`.
See `web/README.md` for setup instructions.

## Docker

Build and run the application using Docker:

```bash
docker-compose up --build
```

## Testing

The project uses Jest with supertest for integration testing. Run tests with:

```bash
npm test
```

## Code Quality

ESLint and Prettier are configured for code quality and formatting. Use the following commands:

```bash
npm run lint
npm run format
```

## Kubernetes

Apply all manifests from the `k8s` directory:

```bash
kubectl apply -f k8s/
```

## AWS Deployment

Deployed on AWS with a production-style setup:

- **ECS Fargate**: API service + worker service
- **Application Load Balancer**: routes traffic to API tasks
- **RDS PostgreSQL**: primary datastore
- **ElastiCache Redis**: sessions, caching, and job queue
- **ECR**: Docker image registry
- **CloudWatch Logs**: centralized logs for API + worker

## License

MIT
