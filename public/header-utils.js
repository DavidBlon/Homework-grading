// 页头工具函数 - 用于在所有页面显示用户信息

const AUTH_API_BASE = '/api/auth';

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


