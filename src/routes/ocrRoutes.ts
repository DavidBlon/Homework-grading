import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { recognizeText } from '../services/ocrService';
import { requireAuth } from '../middleware/auth';

const router = Router();

// 配置 Multer 用于临时文件上传
const upload = multer({
  dest: 'uploads/temp/',
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只支持 JPG 和 PNG 格式的图片'));
    }
  }
});

/**
 * POST /api/ocr/recognize
 * OCR 图片识别接口
 */
router.post('/recognize', requireAuth, upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: '请上传图片文件'
      });
      return;
    }

    const imagePath = req.file.path;

    try {
      // 调用 OCR 服务识别文字
      const text = await recognizeText(imagePath);

      res.json({
        success: true,
        data: {
          text: text
        },
        message: '识别成功'
      });
    } finally {
      // 删除临时文件
      try {
        await fs.unlink(imagePath);
      } catch (error) {
        console.error('删除临时文件失败:', error);
      }
    }
  } catch (error) {
    console.error('OCR 识别错误:', error);
    
    const errorMessage = error instanceof Error ? error.message : '识别失败';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
});

export default router;
