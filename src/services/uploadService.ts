import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { Request } from 'express';
import { existsSync, mkdirSync } from 'fs';

// 上传目录路径
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// 确保上传目录存在（同步方式）
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

// 文件过滤器：只允许 jpg 和 png
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传 JPG 或 PNG 格式的图片'));
  }
};

// 存储配置：使用时间戳重命名文件
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${timestamp}${ext}`;
    cb(null, filename);
  }
});

// 配置 Multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

export default upload;

