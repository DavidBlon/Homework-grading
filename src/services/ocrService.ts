import dotenv from 'dotenv';
import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';

// 加载环境变量
dotenv.config();

// 百度 OCR 配置
const BAIDU_APP_ID = process.env.BAIDU_APP_ID || '';
const BAIDU_API_KEY = process.env.BAIDU_API_KEY || '';
const BAIDU_SECRET_KEY = process.env.BAIDU_SECRET_KEY || '';

// 百度 OCR 接口地址
const BAIDU_TOKEN_URL = 'https://aip.baidubce.com/oauth/2.0/token';
const BAIDU_OCR_URL = 'https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic';

// 调试日志
console.log('[OCR Service] 使用百度 OCR');
console.log('[OCR Service] BAIDU_APP_ID:', BAIDU_APP_ID ? `${BAIDU_APP_ID.substring(0, 5)}...` : '未配置');
console.log('[OCR Service] BAIDU_API_KEY:', BAIDU_API_KEY ? `${BAIDU_API_KEY.substring(0, 5)}...` : '未配置');

// Token 缓存（避免每次请求都重新获取）
let cachedToken: string | null = null;
let tokenExpireTime = 0;

/**
 * 获取百度 OCR 的 access_token
 * 百度 token 有效期约 30 天，这里做简单缓存
 */
async function getAccessToken(): Promise<string> {
  const now = Date.now();

  // 如果缓存未过期，直接返回
  if (cachedToken && now < tokenExpireTime) {
    return cachedToken;
  }

  try {
    const response = await axios.post(BAIDU_TOKEN_URL, null, {
      params: {
        grant_type: 'client_credentials',
        client_id: BAIDU_API_KEY,
        client_secret: BAIDU_SECRET_KEY,
      },
    });

    const data = response.data;
    if (!data.access_token) {
      throw new Error(`获取 token 失败: ${JSON.stringify(data)}`);
    }

    // 缓存 token，提前 1 小时过期以确保安全
    cachedToken = data.access_token as string;
    tokenExpireTime = now + (data.expires_in - 3600) * 1000;

    console.log('[OCR Service] 百度 access_token 获取成功');
    return cachedToken!;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`获取百度 access_token 失败: ${error.response?.data?.error_description || error.message}`);
    }
    throw error;
  }
}

/**
 * 将图片文件转换为 Base64 字符串
 * @param imagePath 图片文件路径
 * @returns Base64 编码的图片内容
 */
async function imageToBase64(imagePath: string): Promise<string> {
  try {
    const imageBuffer = await fs.readFile(imagePath);
    return imageBuffer.toString('base64');
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`读取图片文件失败: ${error.message}`);
    }
    throw error;
  }
}

/**
 * 识别图片中的文字（使用百度 OCR 精确识别）
 * @param imagePath 图片文件路径
 * @returns 识别出的文字内容
 */
export async function recognizeText(imagePath: string): Promise<string> {
  try {
    // 验证配置
    if (!BAIDU_API_KEY || !BAIDU_SECRET_KEY) {
      throw new Error('百度 OCR 配置不完整，请检查 .env 文件中的 BAIDU_API_KEY 和 BAIDU_SECRET_KEY');
    }

    // 1. 获取 access_token
    const accessToken = await getAccessToken();

    // 2. 将图片转换为 Base64
    const imageBase64 = await imageToBase64(imagePath);

    // 3. 调用百度 OCR API（精确识别）
    const response = await axios.post(`${BAIDU_OCR_URL}?access_token=${accessToken}`, {
      image: imageBase64,
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const data = response.data;

    if (data.error_code) {
      throw new Error(`百度 OCR 错误: ${data.error_msg} (code: ${data.error_code})`);
    }

    // 4. 提取识别结果
    const words = data.words_result || [];
    if (words.length === 0) {
      throw new Error('未识别到任何文字');
    }

    // 将所有文字按行拼接
    const text = words
      .map((item: { words: string }) => item.words)
      .join('\n');

    return text.trim();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`OCR 识别失败: ${error.message}`);
    }
    throw error;
  }
}
