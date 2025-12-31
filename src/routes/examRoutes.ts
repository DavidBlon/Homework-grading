import { Router } from 'express';
import { getQuestions, createQuestion, getQuestionById, updateQuestion, deleteQuestion, handleSubmission, getQuestionSubmissions, getUserHistory } from '../controllers/examController';
import { requireAuth, requireRole } from '../middleware/auth';
import upload from '../services/uploadService';

const router = Router();

// GET /questions - 获取题目列表（需要教师权限）
router.get('/questions', requireAuth, requireRole(['teacher']), getQuestions);

// POST /questions - 创建新题目（需要教师权限）
router.post('/questions', requireAuth, requireRole(['teacher']), createQuestion);

// GET /questions/:id - 获取单个题目详情（所有登录用户可访问，学生搜索题目）
router.get('/questions/:id', requireAuth, getQuestionById);

// GET /questions/:id/submissions - 获取题目的所有答题记录（需要教师权限）
router.get('/questions/:id/submissions', requireAuth, requireRole(['teacher']), getQuestionSubmissions);

// PUT /questions/:id - 更新题目（需要教师权限）
router.put('/questions/:id', requireAuth, requireRole(['teacher']), updateQuestion);

// DELETE /questions/:id - 删除题目（需要教师权限）
router.delete('/questions/:id', requireAuth, requireRole(['teacher']), deleteQuestion);

// POST /submit - 提交作业（需要登录）
// 使用 multer 中间件处理文件上传，字段名为 'image'
router.post('/submit', requireAuth, upload.single('image'), handleSubmission);

// GET /history - 获取当前用户的批改历史记录
router.get('/history', requireAuth, getUserHistory);

export default router;

