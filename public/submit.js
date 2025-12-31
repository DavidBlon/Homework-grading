// API 基础 URL
const API_BASE = '/api/exam';
const PAYMENT_API_BASE = '/api/payment';
// AUTH_API_BASE 已在 header-utils.js 中声明

// DOM 元素
const questionIdInput = document.getElementById('questionIdInput');
const searchQuestionBtn = document.getElementById('searchQuestionBtn');
const questionInfoCard = document.getElementById('questionInfoCard');
const submitForm = document.getElementById('submitForm');
const questionIdHidden = document.getElementById('questionId');
const submitBtn = document.getElementById('submitBtn');
const resultSection = document.getElementById('resultSection');
const resultContent = document.getElementById('resultContent');
const errorMessage = document.getElementById('errorMessage');
const resetBtn = document.getElementById('resetBtn');
const imageInput = document.getElementById('image');
const imagePreview = document.getElementById('imagePreview');
const submitProgress = document.getElementById('submitProgress');
const submitProgressBar = document.getElementById('submitProgressBar');
const submitProgressText = document.getElementById('submitProgressText');

// 答案输入方式元素
const textAnswerTab = document.getElementById('textAnswerTab');
const imageAnswerTab = document.getElementById('imageAnswerTab');
const textAnswerArea = document.getElementById('textAnswerArea');
const imageAnswerArea = document.getElementById('imageAnswerArea');
const textAnswer = document.getElementById('textAnswer');

let currentQuestion = null; // 当前选中的题目
let answerInputMethod = 'image'; // 当前答案输入方式

// 检查登录状态
async function checkAuth() {
    try {
        const response = await fetch(`${AUTH_API_BASE}/me`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                // 已登录，继续
                return;
            } else {
                // 未登录，跳转到登录页面
                window.location.href = 'login.html';
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

// 搜索题目函数
async function searchQuestion() {
    const questionId = questionIdInput.value.trim();
    
    if (!questionId) {
        showError('请输入题目ID');
        return;
    }
    
    try {
        searchQuestionBtn.disabled = true;
        searchQuestionBtn.textContent = '🔍 搜索中...';
        
        const response = await fetch(`${API_BASE}/questions/${questionId}`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                showError('题目不存在，请检查ID是否正确');
                questionInfoCard.style.display = 'none';
                submitForm.style.display = 'none';
                return;
            }
            if (response.status === 401) {
                showError('请先登录');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
                return;
            }
            throw new Error('搜索失败');
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
            currentQuestion = result.data;
            displayQuestionInfo(result.data);
            
            // 显示提交表单
            questionIdHidden.value = result.data.id;
            submitForm.style.display = 'block';
            hideError();
            
            // 滚动到表单
            setTimeout(() => {
                submitForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 300);
        } else {
            showError(result.message || '搜索失败');
            questionInfoCard.style.display = 'none';
            submitForm.style.display = 'none';
        }
    } catch (error) {
        console.error('搜索错误:', error);
        showError('搜索失败：' + error.message);
        questionInfoCard.style.display = 'none';
        submitForm.style.display = 'none';
    } finally {
        searchQuestionBtn.disabled = false;
        searchQuestionBtn.textContent = '🔎 搜索题目';
    }
}

// 显示题目信息
function displayQuestionInfo(question) {
    document.getElementById('displayQuestionId').textContent = question.id;
    document.getElementById('displayQuestionContent').textContent = question.content;
    document.getElementById('displayMaxScore').textContent = question.maxScore;
    
    const typeBadge = document.getElementById('displayQuestionType');
    if (question.type === 'objective') {
        typeBadge.textContent = '✅ 客观题';
        typeBadge.style.background = '#10b981';
    } else {
        typeBadge.textContent = '📝 主观题';
        typeBadge.style.background = '#f59e0b';
    }
    
    questionInfoCard.style.display = 'block';
}

// 显示错误消息
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

// 隐藏错误消息
function hideError() {
    errorMessage.style.display = 'none';
}

// 搜索按钮点击事件
searchQuestionBtn.addEventListener('click', searchQuestion);

// 回车键搜索
questionIdInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        searchQuestion();
    }
});

