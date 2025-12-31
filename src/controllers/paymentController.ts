import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 每次批改费用（元）
const PRICE_PER_USE = 0.01;

// 测试账户配置（拥有无限额度）
const TEST_ACCOUNTS = ['admin'];

// 检查是否为测试账户
function isTestAccount(username: string): boolean {
  return TEST_ACCOUNTS.includes(username);
}

// 检查用户额度
export async function checkQuota(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      console.error('❌ checkQuota: 用户未登录或 session 无效');
      res.status(401).json({ success: false, message: '请先登录' });
      return;
    }
    
    console.log(`🔍 checkQuota: 检查用户 ${userId} 的额度`);
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      console.error(`❌ checkQuota: 用户 ${userId} 不存在`);
      res.status(404).json({ success: false, message: '用户不存在' });
      return;
    }

    console.log(`👤 checkQuota: 找到用户 ${user.username}, role=${user.role}`);

    // 检查是否为测试账户
    if (isTestAccount(user.username)) {
      console.log(`🔑 checkQuota: 测试账户 ${user.username}`);
      res.json({
        success: true,
        data: {
          dailyQuota: 999999,
          quotaUsedToday: 0,
          remainingFreeQuota: 999999,
          balance: 999999,
          pricePerUse: PRICE_PER_USE,
          canUse: true,
          isTestAccount: true
        }
      });
      return;
    }

    // 检查是否需要重置每日额度
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastReset = new Date(user.lastResetDate);
    lastReset.setHours(0, 0, 0, 0);

    let quotaUsedToday = user.quotaUsedToday;
    
    if (today.getTime() > lastReset.getTime()) {
      // 新的一天，重置额度
      await prisma.user.update({
        where: { id: userId },
        data: {
          quotaUsedToday: 0,
          lastResetDate: new Date()
        }
      });
      quotaUsedToday = 0;
    }

    const remainingFreeQuota = Math.max(0, user.dailyQuota - quotaUsedToday);
    const canUse = remainingFreeQuota > 0 || user.balance >= PRICE_PER_USE;

    res.json({
      success: true,
      data: {
        dailyQuota: user.dailyQuota,
        quotaUsedToday,
        remainingFreeQuota,
        balance: user.balance,
        pricePerUse: PRICE_PER_USE,
        canUse
      }
    });
    } catch (error) {
    console.error('❌ checkQuota 错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

// 消费额度（在批改时调用）
export async function consumeQuota(userId: number): Promise<{ success: boolean; message?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return { success: false, message: '用户不存在' };
    }

    // 测试账户直接通过，不扣除额度
    if (isTestAccount(user.username)) {
      return { success: true };
    }

    // 检查是否需要重置每日额度
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastReset = new Date(user.lastResetDate);
    lastReset.setHours(0, 0, 0, 0);

    let quotaUsedToday = user.quotaUsedToday;
    
    if (today.getTime() > lastReset.getTime()) {
      // 新的一天，重置额度
      await prisma.user.update({
        where: { id: userId },
        data: {
          quotaUsedToday: 0,
          lastResetDate: new Date()
        }
      });
      quotaUsedToday = 0;
    }

    const remainingFreeQuota = Math.max(0, user.dailyQuota - quotaUsedToday);

    if (remainingFreeQuota > 0) {
      // 使用免费额度
      await prisma.user.update({
        where: { id: userId },
        data: {
          quotaUsedToday: quotaUsedToday + 1
        }
      });

      await prisma.transaction.create({
        data: {
          userId: userId,
          type: 'consume',
          amount: 0,
          description: '使用免费额度批改',
          status: 'completed'
        }
      });

      return { success: true };
    } else if (user.balance >= PRICE_PER_USE) {
      // 扣除余额
      await prisma.user.update({
        where: { id: userId },
        data: {
          balance: user.balance - PRICE_PER_USE
        }
      });

      await prisma.transaction.create({
        data: {
          userId: userId,
          type: 'consume',
          amount: PRICE_PER_USE,
          description: '付费批改答案',
          status: 'completed'
        }
      });

      return { success: true };
    } else {
      return { success: false, message: '额度不足，请充值' };
    }
  } catch (error) {
    console.error('消费额度错误:', error);
    return { success: false, message: '服务器错误' };
  }
}

