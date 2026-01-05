import express from 'express';
import { requireAuth } from '../middleware/auth';
import {
  checkQuota,
  createRechargeOrder,
  paymentCallback,
  getTransactions,
  mockPaymentSuccess,
  approveRecharge,
  getPendingRecharges
} from '../controllers/paymentController';

const router = express.Router();

// 检查用户额度
router.get('/quota', requireAuth, checkQuota);

// 创建充值订单
router.post('/recharge', requireAuth, createRechargeOrder);

// 支付回调（支付平台调用）
router.post('/callback', paymentCallback);

// 获取交易记录
router.get('/transactions', requireAuth, getTransactions);

// 模拟支付成功（仅用于测试）
router.post('/mock-payment', requireAuth, mockPaymentSuccess);

// 管理员审核充值订单（仅教师）
router.post('/approve', requireAuth, approveRecharge);

// 获取待审核订单列表（仅教师）
router.get('/pending', requireAuth, getPendingRecharges);

export default router;
