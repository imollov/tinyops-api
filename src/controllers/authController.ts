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
