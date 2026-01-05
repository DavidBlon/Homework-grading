// API 基础 URL
const API_BASE = '/api/auth';

// DOM 元素
const registerForm = document.getElementById('registerForm');
const registerBtn = document.getElementById('registerBtn');

// 从 URL 判断是学生还是教师注册
const isTeacher = window.location.pathname.includes('register-teacher');
const role = isTeacher ? 'teacher' : 'student';

// 显示错误消息 - 使用全局Toast
function showErrorMsg(message) {
    if (typeof window.showError === 'function') {
        window.showError(message);
    } else {
        console.error(message);
    }
}

function hideError() {
    // Toast自动消失
}

// 注册表单提交
registerForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    hideError();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // 验证
    if (!username || !password || !confirmPassword) {
        showErrorMsg('请填写所有必填项');
        return;
    }

    if (username.length < 3 || username.length > 20) {
        showErrorMsg('用户名长度必须在 3-20 个字符之间');
        return;
    }

    if (password.length < 6) {
        showErrorMsg('密码长度至少为 6 个字符');
        return;
    }

    if (password !== confirmPassword) {
        showErrorMsg('两次输入的密码不一致');
        return;
    }

    // 显示加载状态
    registerBtn.disabled = true;
    const btnText = registerBtn.querySelector('.btn-text');
    const btnLoader = registerBtn.querySelector('.btn-loader');
    btnText.textContent = '注册中...';
    btnLoader.style.display = 'inline-block';

    try {
        const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                username,
                password,
                role
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
            showErrorMsg(errorData.message || '注册失败，请重试');
            return;
        }

        const result = await response.json();

        if (result.success) {
            // 注册成功，使用Toast显示成功消息
            if (window.showSuccess) {
                window.showSuccess('注册成功！正在跳转到登录页面...');
            }
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        } else {
            showErrorMsg(result.message || '注册失败，请重试');
        }
    } catch (error) {
        console.error('注册错误:', error);
        showErrorMsg('网络错误，请检查连接后重试: ' + error.message);
    } finally {
        // 恢复按钮状态
        registerBtn.disabled = false;
        btnText.textContent = '注册';
        btnLoader.style.display = 'none';
    }
});

