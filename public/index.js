// API 基础 URL
const API_BASE = '/api/auth';

// DOM 元素
const userInfo = document.getElementById('userInfo');
const usernameDisplay = document.getElementById('usernameDisplay');
const logoutBtn = document.getElementById('logoutBtn');
const buttonGroup = document.getElementById('buttonGroup');

let currentUser = null;

// 检查登录状态
async function checkAuth() {
    try {
        const response = await fetch(`${API_BASE}/me`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                currentUser = result.data;
                displayUserInfo();
                displayButtons();
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

// 显示用户信息
function displayUserInfo() {
    if (currentUser) {
        const roleText = currentUser.role === 'teacher' ? '教师' : '学生';
        usernameDisplay.textContent = `欢迎，${currentUser.username} (${roleText})`;
        userInfo.style.display = 'flex';
        logoutBtn.style.display = 'inline-flex';
        
        // 更新移动端导航栏（教师显示额外按钮）
        updateMobileNav();
    }
}

// 更新移动端导航栏
function updateMobileNav() {
    const teacherOnlyItems = document.querySelectorAll('.mobile-nav .teacher-only');
    if (currentUser && currentUser.role === 'teacher') {
        teacherOnlyItems.forEach(item => {
            item.style.display = 'flex';
        });
    } else {
        teacherOnlyItems.forEach(item => {
            item.style.display = 'none';
        });
    }
}

// 显示按钮（根据角色）
function displayButtons() {
    if (!currentUser) return;

    buttonGroup.innerHTML = '';

    if (currentUser.role === 'teacher') {
        // 教师可以看到所有功能
        buttonGroup.innerHTML = `
            <a href="add-question.html" class="btn btn-secondary btn-large">
                <span class="btn-icon">➕</span>
                <span class="btn-text">添加题目</span>
            </a>
            
            <a href="manage-questions.html" class="btn btn-primary btn-large">
                <span class="btn-icon">📋</span>
                <span class="btn-text">题目管理</span>
            </a>
            
            <a href="submit.html" class="btn btn-primary btn-large">
                <span class="btn-icon">📤</span>
                <span class="btn-text">提交答案</span>
            </a>
        `;
    } else {
        // 学生只能看到提交答案
        buttonGroup.innerHTML = `
            <a href="submit.html" class="btn btn-primary btn-large">
                <span class="btn-icon">📤</span>
                <span class="btn-text">提交答案</span>
            </a>
        `;
    }

    // 如果是管理员，显示管理员入口
    if (currentUser.isAdmin) {
        buttonGroup.innerHTML += `
            <a href="admin.html" class="btn btn-warning btn-large">
                <span class="btn-icon">🔒</span>
                <span class="btn-text">管理员审核</span>
            </a>
        `;
    }
}

// 登出
if (logoutBtn) {
    logoutBtn.addEventListener('click', async function() {
    try {
        const response = await fetch(`${API_BASE}/logout`, {
            method: 'POST',
            credentials: 'include'
        });

        const result = await response.json();
        if (result.success) {
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('登出错误:', error);
        // 即使出错也跳转到登录页面
        window.location.href = 'login.html';
    }
    });
}

// 页面加载时检查登录状态
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initGridMenu();
});

// 初始化金刚区菜单交互
function initGridMenu() {
    // 联系客服弹窗
    const contactBtn = document.getElementById('contactBtn');
    const contactModal = document.getElementById('contactModal');
    const closeContactModal = document.getElementById('closeContactModal');
    const copyWechat = document.getElementById('copyWechat');
    const wechatId = document.getElementById('wechatId');
    const copyQQ = document.getElementById('copyQQ');
    const qqId = document.getElementById('qqId');

    if (contactBtn && contactModal) {
        contactBtn.addEventListener('click', () => {
            contactModal.style.display = 'flex';
        });

        closeContactModal.addEventListener('click', () => {
            contactModal.style.display = 'none';
        });

        contactModal.addEventListener('click', (e) => {
            if (e.target === contactModal) {
                contactModal.style.display = 'none';
            }
        });

        copyWechat.addEventListener('click', () => {
            copyToClipboard(wechatId.textContent);
            copyWechat.textContent = '✅ 已复制';
            setTimeout(() => {
                copyWechat.textContent = '📋 复制微信号';
            }, 2000);
        });

        copyQQ.addEventListener('click', () => {
            copyToClipboard(qqId.textContent);
            copyQQ.textContent = '✅ 已复制';
            setTimeout(() => {
                copyQQ.textContent = '📋 复制QQ号';
            }, 2000);
        });
    }

    // 分享弹窗
    const shareBtn = document.getElementById('shareBtn');
    const shareModal = document.getElementById('shareModal');
    const closeShareModal = document.getElementById('closeShareModal');
    const copyLink = document.getElementById('copyLink');
    const shareLink = document.getElementById('shareLink');

    if (shareBtn && shareModal) {
        shareBtn.addEventListener('click', () => {
            // 设置当前页面链接
            shareLink.value = window.location.origin;
            shareModal.style.display = 'flex';
        });

        closeShareModal.addEventListener('click', () => {
            shareModal.style.display = 'none';
        });

        shareModal.addEventListener('click', (e) => {
            if (e.target === shareModal) {
                shareModal.style.display = 'none';
            }
        });

        copyLink.addEventListener('click', () => {
            copyToClipboard(shareLink.value);
            copyLink.textContent = '✅ 已复制';
            setTimeout(() => {
                copyLink.textContent = '📋 复制链接';
            }, 2000);
        });
    }
}

// 复制到剪贴板
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
    } else {
        // 兑容旧浏览器
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
}
