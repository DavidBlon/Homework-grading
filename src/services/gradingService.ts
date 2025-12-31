import dotenv from 'dotenv';
import OpenAI from 'openai';

// 加载环境变量（确保在模块加载时可用）
dotenv.config();

// LLM API 配置
const LLM_PROVIDER = process.env.LLM_PROVIDER || 'deepseek'; // 支持: deepseek, dashscope (千问), openai, moonshot 等
const LLM_API_KEY = process.env.LLM_API_KEY || '';
const LLM_BASE_URL = process.env.LLM_BASE_URL || 'https://api.deepseek.com';
const MODEL_NAME = process.env.LLM_MODEL_NAME || 'deepseek-chat';

// 初始化 OpenAI 客户端（兼容 OpenAI 协议，支持 DeepSeek、千问、Moonshot 等）
const openai = new OpenAI({
  apiKey: LLM_API_KEY,
  baseURL: LLM_BASE_URL,
});

/**
 * 评分结果接口
 */
export interface GradingResult {
  score: number;      // 得分
  feedback: string;   // 给学生看的简短评语
  reason: string;     // 给老师看的详细扣分点
}

/**
 * AI 评分服务
 * 基于题目、参考答案和评分标准，对学生的回答进行打分
 * 
 * @param question 题目内容
 * @param standard 标准答案或参考范文
 * @param rubric 评分标准描述
 * @param studentAnswer 学生的回答（OCR 识别结果）
 * @returns 评分结果
 */
export async function gradeAnswer(
  question: string,
  standard: string,
  rubric: string,
  studentAnswer: string
): Promise<GradingResult> {
  try {
    // 验证配置
    if (!LLM_API_KEY) {
      throw new Error('LLM API Key 未配置，请检查 .env 文件中的 LLM_API_KEY');
    }

    const systemPrompt = `你是一个严谨的阅卷老师。请基于给定的题目、参考答案和评分标准，对学生的回答进行打分。
学生的回答是由OCR识别的，可能存在错别字，请根据语义判断。
**必须**返回纯 JSON 格式，不要Markdown代码块：
{ "score": number, "feedback": "给学生的简短评语", "reason": "给老师看的详细扣分点" }`;

    const userPrompt = `题目：${question}

参考答案：${standard}

评分标准：${rubric}

学生回答：${studentAnswer}

请按照评分标准打分，并返回 JSON 格式的结果。`;
    const completion = await openai.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3, // 降低随机性，使评分更稳定
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('AI 返回内容为空');
    }

    // 解析 JSON 响应
    // 处理可能的 Markdown 代码块包裹
    let jsonString = content.trim();
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const result = JSON.parse(jsonString) as GradingResult;

    // 验证结果格式
    if (typeof result.score !== 'number' || 
        typeof result.feedback !== 'string' || 
        typeof result.reason !== 'string') {
      throw new Error('AI 返回的 JSON 格式不正确');
    }

    return result;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`解析 AI 返回的 JSON 失败: ${error.message}`);
    }
    if (error instanceof Error) {
      throw new Error(`AI 评分服务调用失败: ${error.message}`);
    }
    throw error;
  }
}

