import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始添加示例题目...');

  // 检查是否已有题目
  const existingQuestions = await prisma.question.count();
  if (existingQuestions > 0) {
    console.log(`数据库中已有 ${existingQuestions} 个题目，跳过添加`);
    return;
  }

  // 添加示例题目
  const question = await prisma.question.create({
    data: {
      content: '请解释什么是人工智能？人工智能有哪些主要应用领域？',
      standardAnswer: `人工智能（Artificial Intelligence，简称AI）是计算机科学的一个分支，旨在创建能够执行通常需要人类智能的任务的系统。

主要应用领域包括：
1. 自然语言处理：机器翻译、语音识别、文本分析
2. 计算机视觉：图像识别、人脸识别、自动驾驶
3. 机器学习：预测分析、推荐系统、数据挖掘
4.  robotics：工业机器人、服务机器人
5. 专家系统：医疗诊断、金融分析`,
      maxScore: 100,
      scoringRubric: `评分标准（总分100分）：
1. 人工智能定义准确完整（30分）
   - 基本定义正确（15分）
   - 能够说明核心特点（15分）

2. 主要应用领域列举（50分）
   - 列举3个以上应用领域（30分）
   - 每个领域有简要说明（20分）

3. 表达清晰、逻辑连贯（20分）
   - 语言表达准确（10分）
   - 结构清晰、逻辑连贯（10分）`,
      type: 'subjective'
    }
  });

  console.log('✅ 成功添加示例题目，ID:', question.id);
  console.log('题目内容:', question.content);
}

main()
  .catch((e) => {
    console.error('❌ 添加题目失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


