import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../src/app';
import { db } from '../src/utils/db';

describe('Auth Endpoints', () => {
  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      };

      const response = await request(app).post('/auth/register').send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'User registered');
      expect(response.body.user).toHaveProperty('username', userData.username);
      expect(response.body.user).toHaveProperty('email', userData.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should reject duplicate email', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      };

      await request(app).post('/auth/register').send(userData);

      const response = await request(app)
        .post('/auth/register')
        .send({ ...userData, username: 'different' });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error');
    });

    it('should validate input', async () => {
      const response = await request(app).post('/auth/register').send({ email: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      await db.user.create({
        data: {
          username: 'testuser',
          email: 'test@example.com',
          name: 'Test User',
          password: hashedPassword,
        },
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app).post('/auth/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should reject invalid password', async () => {
      const response = await request(app).post('/auth/login').send({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toHaveProperty('message', 'Invalid email or password');
    });

    it('should reject non-existent user', async () => {
      const response = await request(app).post('/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toHaveProperty('message', 'Invalid email or password');
    });
  });

  describe('GET /auth/me', () => {
    it('should return current user when authenticated', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      await db.user.create({
        data: {
          username: 'testuser',
          email: 'test@example.com',
          name: 'Test User',
          password: hashedPassword,
        },
      });

      const agent = request.agent(app);
      await agent.post('/auth/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      const response = await agent.get('/auth/me');

      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app).get('/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Not authenticated');
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      await db.user.create({
        data: {
          username: 'testuser',
          email: 'test@example.com',
          name: 'Test User',
          password: hashedPassword,
        },
      });

      const agent = request.agent(app);
      await agent.post('/auth/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      const response = await agent.post('/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Logout successful');
    });
  });
});
