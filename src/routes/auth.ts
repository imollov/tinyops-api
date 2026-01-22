import { Router } from 'express';
import { registerUser, loginUser, logoutUser, getCurrentUser } from '../controllers/authController';
import { requireAuth } from '../middleware/auth';

export const authRouter = Router();

authRouter.post('/register', registerUser);
authRouter.post('/login', loginUser);
authRouter.post('/logout', requireAuth, logoutUser);
authRouter.get('/me', requireAuth, getCurrentUser);
