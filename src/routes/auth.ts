import { Router } from 'express';
import { registerUser } from '../controllers/authController';

export const authRouter = Router();

authRouter.post('/register', registerUser);
