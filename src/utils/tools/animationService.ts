import { h, render, markRaw } from 'vue';
import GlobalFullScreenAnimation from '@/components/common/GlobalFullScreenAnimation.vue';

/**
 * Global Animation Service
 * 专门用于在 body 下创建全屏、透明、不阻塞交互的动画层
 */

let container: HTMLElement | null = null;

/**
 * 演示：在屏幕上播放一个全屏特效动画
 * @param url .svga 或 .zz 文件的 URL
 * @param onAnimationEnd 动画播放结束后的可选回调
 */
export function showFullScreenAnimation(url: string, onAnimationEnd?: () => void) {
    // 1. 如果已有动画容器，先清理强制排队 (单例播放，防止多重开销)
    if (container) {
        render(null, container);
        container.remove();
        container = null;
    }

    // 2. 创建 DOM 容器并挂载
    container = document.createElement('div');
    // 设置外层容器也具备穿透能力，双重保险
    container.style.pointerEvents = 'none';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.zIndex = '99999';
    document.body.appendChild(container);

    // 3. 构建并渲染
    const vnode = h(markRaw(GlobalFullScreenAnimation), {
        url,
        onClose: () => {
            // 收到组件内部的销毁通知
            if (container) {
                render(null, container);
                container.remove();
                container = null;
            }
            if (onAnimationEnd) onAnimationEnd();
        }
    });

    render(vnode, container);

    return {
        close: () => {
            if (container) {
                render(null, container);
                container.remove();
                container = null;
            }
        }
    };
}
