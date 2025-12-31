import express, { Application } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import session from 'express-session';
import examRoutes from './routes/examRoutes';
import authRoutes from './routes/authRoutes';
import paymentRoutes from './routes/paymentRoutes';
import ocrRoutes from './routes/ocrRoutes';

const app: Application = express();

// 中间件配置
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session 配置
app.use(session({
  secret: process.env.SESSION_SECRET || 'homework-grading-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // 在生产环境中使用 HTTPS 时设置为 true
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 小时
  }
}));

// 静态资源目录：uploads 文件夹
const uploadsPath = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsPath));

// 根路由重定向到启动页（必须在 express.static 之前）
app.get('/', (req, res) => {
  res.redirect('/splash.html');
});

// 确保有这一行，让 'public' 文件夹对外开放
app.use(express.static('public'));

// 路由配置
app.use('/api/auth', authRoutes);
app.use('/api/exam', examRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/ocr', ocrRoutes);

// 健康检查路由
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: { status: 'ok' },
    message: 'Server is running'
  });
});

export default app;

