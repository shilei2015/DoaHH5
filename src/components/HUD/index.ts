import { createVNode, render } from 'vue'
import HUDComponent from './HUD.vue'

let instance: any = null

const initHUD = () => {
    if (instance) return instance

    const vnode = createVNode(HUDComponent)
    const container = document.createElement('div')
    // 渲染虚拟节点至真实 DOM
    render(vnode, container)
    // 将其内部真正渲染的 HTML 元素追加至 body 保证它脱离当前组件流
    document.body.appendChild(container.firstElementChild!)

    // 获取组件中 exposes 的方法
    instance = vnode.component?.exposed
    return instance
}

export const HUD = {
    showLoading() {
        const hud = initHUD()
        if (hud) {
            hud.showLoading()
        }
    },
    hideLoading() {
        const hud = initHUD()
        if (hud) {
            hud.hideLoading()
        }
    },
    showToast(message: string, duration = 2000) {
        if (message && message.length > 0 && duration > 0) {
            const hud = initHUD()
            if (hud) {
                hud.showToast(message, duration)
            }
        }
    }
}

export default HUD;
