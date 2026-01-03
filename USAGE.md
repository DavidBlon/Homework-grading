# 使用说明

## 快速开始

### 1. 启动服务器

服务器已经在运行，访问地址：
- **前端界面**：http://localhost:3000/
- **健康检查**：http://localhost:3000/health

### 2. 添加题目到数据库

在使用前端提交作业之前，需要先在数据库中创建题目。你可以使用以下方法：

#### 方法一：使用 Prisma Studio（推荐）

在终端运行：
```bash
npm run prisma:studio
```

这会打开一个可视化界面（通常在 http://localhost:5555），你可以在其中：
1. 点击 "Question" 模型
2. 点击 "Add record" 按钮
3. 填写题目信息：
   - `content`: 题目文本（例如："请解释什么是人工智能"）
   - `standardAnswer`: 标准答案或参考范文
   - `maxScore`: 满分（例如：100）
   - `scoringRubric`: 评分标准描述（例如："要点1占30分，要点2占40分，表达占30分"）
   - `type`: 题目类型（填写 "objective" 或 "subjective"）
4. 点击 "Save" 保存

#### 方法二：使用 SQL 直接插入

使用 SQLite 工具或 Prisma Studio 的 SQL 编辑器执行：

```sql
INSERT INTO Question (content, standardAnswer, maxScore, scoringRubric, type, createdAt, updatedAt)
VALUES (
  '请解释什么是人工智能？',
  '人工智能（AI）是计算机科学的一个分支，旨在创建能够执行通常需要人类智能的任务的系统。',
  100,
  '定义准确占40分，举例说明占30分，逻辑清晰占30分',
  'subjective',
  datetime('now'),
  datetime('now')
);
```

### 3. 使用前端界面提交作业

1. **打开浏览器**，访问 http://localhost:3000/

2. **选择题目**：从下拉菜单中选择要批改的题目

3. **输入学生姓名**：在"学生姓名"输入框中填写

4. **上传作业图片**：
   - 点击上传区域或拖拽图片文件
   - 支持 JPG、PNG 格式
   - 文件大小不超过 5MB
   - 可以预览上传的图片

5. **提交批改**：
   - 点击"提交批改"按钮
   - 系统会自动进行 OCR 识别和 AI 评分
   - 等待处理完成（可能需要几秒钟）

6. **查看结果**：
   - OCR 识别结果：系统识别出的文字内容
   - 分数：AI 给出的分数和满分
   - AI 评语：给学生的简短评语
   - 详细评分说明：给老师的详细扣分点
   - 上传的作业图片

7. **重新提交**：如果需要批改另一份作业，点击"重新提交"按钮

## API 接口使用

### 获取题目列表

```bash
GET http://localhost:3000/api/exam/questions
```

响应示例：
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "content": "题目内容",
      "maxScore": 100,
      "type": "subjective",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "message": "获取题目列表成功"
}
```

### 提交作业

```bash
POST http://localhost:3000/api/exam/submit
Content-Type: multipart/form-data

Form Data:
- questionId: 1
- studentName: "张三"
- image: [图片文件]
```

响应示例：
```json
{
  "success": true,
  "data": {
    "submissionId": 1,
    "ocrText": "识别出的文字",
    "score": 85,
    "maxScore": 100,
    "feedback": "回答得不错，但还需要补充...",
    "reason": "要点1完整，要点2部分缺失，表达清晰",
    "studentName": "张三",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "imageUrl": "/uploads/1234567890.jpg"
  },
  "message": "提交成功"
}
```

## 环境配置

确保 `.env` 文件中已配置以下内容：

```env
# 数据库配置
DATABASE_URL="file:./dev.db"

# 百度 OCR 配置
BAIDU_APP_ID="your_app_id"
BAIDU_API_KEY="your_api_key"
BAIDU_SECRET_KEY="your_secret_key"

# LLM 配置（DeepSeek）
LLM_API_KEY="your_api_key"
LLM_BASE_URL="https://api.deepseek.com"
LLM_MODEL_NAME="deepseek-chat"

# 服务器端口
PORT=3000
```

## 常见问题

### 1. 前端页面显示"暂无题目"

**解决方法**：使用 Prisma Studio 或 SQL 添加题目到数据库。

### 2. OCR 识别失败

**可能原因**：
- 图片质量太差
- 图片格式不支持
- 百度 OCR API 配置错误或额度不足

**解决方法**：
- 确保图片清晰
- 检查 `.env` 中的百度 OCR 配置
- 查看服务器日志中的错误信息

### 3. AI 评分失败

**可能原因**：
- LLM API 配置错误
- API Key 无效或额度不足
- 网络连接问题

**解决方法**：
- 检查 `.env` 中的 LLM 配置
- 确认 API Key 有效
- 查看服务器日志

### 4. 图片上传失败

**可能原因**：
- 文件大小超过 5MB
- 文件格式不支持（只支持 JPG、PNG）
- `uploads` 目录权限问题

**解决方法**：
- 压缩图片大小
- 转换为支持的格式
- 检查 `uploads` 目录是否存在且有写权限

## 目录结构

```
homework-grading/
├── public/              # 前端静态文件
│   ├── index.html      # 主页面
│   ├── styles.css      # 样式文件
│   └── app.js          # 前端逻辑
├── src/                # 后端源代码
│   ├── controllers/    # 控制器
│   ├── routes/         # 路由
│   ├── services/       # 服务层
│   └── utils/          # 工具函数
├── uploads/            # 上传的图片存储目录
├── prisma/             # Prisma 配置
│   └── schema.prisma   # 数据库模型定义
└── .env                # 环境变量配置
```

## 下一步

- 添加更多题目到数据库
- 查看历史提交记录（可以通过 Prisma Studio 查看数据库）
- 根据需要调整评分标准和 Prompt



