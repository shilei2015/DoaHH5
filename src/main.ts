import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/global.css'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(router)
app.use(pinia)
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