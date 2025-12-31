// API 基础 URL
const PAYMENT_API_BASE = '/api/payment';

// 全局变量
let selectedAmount = 0;
let currentOrderId = '';

// 收款码配置（请替换为你自己的收款码）
const PAYMENT_QRCODES = {
    alipay: '/Apliy/微信图片_20251228181035_59_259.jpg',  // 支付宝收款码
    wechat: '/Apliy/微信图片_20251228181159_60_259.jpg',  // 微信收款码
    unionpay: '/Apliy/微信图片_20251228181159_60_259.jpg' // 暂时使用微信收款码
};

// DOM 元素
const currentBalance = document.getElementById('currentBalance');
const dailyQuotaInfo = document.getElementById('dailyQuotaInfo');
const remainingQuotaInfo = document.getElementById('remainingQuotaInfo');
const rechargeBtns = document.querySelectorAll('.recharge-btn');
const customAmountInput = document.getElementById('customAmount');
const confirmRechargeBtn = document.getElementById('confirmRecharge');
const transactionsList = document.getElementById('transactionsList');
const errorMessage = document.getElementById('errorMessage');

// 加载用户余额和额度
async function loadBalance() {
    try {
        const response = await fetch(`${PAYMENT_API_BASE}/quota`, {
            credentials: 'include'
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                const data = result.data;
                
                // 检查是否为测试账户
                if (data.isTestAccount) {
                    currentBalance.textContent = '∞ 无限额度';
                    dailyQuotaInfo.textContent = '∞ 无限次数';
                    remainingQuotaInfo.textContent = '∞ 无限次数 (测试账户)';
                    remainingQuotaInfo.style.color = '#f59e0b';
                } else {
                    currentBalance.textContent = `¥${data.balance.toFixed(2)}`;
                    dailyQuotaInfo.textContent = `${data.dailyQuota} 次`;
                    remainingQuotaInfo.textContent = `${data.remainingFreeQuota} 次`;
                    
                    // 根据剩余额度设置颜色
                    if (data.remainingFreeQuota === 0) {
                        remainingQuotaInfo.style.color = '#ef4444'; // 红色
                    } else if (data.remainingFreeQuota <= 2) {
                        remainingQuotaInfo.style.color = '#f59e0b'; // 橙色
                    } else {
                        remainingQuotaInfo.style.color = '#3b82f6'; // 蓝色
                    }
                }
            }
        } else if (response.status === 401) {
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('加载余额错误:', error);
        showError('加载余额失败');
    }
}

// 加载交易记录
// 分页变量
let allTransactions = [];
let currentPage = 1;
const pageSize = 5;

async function loadTransactions() {
    try {
        const response = await fetch(`${PAYMENT_API_BASE}/transactions`, {
            credentials: 'include'
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data.length > 0) {
                allTransactions = result.data;
                currentPage = 1;
                displayTransactions();
            } else {
                transactionsList.innerHTML = '<p style="text-align: center; color: #666;">暂无交易记录</p>';
            }
        }
    } catch (error) {
        console.error('加载交易记录错误:', error);
        transactionsList.innerHTML = '<p style="text-align: center; color: #666;">加载失败</p>';
    }
}

// 显示交易记录
function displayTransactions() {
    const totalPages = Math.ceil(allTransactions.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentTransactions = allTransactions.slice(startIndex, endIndex);
    
    const html = currentTransactions.map(t => {
        const typeText = t.type === 'recharge' ? '充值' : '消费';
        const statusText = t.status === 'completed' ? '已完成' : t.status === 'pending' ? '处理中' : '失败';
        const statusClass = t.status === 'completed' ? 'status-success' : t.status === 'pending' ? 'status-pending' : 'status-failed';
        const amountClass = t.type === 'recharge' ? 'amount-positive' : 'amount-negative';
        const amountSign = t.type === 'recharge' ? '+' : '-';

        return `
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-type">${typeText}</div>
                    <div class="transaction-desc">${t.description}</div>
                    <div class="transaction-time">${new Date(t.createdAt).toLocaleString('zh-CN')}</div>
                </div>
                <div class="transaction-right">
                    <div class="transaction-amount ${amountClass}">${amountSign}¥${t.amount.toFixed(2)}</div>
                    <div class="transaction-status ${statusClass}">${statusText}</div>
                </div>
            </div>
        `;
    }).join('');

    // 添加分页按钮
    const paginationHtml = totalPages > 1 ? `
        <div class="pagination">
            <button class="pagination-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>上一页</button>
            <span class="pagination-info">第 ${currentPage} / ${totalPages} 页</span>
            <button class="pagination-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>下一页</button>
        </div>
    ` : '';

    transactionsList.innerHTML = html + paginationHtml;
}

// 翻页函数
function changePage(page) {
    const totalPages = Math.ceil(allTransactions.length / pageSize);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    displayTransactions();
}

// 充值金额按钮点击事件
rechargeBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        // 移除所有按钮的选中状态
        rechargeBtns.forEach(b => b.classList.remove('selected'));
        
        // 添加选中状态
        this.classList.add('selected');
        
        // 如果是自定义金额按钮
        if (this.classList.contains('custom-amount')) {
            customAmountInput.style.display = 'block';
            customAmountInput.focus();
            selectedAmount = 0;
        } else {
            customAmountInput.style.display = 'none';
            selectedAmount = parseFloat(this.dataset.amount);
        }
    });
});

