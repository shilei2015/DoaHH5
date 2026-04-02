import { h, render, markRaw, type Component, type VNode } from 'vue';
import BasePopup from '@/components/common/BasePopup.vue';
import UserActionModal from '@/components/modal/UserActionModal.vue';
import ReportModal from '@/components/modal/ReportModal.vue';
import BlackListConfirmModal from '@/components/modal/BlackListConfirmModal.vue';
import ExitCallConfirmModal from '@/components/modal/ExitCallConfirmModal.vue';
import EvaluateCallModal from '@/components/modal/EvaluateCallModal.vue';
import WebviewModal from '@/components/modal/WebviewModal.vue';

/**
 * Global Modal Service
 * 实现命令式组件弹窗，支持全屏半透遮罩及圆角规范
 */

let container: HTMLElement | null = null;

interface ModalOptions {
    position?: 'bottom' | 'center' | 'top' | 'left' | 'right';
    round?: boolean;
    closeOnClickOverlay?: boolean;
    customStyle?: Record<string, string>;
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
    // 1. 如果已有弹窗在显示，先强制清理之前的渲染
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

    // 4. Build the vnode factory
    const createVNode = (visible: boolean) => h(BasePopup, {
        show: visible,
        ...options,
        'onUpdate:show': (val: boolean) => {
            if (!val) close();
        }
    }, {
        default: () => h(markRaw(component), {
            ...props,
            onClose: close,
        })
    });

    // 5. First render with show=false, then flip to true on next frame
    render(createVNode(false), container);
    requestAnimationFrame(() => {
        if (container) {
            render(createVNode(true), container);
        }
    });

    return { close };
}

/**
 * 【业务封装】弹出通用的“举报/拉黑”操作表
 * @param targetUserId 目标用户ID
 * @param callbacks 包含拉黑和举报成功后的事件回调
 */
export function showUserActionModal(targetUserId: string, callbacks: {
    onBlacklistSuccess?: () => void,
    onReportSuccess?: () => void
}) {
    return showModal(UserActionModal, {
        // 第一级：底部菜单点击 Blacklist
        onBlacklist: () => {
            showModal(BlackListConfirmModal, {
                targetUserId,
                onSuccess: () => {
                    if (callbacks.onBlacklistSuccess) callbacks.onBlacklistSuccess();
                }
            }, { position: 'center', round: true });
        },
        // 第一级：底部菜单点击 Report
        onReport: () => {
            showModal(ReportModal, {
                targetUserId,
                onSuccess: () => {
                    if (callbacks.onReportSuccess) callbacks.onReportSuccess();
                }
            }, { position: 'center', round: true });
        }
    }, {
        position: 'bottom',
        round: true,
        customStyle: {
            background: 'transparent'
        }
    });
}

/**
 * 弹出退出通话确认弹窗
 */
export function showExitCallConfirmModal(onConfirm: () => void) {
    return showModal(ExitCallConfirmModal, {
        onConfirm: onConfirm
    }, {
        position: 'center',
        round: true
    });
}

/**
 * 弹出显示视频评价弹窗
 */
export function showEvaluateCallModal(props: {
    targetAvatar: string,
    targetName: string,
    callDuration: string,
    targetUserId: string,
    liveId: string
}) {
    return showModal(EvaluateCallModal, {
        targetAvatar: props.targetAvatar,
        targetName: props.targetName,
        callDuration: props.callDuration,
        targetUserId: props.targetUserId,
        liveId: props.liveId
    }, {
        position: 'center',
        round: true,
        closeOnClickOverlay: false
    });
}

/**
 * 弹出显示一个网页内容 (支付同款弹窗)
 */
export function showWebviewModal(title: string, url: string) {
    return showModal(WebviewModal, {
        title: title,
        url: url
    }, {
        position: 'bottom',
        round: true,
        customStyle: {
            height: '90vh'
        }
    });
}
