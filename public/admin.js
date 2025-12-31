// API 基础 URL
// AUTH_API_BASE 已在 header-utils.js 中定义
const PAYMENT_API_BASE = '/api/payment';

// 全局变量
let currentAction = null;
let currentOrderId = null;

// 检查管理员权限
async function checkAdminAuth() {
    try {
        const response = await fetch(`${AUTH_API_BASE}/me`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('👤 用户信息:', result.data);
            
            if (result.success && result.data) {
                // 检查是否为管理员
                console.log('🔑 isAdmin 值:', result.data.isAdmin);
                
                if (!result.data.isAdmin) {
                    alert('无权限访问！仅管理员可进入审核中心。');
                    window.location.href = 'index.html';
                    return false;
                }
                
                console.log('✅ 管理员权限验证通过');
                return true;
            }
        }
        
        // 未登录或权限不足
        alert('请先登录管理员账户');
        window.location.href = 'login.html';
        return false;
    } catch (error) {
        console.error('检查权限错误:', error);
        alert('检查权限失败，请重新登录');
        window.location.href = 'login.html';
        return false;
    }
}

// 加载待审核订单
async function loadPendingOrders() {
    try {
        const response = await fetch(`${PAYMENT_API_BASE}/pending`, {
            credentials: 'include'
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                displayOrders(result.data);
                updateStats(result.data, result.stats || {});
            }
        } else if (response.status === 403) {
            alert('无权限访问！仅管理员可查看待审核订单。');
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('加载订单错误:', error);
        document.getElementById('pendingOrders').innerHTML = 
            '<p style="text-align: center; color: #ef4444; padding: 2rem;">加载失败，请刷新重试</p>';
    }
}

// 显示订单列表
function displayOrders(orders) {
    const container = document.getElementById('pendingOrders');
    
    if (orders.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #64748b; padding: 2rem;">🎉 暂无待审核订单</p>';
        return;
    }

    const html = `
        <div class="table-responsive">
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                        <th style="padding: 1rem; text-align: left; font-weight: 600;">订单号</th>
                        <th style="padding: 1rem; text-align: left; font-weight: 600;">用户</th>
                        <th style="padding: 1rem; text-align: left; font-weight: 600;">金额</th>
                        <th style="padding: 1rem; text-align: left; font-weight: 600;">支付方式</th>
                        <th style="padding: 1rem; text-align: left; font-weight: 600;">提交时间</th>
                        <th style="padding: 1rem; text-align: center; font-weight: 600;">操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${orders.map(order => `
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 1rem; font-family: monospace; font-size: 0.875rem;">${order.orderId}</td>
                            <td style="padding: 1rem;">
                                <div style="font-weight: 600;">${order.user.username}</div>
                                <div style="font-size: 0.875rem; color: #64748b;">${order.user.role === 'teacher' ? '教师' : '学生'}</div>
                            </td>
                            <td style="padding: 1rem;">
                                <span style="color: #ef4444; font-weight: 700; font-size: 1.125rem;">¥${order.amount.toFixed(2)}</span>
                            </td>
                            <td style="padding: 1rem;">
                                ${getPaymentMethodBadge(order.paymentMethod)}
                            </td>
                            <td style="padding: 1rem; font-size: 0.875rem; color: #64748b;">
                                ${formatDate(order.createdAt)}
                            </td>
                            <td style="padding: 1rem; text-align: center;">
                                <button onclick="approveOrder('${order.orderId}', ${order.amount})" 
                                    class="btn btn-primary" style="margin-right: 0.5rem; padding: 0.5rem 1rem;">
                                    ✅ 通过
                                </button>
                                <button onclick="rejectOrder('${order.orderId}')" 
                                    class="btn btn-secondary" style="padding: 0.5rem 1rem; background: #ef4444;">
                                    ❌ 拒绝
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
}

// 获取支付方式徽章
function getPaymentMethodBadge(method) {
    const badges = {
        alipay: '<span style="background: #1677ff; color: white; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem;">💙 支付宝</span>',
        wechat: '<span style="background: #07c160; color: white; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem;">💚 微信</span>',
        unionpay: '<span style="background: #ef4444; color: white; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem;">🔴 云闪付</span>'
    };
    return badges[method] || method;
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    
    return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 更新统计信息
function updateStats(orders, stats) {
    document.getElementById('pendingCount').textContent = orders.length;
    
    // 总审核金额（使用后端返回的已审核通过订单总金额）
    const totalAmount = stats.totalApprovedAmount || 0;
    document.getElementById('totalAmount').textContent = `¥${totalAmount.toFixed(2)}`;
    
    // 今日已审核（使用后端返回的统计数据）
    document.getElementById('todayApproved').textContent = stats.todayApproved || 0;
}

// 通过订单
function approveOrder(orderId, amount) {
    currentOrderId = orderId;
    currentAction = 'approve';
    
    document.getElementById('modalTitle').textContent = '✅ 确认通过订单';
    document.getElementById('modalBody').innerHTML = `
        <div style="padding: 1rem;">
            <p style="margin-bottom: 1rem;">确认审核通过以下充值订单？</p>
            <div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                <p style="margin: 0.5rem 0;"><strong>订单号：</strong>${orderId}</p>
                <p style="margin: 0.5rem 0;"><strong>充值金额：</strong><span style="color: #ef4444; font-size: 1.25rem; font-weight: 700;">¥${amount.toFixed(2)}</span></p>
            </div>
            <p style="color: #64748b; font-size: 0.875rem;">⚠️ 请确认已收到用户的付款后再通过审核</p>
        </div>
    `;
    
    document.getElementById('confirmModal').style.display = 'flex';
}

// 拒绝订单
function rejectOrder(orderId) {
    currentOrderId = orderId;
    currentAction = 'reject';
    
    document.getElementById('modalTitle').textContent = '❌ 确认拒绝订单';
    document.getElementById('modalBody').innerHTML = `
        <div style="padding: 1rem;">
            <p style="margin-bottom: 1rem;">确认拒绝以下充值订单？</p>
            <div style="background: #fef2f2; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                <p style="margin: 0.5rem 0;"><strong>订单号：</strong>${orderId}</p>
            </div>
            <p style="color: #ef4444; font-size: 0.875rem;">⚠️ 拒绝后用户需要重新提交充值申请</p>
        </div>
    `;
    
    document.getElementById('confirmModal').style.display = 'flex';
}

// 关闭模态框
function closeModal() {
    document.getElementById('confirmModal').style.display = 'none';
    currentOrderId = null;
    currentAction = null;
}

// 确认按钮点击
document.getElementById('confirmBtn').addEventListener('click', async function() {
    if (!currentOrderId || !currentAction) return;
    
    try {
        const response = await fetch(`${PAYMENT_API_BASE}/approve`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                orderId: currentOrderId,
                approve: currentAction === 'approve'
            })
        });

        const result = await response.json();

        if (result.success) {
            alert(currentAction === 'approve' ? '✅ 订单审核通过，余额已到账！' : '❌ 订单已拒绝');
            closeModal();
            // 重新加载订单列表
            await loadPendingOrders();
        } else {
            alert('操作失败：' + result.message);
        }
    } catch (error) {
        console.error('审核订单错误:', error);
        alert('操作失败，请重试');
    }
});

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', async function() {
    const hasAuth = await checkAdminAuth();
    if (hasAuth) {
        await loadPendingOrders();
        
        // 每30秒自动刷新一次
        setInterval(loadPendingOrders, 30000);
    }
});

// 退出登录
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async function() {
        try {
            const response = await fetch(`${AUTH_API_BASE}/logout`, {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error('登出错误:', error);
            window.location.href = 'login.html';
        }
    });
}
