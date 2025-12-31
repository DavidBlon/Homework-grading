import dotenv from 'dotenv';
import OpenAI from 'openai';
import { promises as fs } from 'fs';

// 加载环境变量（确保在模块加载时可用）
dotenv.config();

// 千问 VL OCR 配置
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY || '';
const DASHSCOPE_BASE_URL = process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
const DASHSCOPE_MODEL = process.env.DASHSCOPE_MODEL || 'qwen-vl-max';

// 调试日志：检查环境变量
console.log('[OCR Service] DASHSCOPE_API_KEY:', DASHSCOPE_API_KEY ? `${DASHSCOPE_API_KEY.substring(0, 10)}...` : '未配置');
console.log('[OCR Service] DASHSCOPE_BASE_URL:', DASHSCOPE_BASE_URL);
console.log('[OCR Service] DASHSCOPE_MODEL:', DASHSCOPE_MODEL);

// 初始化千问客户端
const client = new OpenAI({
  apiKey: DASHSCOPE_API_KEY,
  baseURL: DASHSCOPE_BASE_URL,
});

/**
 * 将图片文件转换为 Base64 数据 URL
 * @param imagePath 图片文件路径
 * @returns Base64 数据 URL（包含 data:image/jpeg;base64, 前缀）
 */
async function imageToDataURL(imagePath: string): Promise<string> {
  try {
    const imageBuffer = await fs.readFile(imagePath);
    const base64String = imageBuffer.toString('base64');
    // 假设图片为jpeg格式，如果需要支持多种格式，可以根据文件扩展名判断
    return `data:image/jpeg;base64,${base64String}`;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`读取图片文件失败: ${error.message}`);
    }
    throw error;
  }
}

/**
 * 识别图片中的文字（使用千问 VL 视觉大模型）
 * @param imagePath 图片文件路径
 * @returns 识别出的文字内容
 */
export async function recognizeText(imagePath: string): Promise<string> {
  try {
    // 验证配置
    if (!DASHSCOPE_API_KEY) {
      throw new Error('千问 OCR 配置不完整，请检查 .env 文件中的 DASHSCOPE_API_KEY');
    }

    // 1. 将图片转换为 Base64 数据 URL
    const imageDataURL = await imageToDataURL(imagePath);

    // 2. 调用千问 VL API
    const completion = await client.chat.completions.create({
      model: DASHSCOPE_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: imageDataURL }
            },
            {
              type: 'text',
              text: '请识别这张图片中的所有文字内容，包括手写字和印刷体。请直接输出识别结果，不要添加额外说明。保持原有的段落结构和换行。'
            }
          ]
        }
      ],
      temperature: 0.1, // 降低随机性，提高识别稳定性
    });

    // 3. 提取识别结果
    const text = completion.choices[0]?.message?.content;
    
    if (!text || text.trim() === '') {
      throw new Error('未识别到任何文字');
    }

    return text.trim();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`OCR 识别失败: ${error.message}`);
    }
    throw error;
  }
}
