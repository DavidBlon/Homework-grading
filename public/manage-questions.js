// API 基础 URL
const API_BASE = '/api/exam';
// AUTH_API_BASE 已在 header-utils.js 中声明

// 分页变量
let allQuestions = []; // 存储所有题目
let currentPage = 1; // 当前页码
const itemsPerPage = 6; // 每页显示数量

// DOM 元素
const questionsTableContainer = document.getElementById('questionsTableContainer');
const refreshBtn = document.getElementById('refreshBtn');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const editModal = document.getElementById('editModal');
const closeModal = document.getElementById('closeModal');
const cancelEdit = document.getElementById('cancelEdit');
const editQuestionForm = document.getElementById('editQuestionForm');
const saveBtn = document.getElementById('saveBtn');

// 检查登录状态和权限
async function checkAuth() {
    try {
        const response = await fetch(`${AUTH_API_BASE}/me`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data.role === 'teacher') {
                return; // 已登录且是教师
            } else {
                if (window.showError) {
                    window.showError('您没有权限访问此页面');
                }
                window.location.href = 'index.html';
            }
        } else {
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('检查登录状态错误:', error);
        window.location.href = 'login.html';
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

// 加载题目列表
async function loadQuestions() {
    try {
        questionsTableContainer.innerHTML = `
            <div style="text-align: center; padding: 40px 0; color: #666;">
                <div class="btn-loader" style="display: inline-block; font-size: 24px;">⏳</div>
                <p style="margin-top: 10px;">正在加载题目...</p>
            </div>
        `;

        const response = await fetch(`${API_BASE}/questions`, {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('加载失败');
        }

        const result = await response.json();

        if (result.success) {
            allQuestions = result.data || [];
            currentPage = 1; // 重置到第一页
            displayQuestions();
        } else {
            showErrorMsg('加载题目列表失败: ' + result.message);
            questionsTableContainer.innerHTML = '<p style="text-align: center; color: #666;">加载失败</p>';
        }
    } catch (error) {
        console.error('加载题目列表错误:', error);
        showErrorMsg('加载题目列表失败，请刷新页面重试');
        questionsTableContainer.innerHTML = '<p style="text-align: center; color: #666;">加载失败</p>';
    }
}

// 显示题目列表（带分页）
function displayQuestions() {
    if (!allQuestions || allQuestions.length === 0) {
        questionsTableContainer.innerHTML = `
            <div style="text-align: center; padding: 40px 0; color: #666;">
                <p style="font-size: 1.2rem; margin-bottom: 1rem;">📝 暂无题目</p>
                <p>点击上方“添加题目”按钮开始添加题目</p>
            </div>
        `;
        return;
    }

    // 计算分页
    const totalPages = Math.ceil(allQuestions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentQuestions = allQuestions.slice(startIndex, endIndex);

    const tableHTML = `
        <table class="questions-table">
            <thead>
                <tr>
                    <th style="width: 60px;">ID</th>
                    <th>题目内容</th>
                    <th style="width: 90px;">类型</th>
                    <th style="width: 80px;">满分</th>
                    <th style="width: 120px;">创建时间</th>
                    <th style="width: 140px;">操作</th>
                </tr>
            </thead>
            <tbody>
                ${currentQuestions.map(q => `
                    <tr>
                        <td><strong>#${q.id}</strong></td>
                        <td class="question-content" title="${escapeHtml(q.content)}">${escapeHtml(q.content)}</td>
                        <td><span class="type-badge ${q.type === 'objective' ? 'objective' : 'subjective'}">${q.type === 'objective' ? '客观题' : '主观题'}</span></td>
                        <td><strong>${q.maxScore}</strong>分</td>
                        <td style="color: var(--text-secondary); font-size: 0.85rem;">${new Date(q.createdAt).toLocaleDateString('zh-CN')}</td>
                        <td class="action-buttons">
                            <button class="btn-small btn-edit" onclick="editQuestion(${q.id})">
                                <span>✏️</span>
                                <span>编辑</span>
                            </button>
                            <button class="btn-small btn-delete" onclick="deleteQuestion(${q.id})">
                                <span>🗑️</span>
                                <span>删除</span>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <!-- 分页控件 -->
        <div class="pagination pagination-full">
            <button class="pagination-btn" onclick="changePage(1)" ${currentPage === 1 ? 'disabled' : ''}>
                « 首页
            </button>
            <button class="pagination-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
                ‹ 上一页
            </button>
            <span class="pagination-info">
                第 ${currentPage} / ${totalPages} 页 (共 ${allQuestions.length} 题)
            </span>
            <button class="pagination-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
                下一页 ›
            </button>
            <button class="pagination-btn" onclick="changePage(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>
                尾页 »
            </button>
        </div>
    `;

    questionsTableContainer.innerHTML = tableHTML;
}

// 切换页码
function changePage(page) {
    const totalPages = Math.ceil(allQuestions.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    displayQuestions();
}

// HTML 转义函数
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 编辑题目
async function editQuestion(questionId) {
    try {
        // 获取题目详情
        const response = await fetch(`${API_BASE}/questions/${questionId}`, {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('获取题目详情失败');
        }

        const result = await response.json();

        if (result.success) {
            const question = result.data;
            
            // 填充表单
            document.getElementById('editQuestionId').value = question.id;
            document.getElementById('editQuestionContent').value = question.content;
            document.getElementById('editQuestionType').value = question.type;
            document.getElementById('editQuestionMaxScore').value = question.maxScore;
            document.getElementById('editStandardAnswer').value = question.standardAnswer;
            document.getElementById('editScoringRubric').value = question.scoringRubric;

            // 显示模态框
            editModal.style.display = 'block';
        } else {
            showErrorMsg('获取题目详情失败: ' + result.message);
        }
    } catch (error) {
        console.error('获取题目详情错误:', error);
        showErrorMsg('获取题目详情失败');
    }
}

// 删除题目
async function deleteQuestion(questionId) {
    if (!confirm('确定要删除这道题目吗？删除后将无法恢复，且相关的所有提交记录也会被删除！')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/questions/${questionId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const result = await response.json();

        if (result.success) {
            showSuccessMsg('题目删除成功！');
            await loadQuestions(); // 重新加载列表
        } else {
            showErrorMsg('删除题目失败: ' + result.message);
        }
    } catch (error) {
        console.error('删除题目错误:', error);
        showErrorMsg('删除题目失败');
    }
}

// 保存编辑
editQuestionForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const questionId = document.getElementById('editQuestionId').value;
    const content = document.getElementById('editQuestionContent').value.trim();
    const type = document.getElementById('editQuestionType').value;
    const maxScore = document.getElementById('editQuestionMaxScore').value;
    const standardAnswer = document.getElementById('editStandardAnswer').value.trim();
    const scoringRubric = document.getElementById('editScoringRubric').value.trim();

    // 验证
    if (!content || !type || !maxScore || !standardAnswer || !scoringRubric) {
        showErrorMsg('请填写所有必填项');
        return;
    }

    // 显示加载状态
    saveBtn.disabled = true;
    const btnText = saveBtn.querySelector('.btn-text');
    const btnLoader = saveBtn.querySelector('.btn-loader');
    btnText.textContent = '保存中...';
    btnLoader.style.display = 'inline-block';

    try {
        const response = await fetch(`${API_BASE}/questions/${questionId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                content,
                type,
                maxScore: parseInt(maxScore, 10),
                standardAnswer,
                scoringRubric
            })
        });

        const result = await response.json();

        if (result.success) {
            showSuccessMsg('题目更新成功！');
            editModal.style.display = 'none';
            await loadQuestions(); // 重新加载列表
        } else {
            showErrorMsg('更新题目失败: ' + result.message);
        }
    } catch (error) {
        console.error('更新题目错误:', error);
        showErrorMsg('更新题目失败');
    } finally {
        // 恢复按钮状态
        saveBtn.disabled = false;
        btnText.textContent = '保存修改';
        btnLoader.style.display = 'none';
    }
});

// 关闭模态框
closeModal.addEventListener('click', function() {
    editModal.style.display = 'none';
});

cancelEdit.addEventListener('click', function() {
    editModal.style.display = 'none';
});

// 点击模态框外部关闭
window.addEventListener('click', function(event) {
    if (event.target === editModal) {
        editModal.style.display = 'none';
    }
});

// 刷新按钮
refreshBtn.addEventListener('click', async function() {
    refreshBtn.disabled = true;
    refreshBtn.style.opacity = '0.5';
    await loadQuestions();
    refreshBtn.disabled = false;
    refreshBtn.style.opacity = '1';
});

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', async function() {
    await checkAuth();
    await loadQuestions();
});
