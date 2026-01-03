// 页头工具函数 - 用于在所有页面显示用户信息

const AUTH_API_BASE = '/api/auth';

// ================================
// Toast 提示系统
// ================================

// 创建Toast容器
function getToastContainer() {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    return container;
}

// 显示Toast提示
function showToast(message, type = 'info', duration = 3000) {
    const container = getToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    // 自动消失
    setTimeout(() => {
        toast.classList.add('toast-out');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, duration);
    
    return toast;
}

// 快捷方法
function showSuccess(message, duration = 3000) {
    return showToast(message, 'success', duration);
}

function showError(message, duration = 4000) {
    return showToast(message, 'error', duration);
}

function showWarning(message, duration = 3500) {
    return showToast(message, 'warning', duration);
}

function showInfo(message, duration = 3000) {
    return showToast(message, 'info', duration);
}

// 全局暴露
window.showToast = showToast;
window.showSuccess = showSuccess;
window.showError = showError;
window.showWarning = showWarning;
window.showInfo = showInfo;

// 更新页头用户信息
async function updateHeaderUserInfo() {
    try {
        const response = await fetch(`${AUTH_API_BASE}/me`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                const userInfo = document.getElementById('userInfo');
                const usernameDisplay = document.getElementById('usernameDisplay');
                
                if (userInfo && usernameDisplay) {
                    const roleText = result.data.role === 'teacher' ? '教师' : '学生';
                    usernameDisplay.textContent = `欢迎，${result.data.username} (${roleText})`;
                    userInfo.style.display = 'flex';
                }
                
                // 更新移动端导航栏
                updateMobileNavForRole(result.data.role);
            }
        }
    } catch (error) {
        // 静默失败，不显示错误
        console.error('获取用户信息失败:', error);
    }
}

// 更新移动端导航栏（根据用户角色）
function updateMobileNavForRole(role) {
    const teacherOnlyItems = document.querySelectorAll('.mobile-nav .teacher-only');
    if (role === 'teacher') {
        teacherOnlyItems.forEach(item => {
            item.style.display = 'flex';
        });
    } else {
        teacherOnlyItems.forEach(item => {
            item.style.display = 'none';
        });
    }
}

// 初始化页头
document.addEventListener('DOMContentLoaded', function() {
    updateHeaderUserInfo();
});


