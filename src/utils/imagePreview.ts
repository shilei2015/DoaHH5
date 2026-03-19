import { createVNode, render } from 'vue';
import ImagePreviewComponent from '@/components/ImagePreview/ImagePreview.vue';

/**
 * 显示大图预览
 * @param images 图片 URL 数组
 * @param startPosition 初始显示的图片索引（默认0）
 */
export const showImagePreview = (images: string[], startPosition = 0) => {
    // 渲染容器
    const container = document.createElement('div');
    document.body.appendChild(container);

    const closeHandler = () => {
        // 销毁组件和 DOM 元素
        render(null, container);
        container.remove();
    };

    // 创建虚拟节点并挂载 props
    const vnode = createVNode(ImagePreviewComponent, {
        images,
        startPosition,
        onClose: closeHandler
    });

    // 将虚拟节点渲染到 DOM 中
    render(vnode, container);
};
