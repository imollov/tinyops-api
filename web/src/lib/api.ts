const BASE = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      error?: string | { message?: string; details?: { message: string; path: string[] }[] };
    };
    const err = body.error;
    if (err && typeof err === 'object') {
      const detail = err.details?.map((d) => `${d.path.join('.')}: ${d.message}`).join(', ');
      throw new Error(detail ?? err.message ?? `HTTP ${res.status}`);
    }
    throw new Error(typeof err === 'string' ? err : `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ---- Auth ----

export interface User {
  username: string;
  email: string;
  name: string | null;
  createdAt: string;
}

export function fetchMe(): Promise<{ user: User }> {
  return request('/auth/me');
}

export function login({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<{ user: User }> {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function register(data: {
  username: string;
  email: string;
  password: string;
  name?: string;
}): Promise<{ user: User }> {
  return request('/auth/register', { method: 'POST', body: JSON.stringify(data) });
}

export function logout(): Promise<void> {
  return request('/auth/logout', { method: 'POST' });
}

// ---- Jobs ----

export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'RETRYING';

export interface Job {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  status: JobStatus;
  attempts: number;
  runAt: string;
  createdAt: string;
  updatedAt: string;
  lastError: string | null;
}

export interface JobsResponse {
  jobs: Job[];
  nextCursor: string | null;
}

export interface JobFilters {
  type?: string;
  status?: JobStatus;
}

const PAGE_SIZE = 20;

export function fetchJobs(filters: JobFilters = {}, cursor?: string): Promise<JobsResponse> {
  const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
  if (filters.type) params.set('type', filters.type);
  if (filters.status) params.set('status', filters.status);
  if (cursor) params.set('cursor', cursor);
  return request(`/jobs?${params.toString()}`);
}

export function createJob(data: {
  type: string;
  payload: Record<string, unknown>;
  runAt?: string;
}): Promise<{ job: Job }> {
  return request('/jobs', { method: 'POST', body: JSON.stringify(data) });
}
