// API 基础 URL
const API_BASE = '/api/exam';

// DOM 元素
const questionSelect = document.getElementById('questionId');
const submitForm = document.getElementById('submitForm');
const submitBtn = document.getElementById('submitBtn');
const resultSection = document.getElementById('resultSection');
const resultContent = document.getElementById('resultContent');
const errorMessage = document.getElementById('errorMessage');
const resetBtn = document.getElementById('resetBtn');
const imageInput = document.getElementById('image');
const imagePreview = document.getElementById('imagePreview');
const addQuestionForm = document.getElementById('addQuestionForm');
const addQuestionBtn = document.getElementById('addQuestionBtn');

// 加载题目列表
async function loadQuestions() {
    try {
        const response = await fetch(`${API_BASE}/questions`);
        const result = await response.json();

        if (result.success) {
            questionSelect.innerHTML = '<option value="">请选择题目</option>';
            
            if (result.data.length === 0) {
                questionSelect.innerHTML = '<option value="">暂无题目</option>';
                return;
            }

            result.data.forEach(question => {
                const option = document.createElement('option');
                option.value = question.id;
                option.textContent = `题目 ${question.id} - ${question.type === 'objective' ? '客观题' : '主观题'} (满分: ${question.maxScore}分)`;
                questionSelect.appendChild(option);
            });
        } else {
            showErrorMsg('加载题目列表失败: ' + result.message);
        }
    } catch (error) {
        console.error('加载题目列表错误:', error);
        showErrorMsg('加载题目列表失败，请刷新页面重试');
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

// 隐藏错误消息
function hideError() {
    // Toast自动消失
}

// 图片预览
imageInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.innerHTML = `<img src="${e.target.result}" alt="预览图片">`;
        };
        reader.readAsDataURL(file);
    } else {
        imagePreview.innerHTML = '';
    }
});

// 表单提交
submitForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    hideError();

    const formData = new FormData(submitForm);
    const questionId = formData.get('questionId');
    const studentName = formData.get('studentName');
    const image = formData.get('image');

    // 验证
    if (!questionId) {
        showErrorMsg('请选择题目');
        return;
    }

    if (!studentName.trim()) {
        showErrorMsg('请输入学生姓名');
        return;
    }

    if (!image || image.size === 0) {
        showErrorMsg('请选择图片文件');
        return;
    }

    // 检查文件大小（5MB）
    if (image.size > 5 * 1024 * 1024) {
        showErrorMsg('图片大小不能超过 5MB');
        return;
    }

    // 显示加载状态
    submitBtn.disabled = true;
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    btnText.textContent = '正在处理...';
    btnLoader.style.display = 'inline-block';

    try {
        const response = await fetch(`${API_BASE}/submit`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            displayResult(result.data);
            submitForm.style.display = 'none';
            resultSection.style.display = 'block';
        } else {
            showErrorMsg(result.message || '提交失败，请重试');
        }
    } catch (error) {
        console.error('提交错误:', error);
        showErrorMsg('网络错误，请检查连接后重试');
    } finally {
        // 恢复按钮状态
        submitBtn.disabled = false;
        btnText.textContent = '提交批改';
        btnLoader.style.display = 'none';
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
    imagePreview.innerHTML = '';
    hideError();
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// HTML 转义函数
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 添加题目表单提交
addQuestionForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    hideError();

    const questionContent = document.getElementById('questionContent').value.trim();
    const questionType = document.getElementById('questionType').value;
    const questionMaxScore = document.getElementById('questionMaxScore').value;
    const standardAnswer = document.getElementById('standardAnswer').value.trim();
    const scoringRubric = document.getElementById('scoringRubric').value.trim();

    // 验证
    if (!questionContent || !questionType || !questionMaxScore || !standardAnswer || !scoringRubric) {
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
        const response = await fetch(`${API_BASE}/questions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: questionContent,
                type: questionType,
                maxScore: maxScore,
                standardAnswer: standardAnswer,
                scoringRubric: scoringRubric
            })
        });

        const result = await response.json();

        if (result.success) {
            // 清空表单
            addQuestionForm.reset();
            
            // 重新加载题目列表
            await loadQuestions();
            
            // 显示成功消息
            if (window.showSuccess) {
                window.showSuccess('题目添加成功！');
            }
        } else {
            showErrorMsg(result.message || '添加题目失败，请重试');
        }
    } catch (error) {
        console.error('添加题目错误:', error);
        showErrorMsg('网络错误，请检查连接后重试');
    } finally {
        // 恢复按钮状态
        addQuestionBtn.disabled = false;
        btnText.textContent = '添加题目';
        btnLoader.style.display = 'none';
    }
});

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    loadQuestions();
});

