// API 基础 URL
const API_BASE = '/api/auth';

// DOM 元素
const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const errorMessage = document.getElementById('errorMessage');

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

// 检查登录状态
async function checkAuth() {
    try {
        const response = await fetch(`${API_BASE}/me`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                // 已登录，根据角色跳转
                if (result.data.role === 'teacher') {
                    window.location.href = 'index.html';
                } else {
                    window.location.href = 'submit.html';
                }
            }
        }
    } catch (error) {
        // 未登录，继续显示登录页面
    }
}

// 登录表单提交
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    hideError();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
        showError('请填写用户名和密码');
        return;
    }

    // 显示加载状态
    loginBtn.disabled = true;
    const btnText = loginBtn.querySelector('.btn-text');
    const btnLoader = loginBtn.querySelector('.btn-loader');
    btnText.textContent = '登录中...';
    btnLoader.style.display = 'inline-block';

    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                username,
                password
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch {
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            showError(errorData.message || '登录失败，请重试');
            return;
        }

        const result = await response.json();

        if (result.success) {
            // 登录成功，根据角色跳转
            if (result.data.role === 'teacher') {
                window.location.href = 'index.html';
            } else {
                window.location.href = 'submit.html';
            }
        } else {
            showError(result.message || '登录失败，请重试');
        }
    } catch (error) {
        console.error('登录错误:', error);
        showError('网络错误，请检查连接后重试: ' + (error.message || '未知错误'));
    } finally {
        // 恢复按钮状态
        loginBtn.disabled = false;
        btnText.textContent = '登录';
        btnLoader.style.display = 'none';
    }
});

// 页面加载时检查登录状态
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
});

