/** 先于桥接解析 URL（含 Bundle 桥标识），再挂载 A0019Bridge */
import '@/utils/net/config'

import { initOptionalVConsole } from '@/utils/debugConsole'
import { installSolidImageFallback } from '@/utils/imageFallback'
import { installFileInputTracker } from '@/utils/native/fileInputTracker'

initOptionalVConsole()
installSolidImageFallback()
installFileInputTracker()

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
/** 尽早挂载 window[桥名]，见 nativeBridgeConfig / URL Bundle / VITE_* */
import '@/utils/native/A0019Bridge'
import './assets/global.css'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { paymentService } from '@/utils/tools/paymentService'
// 引入 Vant
import Vant from 'vant'
import 'vant/lib/index.css'

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(router)
app.use(pinia)
app.use(Vant)
app.mount('#app')

const warmApplePaySdk = () => paymentService.preloadApplePaySdk();
const requestIdleCallback = window.requestIdleCallback;
if (requestIdleCallback) {
    requestIdleCallback(warmApplePaySdk, { timeout: 1500 });
} else {
    globalThis.setTimeout(warmApplePaySdk, 800);
}

// 禁用双指缩放手势
document.addEventListener('gesturestart', function (event) {
    event.preventDefault();
});
// 禁用双击缩放 (可选，由于双击缩放也会触发点击延迟)
let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

const isImageTarget = (target: EventTarget | null) =>
    target instanceof Element && Boolean(target.closest('img'));

const isEditableTarget = (target: EventTarget | null) =>
    target instanceof Element &&
    Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));

document.addEventListener('contextmenu', function (event) {
    if (isImageTarget(event.target) || !isEditableTarget(event.target)) {
        event.preventDefault();
    }
}, true);

document.addEventListener('dragstart', function (event) {
    if (isImageTarget(event.target)) {
        event.preventDefault();
    }
}, true);

document.addEventListener('selectstart', function (event) {
    if (!isEditableTarget(event.target)) {
        event.preventDefault();
    }
}, true);
