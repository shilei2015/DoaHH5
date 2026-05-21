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
import router, { preloadInteractiveRoutes } from './router'
/** 尽早挂载 window[桥名]，见 nativeBridgeConfig / URL Bundle / VITE_* */
import '@/utils/native/A0019Bridge'
import './assets/global.css'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { paymentService } from '@/utils/tools/paymentService'
import {
    Cell,
    CellGroup,
    Field,
    Icon,
    Loading,
    Picker,
    Popup,
    SwipeCell,
    Uploader,
} from 'vant'
import 'vant/es/cell/style'
import 'vant/es/cell-group/style'
import 'vant/es/field/style'
import 'vant/es/icon/style'
import 'vant/es/image-preview/style'
import 'vant/es/loading/style'
import 'vant/es/picker/style'
import 'vant/es/popup/style'
import 'vant/es/swipe-cell/style'
import 'vant/es/toast/style'
import 'vant/es/uploader/style'

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(router)
app.use(pinia)
app.use(Cell)
app.use(CellGroup)
app.use(Field)
app.use(Icon)
app.use(Loading)
app.use(Picker)
app.use(Popup)
app.use(SwipeCell)
app.use(Uploader)
app.mount('#app')

const warmApplePaySdk = () => paymentService.preloadApplePaySdk();
const warmInteractiveRoutes = () => preloadInteractiveRoutes();
const requestIdleCallback = window.requestIdleCallback;
if (requestIdleCallback) {
    requestIdleCallback(warmApplePaySdk, { timeout: 1500 });
    requestIdleCallback(warmInteractiveRoutes, { timeout: 2500 });
} else {
    globalThis.setTimeout(warmApplePaySdk, 800);
    globalThis.setTimeout(warmInteractiveRoutes, 1200);
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
