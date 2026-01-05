import { Request, Response } from 'express';
import prisma from '../utils/db';
import { recognizeText } from '../services/ocrService';
import { gradeAnswer } from '../services/gradingService';

/**
 * 获取题目列表
 */
export async function getQuestions(req: Request, res: Response): Promise<void> {
  try {
    // 获取当前用户信息
    const userId = req.session?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        data: null,
        message: '请先登录'
      });
      return;
    }

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        data: null,
        message: '用户不存在'
      });
      return;
    }

    // 如果是普通老师，只显示自己创建的题目
    // 如果是admin，显示所有题目
    const questions = await prisma.question.findMany({
      where: user.isAdmin ? undefined : {
        createdById: userId
      },
      select: {
        id: true,
        content: true,
        maxScore: true,
        type: true,
        createdAt: true,
        createdBy: {
          select: {
            username: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: questions,
      message: '获取题目列表成功'
    });
  } catch (error) {
    console.error('获取题目列表时发生错误:', error);
    
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    res.status(500).json({
      success: false,
      data: null,
      message: `获取题目列表失败: ${errorMessage}`
    });
  }
}

/**
 * 创建新题目
 */
export async function createQuestion(req: Request, res: Response): Promise<void> {
  try {
    const { content, standardAnswer, maxScore, scoringRubric, type } = req.body;

    // 获取当前用户ID
    const userId = req.session?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        data: null,
        message: '请先登录'
      });
      return;
    }

    // 验证必填字段
    if (!content || !standardAnswer || !maxScore || !scoringRubric || !type) {
      res.status(400).json({
        success: false,
        data: null,
        message: '缺少必要参数：content, standardAnswer, maxScore, scoringRubric, type'
      });
      return;
    }

    // 验证类型
    if (type !== 'objective' && type !== 'subjective') {
      res.status(400).json({
        success: false,
        data: null,
        message: '题目类型必须是 "objective" 或 "subjective"'
      });
      return;
    }

    // 验证分数
    const score = parseInt(maxScore as string, 10);
    if (isNaN(score) || score <= 0) {
      res.status(400).json({
        success: false,
        data: null,
        message: '满分必须是大于0的数字'
      });
      return;
    }

    // 创建题目，记录创建者ID
    const question = await prisma.question.create({
      data: {
        content: content as string,
        standardAnswer: standardAnswer as string,
        maxScore: score,
        scoringRubric: scoringRubric as string,
        type: type as string,
        createdById: userId
      }
    });

    res.json({
      success: true,
      data: {
        id: question.id,
        content: question.content,
        maxScore: question.maxScore,
        type: question.type,
        createdAt: question.createdAt
      },
      message: '题目创建成功'
    });
  } catch (error) {
    console.error('创建题目时发生错误:', error);
    
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    res.status(500).json({
      success: false,
      data: null,
      message: `创建题目失败: ${errorMessage}`
    });
  }
}

/**
 * 获取单个题目详情
 */
export async function getQuestionById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const questionId = parseInt(id, 10);

    if (isNaN(questionId)) {
      res.status(400).json({
        success: false,
        data: null,
        message: '无效的题目ID'
      });
      return;
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId }
    });

    if (!question) {
      res.status(404).json({
        success: false,
        data: null,
        message: '题目不存在'
      });
      return;
    }

    res.json({
      success: true,
      data: question,
      message: '获取题目成功'
    });
  } catch (error) {
    console.error('获取题目详情时发生错误:', error);
    
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    res.status(500).json({
      success: false,
      data: null,
      message: `获取题目详情失败: ${errorMessage}`
    });
  }
}

/**
 * 更新题目
 */
export async function updateQuestion(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const questionId = parseInt(id, 10);

    if (isNaN(questionId)) {
      res.status(400).json({
        success: false,
        data: null,
        message: '无效的题目ID'
      });
      return;
    }

    const { content, standardAnswer, maxScore, scoringRubric, type } = req.body;

    // 获取当前用户ID
    const userId = req.session?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        data: null,
        message: '请先登录'
      });
      return;
    }

    // 验证必填字段
    if (!content || !standardAnswer || !maxScore || !scoringRubric || !type) {
      res.status(400).json({
        success: false,
        data: null,
        message: '缺少必要参数：content, standardAnswer, maxScore, scoringRubric, type'
      });
      return;
    }

    // 验证类型
    if (type !== 'objective' && type !== 'subjective') {
      res.status(400).json({
        success: false,
        data: null,
        message: '题目类型必须是 "objective" 或 "subjective"'
      });
      return;
    }

    // 验证分数
    const score = parseInt(maxScore as string, 10);
    if (isNaN(score) || score <= 0) {
      res.status(400).json({
        success: false,
        data: null,
        message: '满分必须是大于0的数字'
      });
      return;
    }

    // 检查题目是否存在
    const existingQuestion = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        createdBy: true
      }
    });

    if (!existingQuestion) {
      res.status(404).json({
        success: false,
        data: null,
        message: '题目不存在'
      });
      return;
    }

    // 检查权限：只有创建者和admin可以修改
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        data: null,
        message: '用户不存在'
      });
      return;
    }

    if (existingQuestion.createdById !== userId && !user.isAdmin) {
      res.status(403).json({
        success: false,
        data: null,
        message: '无权修改该题目'
      });
      return;
    }

    // 更新题目
    const question = await prisma.question.update({
      where: { id: questionId },
      data: {
        content: content as string,
        standardAnswer: standardAnswer as string,
        maxScore: score,
        scoringRubric: scoringRubric as string,
        type: type as string
      }
    });

    res.json({
      success: true,
      data: question,
      message: '题目更新成功'
    });
  } catch (error) {
    console.error('更新题目时发生错误:', error);
    
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    res.status(500).json({
      success: false,
      data: null,
      message: `更新题目失败: ${errorMessage}`
    });
  }
}

