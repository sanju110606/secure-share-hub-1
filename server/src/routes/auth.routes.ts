import express from 'express';
import { register, login, adminLogin, refresh, getCurrentUser, logout } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';
import { registerValidation, loginValidation } from '../utils/validators';

const router = express.Router();

// Apply rate limiting to authentication endpoints
router.post('/register', authRateLimiter, registerValidation, register);
router.post('/login', authRateLimiter, loginValidation, login);
router.post('/admin/login', authRateLimiter, loginValidation, adminLogin);
router.post('/refresh', refresh);
router.get('/me', authenticate, getCurrentUser);
router.post('/logout', logout);

export default router;