// 创建充值订单
export async function createRechargeOrder(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.id;
    const { amount, paymentMethod } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({ success: false, message: '充值金额无效' });
      return;
    }

    if (!['alipay', 'wechat', 'unionpay'].includes(paymentMethod)) {
      res.status(400).json({ success: false, message: '不支持的支付方式' });
      return;
    }

    // 生成订单号
    const orderId = `ORDER${Date.now()}${userId}`;

    // 创建交易记录
    const transaction = await prisma.transaction.create({
      data: {
        userId: userId,
        type: 'recharge',
        amount: amount,
        description: `充值 ${amount} 元`,
        paymentMethod: paymentMethod,
        orderId: orderId,
        status: 'pending'
      }
    });

    // 这里应该调用实际的支付接口
    // 为了演示，我们返回一个模拟的支付链接
    const paymentUrl = generatePaymentUrl(orderId, amount, paymentMethod);

    res.json({
      success: true,
      data: {
        orderId,
        amount,
        paymentMethod,
        paymentUrl,
        transactionId: transaction.id
      }
    });
  } catch (error) {
    console.error('创建充值订单错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

// 模拟支付链接生成（实际应用需要对接真实支付接口）
function generatePaymentUrl(orderId: string, amount: number, method: string): string {
  // 这里应该调用真实的支付API
  // 支付宝: https://opendocs.alipay.com/
  // 微信支付: https://pay.weixin.qq.com/
  // 云闪付: https://open.unionpay.com/
  
  return `https://example.com/pay?order=${orderId}&amount=${amount}&method=${method}`;
}

// 支付回调（接收支付平台的通知）
export async function paymentCallback(req: Request, res: Response): Promise<void> {
  try {
    const { orderId, status } = req.body;

    // 实际应用中需要验证签名
    const transaction = await prisma.transaction.findFirst({
      where: { orderId: orderId }
    });

    if (!transaction) {
      res.status(404).json({ success: false, message: '订单不存在' });
      return;
    }

    if (status === 'success') {
      // 更新交易状态
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'completed' }
      });

      // 增加用户余额
      await prisma.user.update({
        where: { id: transaction.userId },
        data: {
          balance: {
            increment: transaction.amount
          }
        }
      });

      res.json({ success: true, message: '充值成功' });
    } else {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'failed' }
      });

      res.json({ success: false, message: '支付失败' });
    }
  } catch (error) {
    console.error('支付回调错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

// 获取交易记录
export async function getTransactions(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.id;

    const transactions = await prisma.transaction.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('获取交易记录错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

// 模拟支付成功（仅用于测试）
export async function mockPaymentSuccess(req: Request, res: Response): Promise<void> {
  try {
    const { orderId } = req.body;

    await paymentCallback(req, res);
  } catch (error) {
    console.error('模拟支付错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

// 管理员审核充值订单
export async function approveRecharge(req: Request, res: Response): Promise<void> {
  try {
    const { orderId, approve } = req.body;
    const adminId = (req as any).user?.id;

    if (!orderId || approve === undefined) {
      res.status(400).json({ success: false, message: '缺少必要参数' });
      return;
    }

    // 检查是否为管理员
    const admin = await prisma.user.findUnique({
      where: { id: adminId }
    });

    if (!admin || !(admin as any).isAdmin) {
      res.status(403).json({ success: false, message: '无权限操作，仅管理员可审核' });
      return;
    }

    // 查找订单
    const transaction = await prisma.transaction.findFirst({
      where: {
        orderId: orderId,
        type: 'recharge'
      },
      include: {
        user: true
      }
    });

    if (!transaction) {
      res.status(404).json({ success: false, message: '订单不存在' });
      return;
    }

    if (transaction.status !== 'pending') {
      res.status(400).json({ success: false, message: `订单已处理，当前状态：${transaction.status}` });
      return;
    }

    if (approve) {
      // 审核通过，余额到账
      await prisma.$transaction([
        // 更新订单状态
        prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: 'completed' }
        }),
        // 增加用户余额
        prisma.user.update({
          where: { id: transaction.userId },
          data: {
            balance: {
              increment: transaction.amount
            }
          }
        })
      ]);

      console.log(`✅ 订单 ${orderId} 审核通过，用户 ${transaction.user.username} 余额 +${transaction.amount}`);

      res.json({
        success: true,
        message: '审核通过，余额已到账'
      });
    } else {
      // 审核拒绝
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'failed' }
      });

      console.log(`❌ 订单 ${orderId} 审核拒绝`);

      res.json({
        success: true,
        message: '订单已拒绝'
      });
    }
  } catch (error) {
    console.error('审核订单错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

// 获取待审核订单列表（仅教师可访问）
export async function getPendingRecharges(req: Request, res: Response): Promise<void> {
  try {
    const adminId = (req as any).user?.id;

    // 检查是否为管理员
    const admin = await prisma.user.findUnique({
      where: { id: adminId }
    });

    if (!admin || !(admin as any).isAdmin) {
      res.status(403).json({ success: false, message: '无权限访问，仅管理员可查看' });
      return;
    }

    // 获取所有待审核订单
    const pendingOrders = await prisma.transaction.findMany({
      where: {
        type: 'recharge',
        status: 'pending'
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 计算今日已审核数量（包括通过和拒绝）
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayApproved = await prisma.transaction.count({
      where: {
        type: 'recharge',
        status: {
          in: ['completed', 'failed']
        },
        createdAt: {
          gte: today
        }
      }
    });

    // 计算已审核通过订单的总金额（仅 completed 状态）
    const completedOrders = await prisma.transaction.findMany({
      where: {
        type: 'recharge',
        status: 'completed'
      },
      select: {
        amount: true
      }
    });
    
    const totalApprovedAmount = completedOrders.reduce((sum, order) => sum + order.amount, 0);

    res.json({
      success: true,
      data: pendingOrders,
      stats: {
        todayApproved: todayApproved,
        totalApprovedAmount: totalApprovedAmount
      }
    });
  } catch (error) {
    console.error('获取待审核订单错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}