/**
 * 删除题目
 */
export async function deleteQuestion(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const questionId = parseInt(id, 10);

    if (isNaN(questionId)) {
      res.status(400).json({
        success: false,
        data: null,
        message: '无效的题目ID'
      });
      return;
    }

    // 获取当前用户ID
    const userId = req.session?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        data: null,
        message: '请先登录'
      });
      return;
    }

    // 检查题目是否存在
    const existingQuestion = await prisma.question.findUnique({
      where: { id: questionId }
    });

    if (!existingQuestion) {
      res.status(404).json({
        success: false,
        data: null,
        message: '题目不存在'
      });
      return;
    }

    // 检查权限：只有创建者和admin可以删除
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        data: null,
        message: '用户不存在'
      });
      return;
    }

    if (existingQuestion.createdById !== userId && !user.isAdmin) {
      res.status(403).json({
        success: false,
        data: null,
        message: '无权删除该题目'
      });
      return;
    }

    // 删除题目（由于设置了级联删除，相关的提交也会被删除）
    await prisma.question.delete({
      where: { id: questionId }
    });

    res.json({
      success: true,
      data: { id: questionId },
      message: '题目删除成功'
    });
  } catch (error) {
    console.error('删除题目时发生错误:', error);
    
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    res.status(500).json({
      success: false,
      data: null,
      message: `删除题目失败: ${errorMessage}`
    });
  }
}

/**
 * 处理学生提交的作业
 * 
 * @param req Express 请求对象（包含上传的文件和表单数据）
 * @param res Express 响应对象
 */
export async function handleSubmission(req: Request, res: Response): Promise<void> {
  try {
    // 0. 检查用户额度
    const userId = req.session?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        data: null,
        message: '请先登录'
      });
      return;
    }

    // 动态导入 consumeQuota 函数
    const { consumeQuota } = await import('./paymentController');
    const quotaResult = await consumeQuota(userId);
    
    if (!quotaResult.success) {
      res.status(403).json({
        success: false,
        data: null,
        message: quotaResult.message || '额度不足'
      });
      return;
    }

    // 1. 获取表单数据
    const { questionId, studentName, textAnswer } = req.body;

    if (!questionId || !studentName) {
      res.status(400).json({
        success: false,
        data: null,
        message: '缺少必要参数：questionId 和 studentName'
      });
      return;
    }

    // 检查是文字输入还是图片上传
    const isTextInput = textAnswer && typeof textAnswer === 'string' && textAnswer.trim();
    const isImageInput = req.file;

    if (!isTextInput && !isImageInput) {
      res.status(400).json({
        success: false,
        data: null,
        message: '请输入答案文字或上传图片'
      });
      return;
    }

    // 2. 通过 Prisma 获取 Question 详情
    const question = await prisma.question.findUnique({
      where: { id: parseInt(questionId as string, 10) }
    });

    if (!question) {
      res.status(404).json({
        success: false,
        data: null,
        message: '题目不存在'
      });
      return;
    }

    let ocrText = '';
    let imageRelativePath = '';

    // 3. 根据输入方式处理
    if (isTextInput) {
      // 文字输入模式
      ocrText = (textAnswer as string).trim();
    } else if (isImageInput) {
      // 图片上传模式
      const imageFullPath = req.file!.path;
      imageRelativePath = `uploads/${req.file!.filename}`;
      ocrText = await recognizeText(imageFullPath);
    }

    // 4. 调用评分服务进行 AI 评分
    const gradingResult = await gradeAnswer(
      question.content,
      question.standardAnswer,
      question.scoringRubric,
      ocrText
    );

    // 5. 将 Submission 和 GradingResult 保存到数据库
    const submission = await prisma.submission.create({
      data: {
        questionId: question.id,
        studentName: studentName as string,
        imagePath: imageRelativePath || '', // 文字输入时为空
        ocrText: ocrText,
        gradingResults: {
          create: {
            score: gradingResult.score,
            feedback: gradingResult.feedback,
            details: JSON.stringify({
              reason: gradingResult.reason,
              score: gradingResult.score
            })
          }
        }
      },
      include: {
        gradingResults: true
      }
    });

    // 6. 返回包含 OCR 文本、分数和评语的 JSON 响应
    res.json({
      success: true,
      data: {
        submissionId: submission.id,
        ocrText: ocrText,
        score: gradingResult.score,
        maxScore: question.maxScore,
        feedback: gradingResult.feedback,
        reason: gradingResult.reason,
        studentName: submission.studentName,
        createdAt: submission.createdAt,
        imageUrl: imageRelativePath ? `/${imageRelativePath}` : null // 文字输入时为null
      },
      message: '提交成功'
    });
  } catch (error) {
    console.error('处理提交时发生错误:', error);
    
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    res.status(500).json({
      success: false,
      data: null,
      message: `处理提交失败: ${errorMessage}`
    });
  }
}

