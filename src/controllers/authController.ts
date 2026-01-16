import { Request, Response } from 'express';
import * as z from 'zod';
import bcrypt from 'bcrypt';
import { db } from '../utils/db';

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

export const registerUser = async (req: Request, res: Response) => {
  const parseResult = registerUserSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res
      .status(400)
      .send({ error: 'Invalid user data', details: parseResult.error.errors });
  }

  const user = parseResult.data;

  try {
    const existingUser = await db.user.findFirst({
      where: {
        OR: [{ username: user.username }, { email: user.email }],
      },
    });

    if (existingUser) {
      return res
        .status(409)
        .send({ error: 'Username or email already in use' });
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

    const userResponse = {
      username: newUser.username,
      email: newUser.email,
      name: newUser.name,
      createdAt: newUser.createdAt,
    };

    req.session.userId = newUser.id;

    res.status(201).send({ message: 'User registered', user: userResponse });
  } catch (error) {
    res.status(500).send({ error: 'Failed to register user' });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const parseResult = loginUserSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res
      .status(400)
      .send({ error: 'Invalid login data', details: parseResult.error.errors });
  }

  const { email, password } = parseResult.data;

  try {
    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).send({ error: 'Invalid email or password' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).send({ error: 'Invalid email or password' });
    }

    req.session.userId = user.id;

    res.status(200).send({ message: 'Login successful' });
  } catch (error) {
    res.status(500).send({ error: 'Failed to login user' });
  }
};

export const logoutUser = (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send({ error: 'Failed to logout user' });
    }
    res.status(200).send({ message: 'Logout successful' });
  });
};

export const getCurrentUser = async (req: Request, res: Response) => {
  const userId = req.session.userId;

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }

    res.status(200).send({ user });
  } catch (error) {
    res.status(500).send({ error: 'Failed to retrieve user' });
  }
};