// 图片预览
imageInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        // 验证文件类型
        if (!file.type.match('image/jpeg') && !file.type.match('image/png') && !file.type.match('image/jpg')) {
            showError('请上传 JPG 或 PNG 格式的图片');
            imageInput.value = '';
            return;
        }
        
        // 验证文件大小
        if (file.size > 5 * 1024 * 1024) {
            showError('图片大小不能超过 5MB');
            imageInput.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            // 隐藏上传区域，显示预览图片
            const fileUpload = document.querySelector('.file-upload');
            fileUpload.style.display = 'none';
            
            imagePreview.innerHTML = `
                <div class="image-preview-container">
                    <img src="${e.target.result}" alt="预览图片" class="preview-image">
                    <button type="button" class="remove-image-btn" onclick="removeImage()" title="删除图片">
                        ✕
                    </button>
                </div>
            `;
            imagePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

// 删除图片函数
window.removeImage = function() {
    // 清空文件输入
    imageInput.value = '';
    
    // 清空预览
    imagePreview.innerHTML = '';
    imagePreview.style.display = 'none';
    
    // 显示上传区域
    const fileUpload = document.querySelector('.file-upload');
    fileUpload.style.display = 'block';
};

// 表单提交
submitForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    hideError();

    const questionId = document.getElementById('questionId').value;
    const studentName = document.getElementById('studentName').value;
    
    // 验证
    if (!questionId) {
        showError('请选择题目');
        return;
    }

    if (!studentName.trim()) {
        showError('请输入学生姓名');
        return;
    }

    // 根据输入方式验证并创建FormData
    const formData = new FormData();
    formData.append('questionId', questionId);
    formData.append('studentName', studentName);
    
    if (answerInputMethod === 'image') {
        const imageFile = imageInput.files[0];
        if (!imageFile) {
            showError('请选择图片文件');
            return;
        }
        // 检查文件大小（5MB）
        if (imageFile.size > 5 * 1024 * 1024) {
            showError('图片大小不能超过 5MB');
            return;
        }
        formData.append('image', imageFile);
    } else {
        const textAnswerValue = textAnswer.value.trim();
        if (!textAnswerValue) {
            showError('请输入答案内容');
            return;
        }
        formData.append('textAnswer', textAnswerValue);
    }

    // 隐藏按钮，显示进度条
    submitBtn.style.display = 'none';
    
    // 显示进度条
    submitProgress.style.display = 'block';
    submitProgressBar.style.width = '0%';
    submitProgressText.textContent = '⚙️ 正在上传图片...';
    
    // 模拟进度
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress > 90) progress = 90;
        submitProgressBar.style.width = progress + '%';
        
        if (progress < 20) {
            submitProgressText.textContent = '⚙️ 正在上传图片...';
        } else if (progress < 40) {
            submitProgressText.textContent = '🔍 正在进行OCR 识别...';
        } else if (progress < 70) {
            submitProgressText.textContent = '🤖 AI 正在批改作业...';
        } else {
            submitProgressText.textContent = '✨ 正在生成评语...';
        }
    }, 400);

    try {
        const response = await fetch(`${API_BASE}/submit`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });

        const result = await response.json();

        // 清除进度条定时器
        clearInterval(progressInterval);
        submitProgressBar.style.width = '100%';
        submitProgressText.textContent = '✅ 批改完成！';
        
        // 等待一下显示完成状态
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 隐藏进度条
        submitProgress.style.display = 'none';

        if (result.success) {
            displayResult(result.data);
            submitForm.style.display = 'none';
            resultSection.style.display = 'block';
        } else {
            showError(result.message || '提交失败，请重试');
        }
    } catch (error) {
        console.error('提交错误:', error);
        clearInterval(progressInterval);
        submitProgress.style.display = 'none';
        submitBtn.style.display = 'block';
        showError('网络错误，请检查连接后重试');
    }
});