/**
 * 获取题目的所有答题记录（教师查看学生答题情况）
 */
export async function getQuestionSubmissions(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const questionId = parseInt(id, 10);

    if (isNaN(questionId)) {
      res.status(400).json({
        success: false,
        data: null,
        message: '无效的题目ID'
      });
      return;
    }

    // 获取当前用户ID
    const userId = req.session?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        data: null,
        message: '请先登录'
      });
      return;
    }

    // 检查题目是否存在
    const question = await prisma.question.findUnique({
      where: { id: questionId }
    });

    if (!question) {
      res.status(404).json({
        success: false,
        data: null,
        message: '题目不存在'
      });
      return;
    }

    // 检查权限：只有创建者和admin可以查看答题记录
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        data: null,
        message: '用户不存在'
      });
      return;
    }

    if (question.createdById !== userId && !user.isAdmin) {
      res.status(403).json({
        success: false,
        data: null,
        message: '无权查看该题目的答题记录'
      });
      return;
    }

    // 获取所有答题记录
    const submissions = await prisma.submission.findMany({
      where: { questionId },
      include: {
        question: {
          select: {
            maxScore: true
          }
        },
        gradingResults: {
          select: {
            score: true,
            feedback: true
          },
          take: 1,
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 格式化数据
    const formattedSubmissions = submissions.map(sub => ({
      id: sub.id,
      studentName: sub.studentName,
      studentAnswer: sub.ocrText,
      imageUrl: `/${sub.imagePath}`,
      score: sub.gradingResults[0]?.score || 0,
      feedback: sub.gradingResults[0]?.feedback || '',
      createdAt: sub.createdAt,
      question: {
        maxScore: sub.question.maxScore
      }
    }));

    res.json({
      success: true,
      data: formattedSubmissions,
      message: '获取答题记录成功'
    });
  } catch (error) {
    console.error('获取答题记录时发生错误:', error);
    
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    res.status(500).json({
      success: false,
      data: null,
      message: `获取答题记录失败: ${errorMessage}`
    });
  }
}

/**
 * 获取当前用户的批改历史记录
 */
export async function getUserHistory(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        data: null,
        message: '请先登录'
      });
      return;
    }

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        data: null,
        message: '用户不存在'
      });
      return;
    }

    let submissions;

    if (user.role === 'teacher') {
      // 教师：查看自己创建的题目的所有提交记录
      submissions = await prisma.submission.findMany({
        where: {
          question: {
            createdById: userId
          }
        },
        include: {
          question: {
            select: {
              id: true,
              content: true,
              maxScore: true
            }
          },
          gradingResults: {
            select: {
              score: true,
              feedback: true
            },
            take: 1,
            orderBy: {
              createdAt: 'desc'
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 100
      });
    } else {
      // 学生：通过用户名查找该用户的批改记录
      submissions = await prisma.submission.findMany({
        where: { studentName: user.username },
        include: {
          question: {
            select: {
              id: true,
              content: true,
              maxScore: true
            }
          },
          gradingResults: {
            select: {
              score: true,
              feedback: true
            },
            take: 1,
            orderBy: {
              createdAt: 'desc'
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 50
      });
    }

    // 格式化数据
    const records = submissions.map(sub => ({
      id: sub.id,
      questionId: sub.question.id,
      questionTitle: sub.question.content.substring(0, 30) + (sub.question.content.length > 30 ? '...' : ''),
      studentName: sub.studentName,
      score: sub.gradingResults[0]?.score || 0,
      maxScore: sub.question.maxScore,
      feedback: sub.gradingResults[0]?.feedback || '',
      createdAt: sub.createdAt
    }));

    res.json({
      success: true,
      records: records,
      message: '获取批改记录成功'
    });
  } catch (error) {
    console.error('获取批改记录时发生错误:', error);
    
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    res.status(500).json({
      success: false,
      data: null,
      message: `获取批改记录失败: ${errorMessage}`
    });
  }
}
