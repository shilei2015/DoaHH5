import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 估算软键盘从底部遮挡的高度（px），用于给页面底部留白，避免输入框被盖住。
 * 依赖 Visual Viewport API，在 iOS Safari / Android WebView 上随键盘动画更新。
 */
export function useKeyboardInset() {
    const insetPx = ref(0)

    function update() {
        if (typeof window === 'undefined') return
        const vv = window.visualViewport
        if (!vv) {
            insetPx.value = 0
            return
        }
        const bottomHidden = window.innerHeight - vv.offsetTop - vv.height
        insetPx.value = Math.max(0, Math.round(bottomHidden))
    }

    onMounted(() => {
        update()
        const vv = window.visualViewport
        vv?.addEventListener('resize', update)
        vv?.addEventListener('scroll', update)
        window.addEventListener('resize', update)
    })

    onUnmounted(() => {
        const vv = window.visualViewport
        vv?.removeEventListener('resize', update)
        vv?.removeEventListener('scroll', update)
        window.removeEventListener('resize', update)
    })

    return { insetPx, update }
}
