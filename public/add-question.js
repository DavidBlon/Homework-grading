// API 基础 URL
const API_BASE = '/api/exam';
const OCR_API_BASE = '/api/ocr';
// AUTH_API_BASE 已在 header-utils.js 中声明

// DOM 元素
const addQuestionForm = document.getElementById('addQuestionForm');
const addQuestionBtn = document.getElementById('addQuestionBtn');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');

// 输入方式切换
const tabBtns = document.querySelectorAll('.tab-btn');
const textInputArea = document.getElementById('textInputArea');
const imageInputArea = document.getElementById('imageInputArea');
const questionContent = document.getElementById('questionContent');
const questionImage = document.getElementById('questionImage');
const fileUploadArea = document.getElementById('fileUploadArea');
const imagePreviewArea = document.getElementById('imagePreviewArea');
const ocrStatus = document.getElementById('ocrStatus');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const ocrResultArea = document.getElementById('ocrResultArea');
const recognizedText = document.getElementById('recognizedText');

let currentInputMethod = 'text'; // 'text' 或 'image'
let uploadedImageFile = null;

// 检查登录状态和权限
async function checkAuth() {
    try {
        const response = await fetch(`${AUTH_API_BASE}/me`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data.role === 'teacher') {
                // 已登录且是教师，继续
                return;
            } else {
                // 不是教师，跳转到首页
                if (window.showError) {
                    window.showError('您没有权限访问此页面');
                }
                window.location.href = 'index.html';
            }
        } else {
            // 未登录，跳转到登录页面
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('检查登录状态错误:', error);
        window.location.href = 'login.html';
    }
}

// 标签页切换
tabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        // 更新按钮状态
        tabBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        // 切换输入区域
        currentInputMethod = this.dataset.method;
        if (currentInputMethod === 'text') {
            textInputArea.style.display = 'block';
            imageInputArea.style.display = 'none';
            questionContent.required = true;
        } else {
            textInputArea.style.display = 'none';
            imageInputArea.style.display = 'block';
            questionContent.required = false;
        }
    });
});

// 图片上传和预览
questionImage.addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
        showErrorMsg('请上传图片文件！');
        questionImage.value = '';
        return;
    }
    
    uploadedImageFile = file;
    
    // 隐藏上传区域，显示加载状态
    fileUploadArea.style.display = 'none';
    ocrStatus.style.display = 'block';
    
    // 读取图片并调用OCR
    const reader = new FileReader();
    reader.onload = async function(e) {
        const imageData = e.target.result;
        
        // 调用OCR识别
        await performOCR(file, imageData);
    };
    reader.readAsDataURL(file);
});

// 删除图片函数
window.removeQuestionImage = function() {
    // 清空文件输入
    questionImage.value = '';
    uploadedImageFile = null;
    
    // 清空预览和结果
    imagePreviewArea.innerHTML = '';
    ocrResultArea.style.display = 'none';
    recognizedText.value = '';
    
    // 显示上传区域
    fileUploadArea.style.display = 'block';
};

// 监听识别文本框的输入变化
recognizedText.addEventListener('input', function() {
    // 如果文本框内容为空，恢复上传区域
    if (!this.value.trim()) {
        imagePreviewArea.innerHTML = '';
        ocrResultArea.style.display = 'none';
        fileUploadArea.style.display = 'block';
        questionImage.value = '';
        uploadedImageFile = null;
    }
});

// 执行OCR识别
async function performOCR(file, imageData) {
    // 显示进度条
    progressBar.style.width = '0%';
    progressText.textContent = '⚙️ 正在上传图片...';
    
    // 模拟进度
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 90) progress = 90;
        progressBar.style.width = progress + '%';
        
        if (progress < 30) {
            progressText.textContent = '⚙️ 正在上传图片...';
        } else if (progress < 60) {
            progressText.textContent = '🔍 正在分析图片...';
        } else {
            progressText.textContent = '🤖 AI识别中，请稍候...';
        }
    }, 300);
    
    try {
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await fetch(`${OCR_API_BASE}/recognize`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        
        // 清除进度条定时器
        clearInterval(progressInterval);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '识别失败');
        }
        
        const result = await response.json();
        
        // 完成进度
        progressBar.style.width = '100%';
        progressText.textContent = '✅ 识别完成！';
        
        // 等待一下让用户看到完成状态
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 隐藏进度条
        ocrStatus.style.display = 'none';
        
        if (result.success && result.data.text) {
            // 显示图片预览和OCR结果区域
            imagePreviewArea.innerHTML = `
                <div class="image-preview-container">
                    <img src="${imageData}" alt="预览图片" class="preview-image">
                    <button type="button" class="remove-image-btn" onclick="removeQuestionImage()" title="删除图片">
                        ✕
                    </button>
                </div>
            `;
            
            // 填充识别结果
            recognizedText.value = result.data.text;
            
            // 显示结果区域
            ocrResultArea.style.display = 'block';
            
            showSuccessMsg('✅ 图片识别成功！您可以编辑修改识别结果');
        } else {
            // OCR失败，恢复上传区域
            fileUploadArea.style.display = 'block';
            showErrorMsg(result.message || '识别失败，请重试');
        }
    } catch (error) {
        console.error('OCR错误:', error);
        clearInterval(progressInterval);
        ocrStatus.style.display = 'none';
        fileUploadArea.style.display = 'block';
        showErrorMsg('识别失败：' + error.message);
    }
}

