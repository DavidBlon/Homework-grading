import { Request, Response } from 'express';
import prisma from '../utils/db';
import bcrypt from 'bcryptjs';

// 扩展 Request 类型以包含 session
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    username?: string;
    role?: string;
  }
}

/**
 * 用户注册
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { username, password, role } = req.body;

    // 验证必填字段
    if (!username || !password || !role) {
      res.status(400).json({
        success: false,
        data: null,
        message: '缺少必要参数：username, password, role'
      });
      return;
    }

    // 验证角色
    if (role !== 'student' && role !== 'teacher') {
      res.status(400).json({
        success: false,
        data: null,
        message: '角色必须是 "student" 或 "teacher"'
      });
      return;
    }

    // 验证用户名长度
    if (username.length < 3 || username.length > 20) {
      res.status(400).json({
        success: false,
        data: null,
        message: '用户名长度必须在 3-20 个字符之间'
      });
      return;
    }

    // 验证密码长度
    if (password.length < 6) {
      res.status(400).json({
        success: false,
        data: null,
        message: '密码长度至少为 6 个字符'
      });
      return;
    }

    // 检查用户名是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        data: null,
        message: '用户名已存在'
      });
      return;
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role
      },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      data: user,
      message: '注册成功'
    });
  } catch (error) {
    console.error('注册时发生错误:', error);
    
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    res.status(500).json({
      success: false,
      data: null,
      message: `注册失败: ${errorMessage}`
    });
  }
}

/**
 * 用户登录
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { username, password } = req.body;

    // 验证必填字段
    if (!username || !password) {
      res.status(400).json({
        success: false,
        data: null,
        message: '缺少必要参数：username, password'
      });
      return;
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        data: null,
        message: '用户名或密码错误'
      });
      return;
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        data: null,
        message: '用户名或密码错误'
      });
      return;
    }

    // 设置 session
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;

    console.log('✅ 登录成功，设置 session:', {
      sessionID: req.sessionID,
      userId: user.id,
      username: user.username,
      role: user.role
    });

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        role: user.role
      },
      message: '登录成功'
    });
  } catch (error) {
    console.error('登录时发生错误:', error);
    
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    res.status(500).json({
      success: false,
      data: null,
      message: `登录失败: ${errorMessage}`
    });
  }
}

/**
 * 用户登出
 */
export async function logout(req: Request, res: Response): Promise<void> {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({
        success: false,
        data: null,
        message: '登出失败'
      });
      return;
    }

    res.json({
      success: true,
      data: null,
      message: '登出成功'
    });
  });
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.session?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        data: null,
        message: '未登录'
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true
      }
    }) as any;

    if (!user) {
      res.status(404).json({
        success: false,
        data: null,
        message: '用户不存在'
      });
      return;
    }

    // 获取完整的用户信息（包括 isAdmin）
    const fullUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        role: user.role,
        isAdmin: (fullUser as any)?.isAdmin || false,
        createdAt: user.createdAt
      },
      message: '获取用户信息成功'
    });
  } catch (error) {
    console.error('获取用户信息时发生错误:', error);
    
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    res.status(500).json({
      success: false,
      data: null,
      message: `获取用户信息失败: ${errorMessage}`
    });
  }
}

