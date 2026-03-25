import { h, render, markRaw, type Component, type VNode } from 'vue';
import BasePopup from '@/components/common/BasePopup.vue';

/**
 * Global Modal Service
 * 实现命令式组件弹窗，支持全屏半透遮罩及圆角规范
 */

let container: HTMLElement | null = null;

interface ModalOptions {
    position?: 'bottom' | 'center' | 'top' | 'left' | 'right';
    round?: boolean;
    // ... 其他基于 van-popup 的透传属性
}

/**
 * 弹出显示一个组件
 * @param component 业务组件
 * @param props 传给业务组件的 props (注意：子组件应能发出 @close 事件)
 * @param options 弹窗容器配置
 */
export function showModal(
    component: Component,
    props: any = {},
    options: ModalOptions = {}
) {
    // 1. 如果已有弹窗在显示，先强制清理之前的渲染（支持多重弹窗可进一步扩展，此处为单例模式）
    if (container) {
        render(null, container);
        container.remove();
        container = null;
    }

    // 2. 创建 DOM 容器并挂载
    container = document.createElement('div');
    document.body.appendChild(container);

    // 3. 定义辅助函数用于关闭弹窗并播放退出动画
    const close = () => {
        if (!container) return;
        
        const vnode = h(BasePopup, {
            show: false, // 设为 false 触发 Vant 动画
            ...options,
            onClosed: () => {
                // 动画结束后的彻底清理
                if (container) {
                    render(null, container);
                    container.remove();
                    container = null;
                }
            }
        });
        render(vnode, container);
    };

    // 4. 构建 VNode 并初始渲染
    const vnode = h(BasePopup, {
        show: true,
        ...options,
        'onUpdate:show': (val: boolean) => {
            if (!val) close();
        }
    }, {
        // 使用插槽渲染业务组件
        default: () => h(markRaw(component), {
            ...props,
            onClose: close, // 约定：子组件只需发出 close 事件即能自我关闭
        })
    });

    render(vnode, container);

    return { close };
}