// 自定义金额输入
customAmountInput.addEventListener('input', function() {
    selectedAmount = parseFloat(this.value) || 0;
});

// 确认充值按钮
confirmRechargeBtn.addEventListener('click', async function() {
    if (selectedAmount <= 0) {
        showError('请选择充值金额');
        return;
    }

    if (selectedAmount < 0.01) {
        showError('最低充值金额为 ¥0.01');
        return;
    }

    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

    try {
        // 生成订单
        const orderId = `ORDER${Date.now()}`;
        currentOrderId = orderId;

        // 显示收款码模态框
        showQrcodeModal(selectedAmount, paymentMethod);

    } catch (error) {
        console.error('生成收款码错误:', error);
        showError('生成收款码失败，请重试');
    }
});

// 显示收款码模态框
function showQrcodeModal(amount, method) {
    const modal = document.getElementById('qrcodeModal');
    const qrcodeContainer = document.getElementById('qrcodeContainer');
    const displayAmount = document.getElementById('displayAmount');
    const displayMethod = document.getElementById('displayMethod');

    // 设置金额和支付方式
    displayAmount.textContent = `¥${amount.toFixed(2)}`;
    
    const methodNames = {
        alipay: '支付宝',
        wechat: '微信支付',
        unionpay: '云闪付'
    };
    displayMethod.textContent = methodNames[method];

    // 显示收款码
    const qrcodeUrl = PAYMENT_QRCODES[method];
    qrcodeContainer.innerHTML = `
        <img src="${qrcodeUrl}" alt="收款码" style="max-width: 300px; width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    `;

    // 显示模态框
    modal.style.display = 'flex';
}

// 关闭收款码模态框
window.closeQrcodeModal = function() {
    const modal = document.getElementById('qrcodeModal');
    modal.style.display = 'none';
};

// 确认支付
window.confirmPayment = async function() {
    try {
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
        
        // 创建充值订单（待审核状态）
        const response = await fetch(`${PAYMENT_API_BASE}/recharge`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: selectedAmount,
                paymentMethod: paymentMethod,
                orderId: currentOrderId
            })
        });

        const result = await response.json();

        if (result.success) {
            // 关闭模态框
            closeQrcodeModal();
            
            // 显示提示
            alert(`充值订单已提交！
订单号：${result.data.orderId}
金额：¥${selectedAmount}

您的充值申请已提交，请等待管理员审核。
审核通过后余额将自动到账。

预计审核时间：1-24小时`);
            
            // 刷新页面数据
            await loadBalance();
            await loadTransactions();
            
            // 重置选择
            selectedAmount = 0;
            currentOrderId = '';
            rechargeBtns.forEach(b => b.classList.remove('selected'));
            customAmountInput.value = '';
            customAmountInput.style.display = 'none';
        } else {
            showError(result.message || '提交订单失败');
        }
    } catch (error) {
        console.error('确认支付错误:', error);
        showError('提交订单失败，请重试');
    }
};

// 模拟支付成功（仅用于演示）
async function mockPaymentSuccess(orderId) {
    try {
        await fetch(`${PAYMENT_API_BASE}/callback`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                orderId: orderId,
                status: 'success'
            })
        });
    } catch (error) {
        console.error('模拟支付错误:', error);
    }
}

// 显示错误消息
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', async function() {
    await loadBalance();
    await loadTransactions();
});