// 显示错误消息 - 使用全局Toast
function showErrorMsg(message) {
    if (typeof window.showError === 'function') {
        window.showError(message);
    } else {
        console.error(message);
    }
}

// 显示成功消息 - 使用全局Toast
function showSuccessMsg(message) {
    if (typeof window.showSuccess === 'function') {
        window.showSuccess(message);
    } else {
        console.log(message);
    }
}

// 隐藏消息（Toast自动消失）
function hideError() {
    // Toast自动消失
}

function hideSuccess() {
    // Toast自动消失
}

// 添加题目表单提交
addQuestionForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    hideError();
    hideSuccess();

    let questionContentText = '';
    
    // 根据输入方式获取题目内容
    if (currentInputMethod === 'text') {
        questionContentText = questionContent.value.trim();
        if (!questionContentText) {
            showErrorMsg('请输入题目内容');
            return;
        }
    } else {
        // 图片输入模式
        questionContentText = recognizedText.value.trim();
        if (!questionContentText) {
            showErrorMsg('请上传图片并等待识别完成');
            return;
        }
    }

    const questionType = document.getElementById('questionType').value;
    const questionMaxScore = document.getElementById('questionMaxScore').value;
    const standardAnswer = document.getElementById('standardAnswer').value.trim();
    const scoringRubric = document.getElementById('scoringRubric').value.trim();

    // 验证
    if (!questionType || !questionMaxScore || !standardAnswer || !scoringRubric) {
        showErrorMsg('请填写所有必填项');
        return;
    }

    const maxScore = parseInt(questionMaxScore, 10);
    if (isNaN(maxScore) || maxScore <= 0) {
        showErrorMsg('满分必须是大于0的数字');
        return;
    }

    // 显示加载状态
    addQuestionBtn.disabled = true;
    const btnText = addQuestionBtn.querySelector('.btn-text');
    const btnLoader = addQuestionBtn.querySelector('.btn-loader');
    btnText.textContent = '正在添加...';
    btnLoader.style.display = 'inline-block';

    try {
        console.log('开始提交题目...', { questionContentText, questionType, maxScore });
        
        const response = await fetch(`${API_BASE}/questions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                content: questionContentText,
                type: questionType,
                maxScore: maxScore,
                standardAnswer: standardAnswer,
                scoringRubric: scoringRubric
            })
        });

        console.log('响应状态:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('错误响应:', errorText);
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch {
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            showErrorMsg(errorData.message || '添加题目失败，请重试');
            return;
        }

        const result = await response.json();
        console.log('响应结果:', result);

        if (result.success && result.data) {
            // 清空表单
            addQuestionForm.reset();
            
            // 清空图片相关
            if (currentInputMethod === 'image') {
                uploadedImageFile = null;
                imagePreviewArea.innerHTML = '';
                ocrResultArea.style.display = 'none';
                recognizedText.value = '';
                fileUploadArea.style.display = 'block';
            }
            
            // 显示成功消息，包含题目ID
            showSuccessMsg('✅ 题目添加成功！题目ID: ' + result.data.id);
            
            // 保持当前位置，不滚动
        } else {
            console.error('添加失败:', result);
            showErrorMsg(result.message || '添加题目失败，请重试');
        }
    } catch (error) {
        console.error('添加题目错误:', error);
        showErrorMsg('网络错误，请检查连接后重试: ' + (error.message || '未知错误'));
    } finally {
        // 恢复按钮状态
        addQuestionBtn.disabled = false;
        btnText.textContent = '添加题目';
        btnLoader.style.display = 'none';
    }
});

// 页面加载时检查登录状态
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
});

