# Homework Grading Backend

Node.js 后端项目，用于作业批改系统。

## 技术栈

- Node.js (v18+)
- Express
- TypeScript
- Prisma
- SQLite

## 安装

```bash
npm install
```

## 初始化数据库

```bash
npm run prisma:generate
npm run prisma:migrate
```

## 开发

```bash
npm run dev
```

## 构建

```bash
npm run build
npm start
```

## 项目结构

```
src/
├── app.ts              # Express 应用初始化
├── server.ts           # 服务器启动入口
├── controllers/        # 控制器层
├── routes/             # 路由层
├── services/           # 业务逻辑层
└── prisma/             # Prisma schema
```


