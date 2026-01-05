/**
 * 启动动画控制器
 * 动画流程：
 * 1. 展示Logo和系统名称 (0-1.5s)
 * 2. 内容收缩变形为进度条 (1.5-2s)
 * 3. 进度条填充动画 (2-4s)
 * 4. 完成后丝滑过渡到登录页 (4-4.8s)
 */

document.addEventListener('DOMContentLoaded', function() {
    const contentWrapper = document.getElementById('contentWrapper');
    const progressWrapper = document.getElementById('progressWrapper');
    const progressFill = document.getElementById('progressFill');
    const splashContainer = document.getElementById('splashContainer');

    // 动画时间配置 (毫秒)
    const TIMING = {
        showContent: 1800,      // Logo展示时间（1.2秒可见 + 动画缓冲）
        collapseContent: 150,   // 内容收缩动画
        progressDuration: 500,  // 进度条填充时间
        completeDelay: 50,      // 完成后等待
        fadeOut: 250            // 淡出动画
    };

    let progress = 0;
    let progressStartTime = null;

    // 阶段1：展示Logo和系统名称
    setTimeout(startCollapse, TIMING.showContent);

    // 阶段2：内容收缩，显示进度条
    function startCollapse() {
        contentWrapper.classList.add('collapse');
        
        setTimeout(() => {
            progressWrapper.classList.add('show');
            startProgress();
        }, TIMING.collapseContent);
    }

    // 阶段3：进度条动画
    function startProgress() {
        progressStartTime = performance.now();
        requestAnimationFrame(updateProgress);
    }

    function updateProgress(currentTime) {
        if (!progressStartTime) progressStartTime = currentTime;
        
        const elapsed = currentTime - progressStartTime;
        progress = Math.min((elapsed / TIMING.progressDuration) * 100, 100);
        
        // 使用缓动函数让进度更自然
        const easedProgress = easeOutQuart(progress / 100) * 100;
        
        progressFill.style.width = easedProgress + '%';

        if (progress < 100) {
            requestAnimationFrame(updateProgress);
        } else {
            onProgressComplete();
        }
    }

    // 缓动函数 - 开始快，结束慢
    function easeOutQuart(x) {
        return 1 - Math.pow(1 - x, 4);
    }

    // 阶段4：完成后丝滑过渡
    function onProgressComplete() {
        progressWrapper.classList.add('complete');
        
        setTimeout(() => {
            // 淡出动画
            splashContainer.classList.add('fade-out');
            
            // 跳转到登录页
            setTimeout(() => {
                window.location.href = 'login.html';
            }, TIMING.fadeOut);
        }, TIMING.completeDelay);
    }
});