// 显示结果
function displayResult(data) {
    const scorePercentage = ((data.score / data.maxScore) * 100).toFixed(1);
    let scoreColor = 'var(--error-color)';
    if (scorePercentage >= 80) {
        scoreColor = 'var(--success-color)';
    } else if (scorePercentage >= 60) {
        scoreColor = 'var(--warning-color)';
    }

    resultContent.innerHTML = `
        <div class="result-item">
            <h3>学生信息</h3>
            <p><strong>姓名：</strong>${escapeHtml(data.studentName)}</p>
            <p><strong>提交时间：</strong>${new Date(data.createdAt).toLocaleString('zh-CN')}</p>
        </div>

        <div class="result-item">
            <h3>分数</h3>
            <div class="score-display" style="color: ${scoreColor};">
                <span>${data.score}</span>
                <span class="max-score">/ ${data.maxScore}</span>
                <span style="font-size: 1rem; margin-left: 0.5rem;">(${scorePercentage}%)</span>
            </div>
        </div>

        ${data.imageUrl ? `
        <div class="result-item">
            <h3>上传的作业图片</h3>
            <img src="${data.imageUrl}" alt="作业图片" class="result-image">
        </div>
        ` : ''}

        <div class="result-item ocr-box">
            <h3>OCR 识别结果</h3>
            <pre>${escapeHtml(data.ocrText)}</pre>
        </div>

        <div class="result-item feedback-box">
            <h3>AI 评语（给学生）</h3>
            <p>${escapeHtml(data.feedback)}</p>
        </div>

        <div class="result-item reason-box">
            <h3>详细评分说明（给老师）</h3>
            <p>${escapeHtml(data.reason)}</p>
        </div>
    `;

    // 滚动到结果区域
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 重置表单
resetBtn.addEventListener('click', function() {
    submitForm.reset();
    submitForm.style.display = 'block';
    resultSection.style.display = 'none';
    
    // 显示提交按钮，隐藏进度条
    submitBtn.style.display = 'block';
    submitProgress.style.display = 'none';
    
    // 重置图片上传区域
    imageInput.value = '';
    imagePreview.innerHTML = '';
    imagePreview.style.display = 'none';
    const fileUpload = document.querySelector('.file-upload');
    if (fileUpload) {
        fileUpload.style.display = 'block';
    }
    
    hideError();
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// HTML 转义函数
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await checkAuth();
        await loadQuota();
        // 不再自动加载题目列表，由学生搜索
        
        // 初始化答案输入方式切换
        if (textAnswerTab && imageAnswerTab) {
            textAnswerTab.addEventListener('click', function() {
                answerInputMethod = 'text';
                textAnswerTab.classList.add('active');
                imageAnswerTab.classList.remove('active');
                textAnswerArea.style.display = 'block';
                imageAnswerArea.style.display = 'none';
                // 清空图片
                imageInput.value = '';
                imagePreview.innerHTML = '';
            });
            
            imageAnswerTab.addEventListener('click', function() {
                answerInputMethod = 'image';
                imageAnswerTab.classList.add('active');
                textAnswerTab.classList.remove('active');
                imageAnswerArea.style.display = 'block';
                textAnswerArea.style.display = 'none';
                // 清空文字
                textAnswer.value = '';
            });
        }
    } catch (error) {
        console.error('初始化错误:', error);
    }
});

// 加载用户额度
async function loadQuota() {
    console.log('🔍 开始加载用户额度...');
    try {
        const response = await fetch(`${PAYMENT_API_BASE}/quota`, {
            credentials: 'include'
        });

        console.log('📡 API 响应状态:', response.status);

        if (response.ok) {
            const result = await response.json();
            console.log('📦 API 返回数据:', result);
            
            if (result.success) {
                const data = result.data;
                const quotaBanner = document.getElementById('quotaBanner');
                const freeQuota = document.getElementById('freeQuota');
                const balance = document.getElementById('balance');

                console.log('🎯 获取到的元素:', { quotaBanner, freeQuota, balance });

                // 检查是否为测试账户
                if (data.isTestAccount) {
                    console.log('🔑 测试账户模式');
                    freeQuota.textContent = '∞ 无限次数 (测试账户)';
                    balance.textContent = '∞ 无限额度';
                    quotaBanner.style.background = 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)';
                    quotaBanner.style.borderColor = '#f59e0b';
                } else {
                    console.log('👤 普通账户模式');
                    freeQuota.textContent = `${data.remainingFreeQuota} / ${data.dailyQuota} 次`;
                    balance.textContent = `¥${data.balance.toFixed(2)}`;
                }

                // 显示额度框
                quotaBanner.style.display = 'flex';
                console.log('✅ 额度框已显示');

                // 启动倒计时
                startCountdown();

                // 如果额度不足，显示警告
                if (!data.canUse) {
                    showError(`额度不足！今日免费额度已用完，余额不足 ${data.pricePerUse} 元/次，请充值后使用`);
                }
            } else {
                console.error('❌ API 返回失败:', result.message);
            }
        } else {
            console.error('❌ HTTP 错误:', response.status);
        }
    } catch (error) {
        console.error('❌ 加载额度错误:', error);
    }
}

// 倒计时功能
let countdownInterval = null;

function startCountdown() {
    // 清除之前的定时器
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }

    function updateCountdown() {
        const now = new Date();
        const tomorrow = new Date();
        tomorrow.setHours(24, 0, 0, 0); // 明天凌晨0点

        const diff = tomorrow - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        const countdownElement = document.getElementById('quotaCountdown');
        if (countdownElement) {
            countdownElement.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
    }

    // 立即更新一次
    updateCountdown();

    // 每秒更新
    countdownInterval = setInterval(updateCountdown, 1000);
}

