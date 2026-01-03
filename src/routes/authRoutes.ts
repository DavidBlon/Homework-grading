import { Router } from 'express';
import { register, login, logout, getCurrentUser } from '../controllers/authController';

const router = Router();

// POST /register - 用户注册
router.post('/register', register);

// POST /login - 用户登录
router.post('/login', login);

// POST /logout - 用户登出
router.post('/logout', logout);

// GET /me - 获取当前用户信息
router.get('/me', getCurrentUser);

export default router;




