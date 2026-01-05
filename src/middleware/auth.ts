import { Request, Response, NextFunction } from 'express';

// 扩展 Request 类型以包含 session
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    username?: string;
    role?: string;
  }
}

/**
 * 认证中间件：检查用户是否已登录
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const userId = req.session?.userId;

  console.log('🔑 requireAuth: session检查', {
    sessionID: req.sessionID,
    userId: userId,
    session: req.session
  });

  if (!userId) {
    console.error('❌ requireAuth: 未找到 userId，返回 401');
    res.status(401).json({
      success: false,
      data: null,
      message: '请先登录'
    });
    return;
  }

  // 将用户信息附加到 req 对象上
  (req as any).user = {
    id: userId,
    username: req.session.username,
    role: req.session.role
  };

  console.log('✅ requireAuth: 认证通过', { userId, username: req.session.username });
  next();
}

/**
 * 权限中间件：检查用户角色
 */
export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const role = req.session?.role;

    if (!role) {
      res.status(401).json({
        success: false,
        data: null,
        message: '请先登录'
      });
      return;
    }

    if (!allowedRoles.includes(role)) {
      res.status(403).json({
        success: false,
        data: null,
        message: '权限不足'
      });
      return;
    }

    next();
  };
}

