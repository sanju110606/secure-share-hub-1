import express from 'express';
import { register, login, adminLogin, refresh, getCurrentUser, logout } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { registerValidation, loginValidation } from '../utils/validators';

const router = express.Router();

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/admin/login', loginValidation, adminLogin);
router.post('/refresh', refresh);
router.get('/me', authenticate, getCurrentUser);
router.post('/logout', logout);

export default router;
