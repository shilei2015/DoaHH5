import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
/** 尽早挂载 window.A0019，避免仅依赖路由分包时原生 evaluateJavaScript 早于桥接注册 */
import '@/utils/native/A0019Bridge'
import './assets/global.css'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
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