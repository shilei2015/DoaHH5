<script setup lang="ts">
import { ref } from 'vue'

const isShowLoading = ref(false)
const toastMessages = ref<{ id: number; text: string }[]>([])

// Expose methods to be called from index.ts
let nextId = 0
const showLoading = () => {
  // 显示 loading 时，清除所有 toast
  toastMessages.value = []
  isShowLoading.value = true
}

const hideLoading = () => {
  isShowLoading.value = false
}

const showToast = (message: string, duration = 2000) => {
  // 显示 toast 时，先隐藏 loading
  isShowLoading.value = false
  
  // 如果希望每次只显示一个 toast，也可以在这里加上 toastMessages.value = []
  // 这里保留多 toast 队列能力，仅互斥 loading
  const id = nextId++
  toastMessages.value.push({ id, text: message })
  setTimeout(() => {
    toastMessages.value = toastMessages.value.filter(msg => msg.id !== id)
  }, duration)
}

defineExpose({
  showLoading,
  hideLoading,
  showToast
})
</script>

<template>
  <div class="hud-wrapper">
    <!-- Loading Mask (Blocking) -->
    <div v-show="isShowLoading" class="hud-mask">
      <div class="loading-box">
        <svg class="spinner" viewBox="0 0 50 50">
          <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="4"></circle>
        </svg>
        <p class="loading-text">Loading...</p>
      </div>
    </div>

    <!-- Toast Container (Non-blocking) -->
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div v-for="item in toastMessages" :key="item.id" class="toast-box">
          {{ item.text }}
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
/*
 hud-wrapper 使用绝对定位确保总在最前面，但内部元素的 pointer-events 是根据情况设置的。
*/
.hud-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  z-index: 99999;
  pointer-events: none;
  /* 让外层不阻挡点击 */
}

/* Loading 遮罩层，必须 pointer-events: auto 才可以阻挡用户的点击 */
.hud-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background:
    linear-gradient(180deg, rgba(26, 26, 26, 0.98) 0%, rgba(26, 26, 26, 0.9) 100%);
  pointer-events: auto;
  /* 阻止交互 */
  display: flex;
  justify-content: center;
  align-items: center;
}

.loading-box {
  min-width: 112px;
  min-height: 112px;
  border-radius: 18px;
  background: rgba(37, 37, 37, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: center;
  align-items: center;
  padding: 18px 20px;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.42);
}

.spinner {
  animation: rotate 2s linear infinite;
  width: 34px;
  height: 34px;
}

.spinner .path {
  stroke: var(--app-accent, #65d941);
  stroke-linecap: round;
  animation: dash 1.5s ease-in-out infinite;
}

.loading-text {
  margin: 0;
  color: var(--app-text-secondary, rgba(255, 255, 255, 0.72));
  font-size: 13px;
  font-weight: 600;
  line-height: 18px;
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }

  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }

  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}

/* Toast Container */
.toast-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  pointer-events: none;
  /* 完全非阻断 */
  width: 80%;
  z-index: 100000;
}

.toast-box {
  background-color: rgba(37, 37, 37, 0.96);
  color: var(--app-text-primary, #ffffff);
  padding: 12px 24px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 15px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
  word-break: break-all;
  max-width: 100%;
  text-align: center;
  pointer-events: none;
}

/* Toast 过渡动画 */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.toast-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
