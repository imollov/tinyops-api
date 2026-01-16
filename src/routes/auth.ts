import { Router } from 'express';
import { registerUser, loginUser } from '../controllers/authController';

export const authRouter = Router();

authRouter.post('/register', registerUser);
authRouter.post('/login', loginUser);
