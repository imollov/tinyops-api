import { Request, Response } from 'express';
import * as z from 'zod';
import bcrypt from 'bcrypt';
import { db } from '../utils/db';
import { sendError } from '../utils/errors';
import { cache, cacheKeys } from '../utils/cache';
import { User } from '../generated/prisma/client';

const registerUserSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(100)
    .regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  name: z.string().max(255).optional(),
  password: z.string().min(6).max(255),
});

const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(255),
});

function toUserResponse(user: User) {
  return {
    username: user.username,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt.toISOString(),
  };
}

export const registerUser = async (req: Request, res: Response) => {
  const parseResult = registerUserSchema.safeParse(req.body);
  if (!parseResult.success) {
    return sendError(res, 400, 'Invalid registration data', parseResult.error.errors);
  }

  const user = parseResult.data;

  try {
    const existingUser = await db.user.findFirst({
      where: {
        OR: [{ username: user.username }, { email: user.email }],
      },
    });

    if (existingUser) {
      return sendError(res, 409, 'Username or email already in use');
    }

    const hashedPassword = await bcrypt.hash(user.password, 10);

    const newUser = await db.user.create({
      data: {
        username: user.username,
        email: user.email,
        name: user.name,
        password: hashedPassword,
      },
    });

    req.session.userId = newUser.id;

    res.status(201).send({ message: 'User registered', user: toUserResponse(newUser) });
  } catch (error) {
    return sendError(res, 500, 'Failed to register user');
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const parseResult = loginUserSchema.safeParse(req.body);
  if (!parseResult.success) {
    return sendError(res, 400, 'Invalid login data', parseResult.error.errors);
  }

  const { email, password } = parseResult.data;

  try {
    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      return sendError(res, 401, 'Invalid email or password');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return sendError(res, 401, 'Invalid email or password');
    }

    req.session.userId = user.id;

    res.status(200).send({ message: 'Login successful' });
  } catch (error) {
    return sendError(res, 500, 'Failed to login user');
  }
};

export const logoutUser = (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return sendError(res, 500, 'Failed to logout user');
    }
    res.status(200).send({ message: 'Logout successful' });
  });
};

export const getCurrentUser = async (req: Request, res: Response) => {
  const userId = req.session.userId!;
  const cacheKey = cacheKeys.user(userId);

  try {
    const cachedUser = cache.get<User>(cacheKey);
    if (cachedUser) {
      return res.status(200).send({ user: toUserResponse(cachedUser) });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    cache.set(cacheKey, user);

    res.status(200).send({ user: toUserResponse(user) });
  } catch (error) {
    return sendError(res, 500, 'Failed to retrieve user');
  }
};
