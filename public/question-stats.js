// API 基础 URL
const API_BASE = '/api/exam';

// DOM 元素
const questionSelect = document.getElementById('questionSelect');
const questionDetail = document.getElementById('questionDetail');
const submissionsSection = document.getElementById('submissionsSection');
const submissionsList = document.getElementById('submissionsList');
const noSubmissions = document.getElementById('noSubmissions');
const studentNameSearch = document.getElementById('studentNameSearch');
const searchStudentBtn = document.getElementById('searchStudentBtn');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const paginationControls = document.getElementById('paginationControls');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const pageInfo = document.getElementById('pageInfo');

let currentQuestionId = null;
let allSubmissions = []; // 所有答题记录
let filteredSubmissions = []; // 过滤后的记录
let currentPage = 1;
const itemsPerPage = 1; // 每页显示1个学生

// 检查登录状态
async function checkAuth() {
    try {
        const response = await fetch(`${AUTH_API_BASE}/me`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data.role === 'teacher') {
                return;
            } else {
                alert('此功能仅限教师使用');
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

// 加载我的题目列表
async function loadMyQuestions() {
    try {
        const response = await fetch(`${API_BASE}/questions`, {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('加载题目失败');
        }

        const result = await response.json();

        if (result.success) {
            questionSelect.innerHTML = '<option value="">请选择题目</option>';
            
            if (result.data && result.data.length > 0) {
                result.data.forEach(question => {
                    const option = document.createElement('option');
                    option.value = question.id;
                    const preview = question.content.length > 30 
                        ? question.content.substring(0, 30) + '...' 
                        : question.content;
                    option.textContent = `#${question.id} - ${preview}`;
                    questionSelect.appendChild(option);
                });
            } else {
                questionSelect.innerHTML = '<option value="">暂无题目</option>';
            }
        }
    } catch (error) {
        console.error('加载题目列表错误:', error);
        questionSelect.innerHTML = '<option value="">加载失败</option>';
    }
}

// 加载题目详情和统计
async function loadQuestionStats(questionId) {
    try {
        // 加载题目详情
        const questionResponse = await fetch(`${API_BASE}/questions/${questionId}`, {
            credentials: 'include'
        });

        if (!questionResponse.ok) {
            throw new Error('加载题目详情失败');
        }

        const questionResult = await questionResponse.json();

        if (questionResult.success) {
            const question = questionResult.data;
            
            // 显示题目详情
            document.getElementById('questionContent').textContent = question.content;
            document.getElementById('standardAnswer').textContent = question.standardAnswer;
            document.getElementById('questionType').textContent = question.type === 'objective' ? '客观题' : '主观题';
            document.getElementById('maxScore').textContent = question.maxScore;
            
            questionDetail.style.display = 'block';
        }

        // 加载答题记录
        const submissionsResponse = await fetch(`${API_BASE}/questions/${questionId}/submissions`, {
            credentials: 'include'
        });

        if (!submissionsResponse.ok) {
            throw new Error('加载答题记录失败');
        }

        const submissionsResult = await submissionsResponse.json();

        if (submissionsResult.success) {
            allSubmissions = submissionsResult.data;
            filteredSubmissions = allSubmissions;
            
            // 更新统计信息
            document.getElementById('submissionCount').textContent = allSubmissions.length;
            
            if (allSubmissions.length > 0) {
                const avgScore = (allSubmissions.reduce((sum, s) => sum + s.score, 0) / allSubmissions.length).toFixed(2);
                document.getElementById('averageScore').textContent = avgScore + ' 分';
                
                // 显示答题记录（分页）
                currentPage = 1;
                displaySubmissionsPage();
                submissionsSection.style.display = 'block';
                noSubmissions.style.display = 'none';
            } else {
                document.getElementById('averageScore').textContent = '-';
                submissionsSection.style.display = 'block';
                submissionsList.innerHTML = '';
                noSubmissions.style.display = 'block';
                paginationControls.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('加载数据错误:', error);
        alert('加载数据失败：' + error.message);
    }
}

// 显示分页的答题记录
function displaySubmissionsPage() {
    const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageSubmissions = filteredSubmissions.slice(startIndex, endIndex);
    
    submissionsList.innerHTML = '';
    
    if (pageSubmissions.length === 0) {
        noSubmissions.style.display = 'block';
        paginationControls.style.display = 'none';
        return;
    }
    
    noSubmissions.style.display = 'none';
    
    pageSubmissions.forEach((submission, index) => {
        const absoluteIndex = startIndex + index;
        const card = document.createElement('div');
        card.className = 'submission-card';
        
        const scoreClass = getScoreClass(submission.score, submission.question.maxScore);
        const submitDate = new Date(submission.createdAt).toLocaleString('zh-CN');
        
        card.innerHTML = `
            <div class="submission-header">
                <div class="submission-info">
                    <span class="submission-number">#${absoluteIndex + 1}</span>
                    <span class="student-name">👤 ${escapeHtml(submission.studentName)}</span>
                    <span class="submission-date">📅 ${submitDate}</span>
                </div>
                <div class="submission-score ${scoreClass}">
                    ${submission.score} / ${submission.question.maxScore} 分
                </div>
            </div>
            
            <div class="submission-content">
                <div class="answer-section">
                    <h4>📝 学生答案：</h4>
                    <div class="answer-text">${escapeHtml(submission.studentAnswer)}</div>
                </div>
                
                <div class="feedback-section">
                    <h4>🤖 AI 评语：</h4>
                    <div class="feedback-text">${escapeHtml(submission.feedback)}</div>
                </div>
                
                ${submission.imageUrl ? `
                    <div class="image-section">
                        <h4>📷 答题图片：</h4>
                        <img src="${submission.imageUrl}" alt="答题图片" class="submission-image" onclick="viewImage('${submission.imageUrl}')">
                    </div>
                ` : ''}
            </div>
        `;
        
        submissionsList.appendChild(card);
    });
    
    // 更新分页控制
    if (totalPages > 1) {
        paginationControls.style.display = 'flex';
        pageInfo.textContent = `第 ${currentPage} / ${totalPages} 页`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;
    } else {
        paginationControls.style.display = 'none';
    }
}

// 搜索学生
function searchStudent() {
    const searchTerm = studentNameSearch.value.trim().toLowerCase();
    
    if (searchTerm === '') {
        filteredSubmissions = allSubmissions;
        clearSearchBtn.style.display = 'none';
    } else {
        filteredSubmissions = allSubmissions.filter(sub => 
            sub.studentName.toLowerCase().includes(searchTerm)
        );
        clearSearchBtn.style.display = 'inline-flex';
    }
    
    currentPage = 1;
    displaySubmissionsPage();
}

// 清除搜索
function clearSearch() {
    studentNameSearch.value = '';
    filteredSubmissions = allSubmissions;
    clearSearchBtn.style.display = 'none';
    currentPage = 1;
    displaySubmissionsPage();
}

// 根据分数获取样式类
function getScoreClass(score, maxScore) {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'score-excellent';
    if (percentage >= 80) return 'score-good';
    if (percentage >= 60) return 'score-pass';
    return 'score-fail';
}

// 查看大图
window.viewImage = function(url) {
    window.open(url, '_blank');
};

// HTML 转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 题目选择改变事件
questionSelect.addEventListener('change', function() {
    const questionId = this.value;
    if (questionId) {
        currentQuestionId = questionId;
        loadQuestionStats(questionId);
    } else {
        questionDetail.style.display = 'none';
        submissionsSection.style.display = 'none';
    }
});

// 搜索按钮点击事件
searchStudentBtn.addEventListener('click', searchStudent);

// 回车键搜索
studentNameSearch.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        searchStudent();
    }
});

// 清除搜索按钮
clearSearchBtn.addEventListener('click', clearSearch);

// 分页按钮事件
prevPageBtn.addEventListener('click', function() {
    if (currentPage > 1) {
        currentPage--;
        displaySubmissionsPage();
    }
});

nextPageBtn.addEventListener('click', function() {
    const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displaySubmissionsPage();
    }
});

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', async function() {
    await checkAuth();
    await loadMyQuestions();
});
