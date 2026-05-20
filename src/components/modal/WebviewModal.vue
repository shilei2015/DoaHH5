<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  title: string;
  url: string;
}>();

const emit = defineEmits(['close']);
const isLoading = ref(true);

const handleLoad = () => {
  isLoading.value = false;
};

const handleClose = () => {
  emit('close');
};
</script>

<template>
  <div class="webview-modal-container">
    <div class="webview-header">
      <span class="webview-title">{{ title }}</span>
      <button class="webview-close" @click="handleClose">&times;</button>
    </div>
    <div class="webview-body">
      <div v-if="isLoading" class="webview-loading">
        <div class="loading-spinner"></div>
      </div>
      <iframe
        :src="url"
        class="webview-iframe"
        frameborder="0"
        @load="handleLoad"
      ></iframe>
    </div>
  </div>
</template>

<style scoped>
.webview-modal-container {
  display: flex;
  flex-direction: column;
  height: 90vh; /* 支付同款高度 */
  background: var(--app-bg, #1a1a1a);
  border-radius: 20px 20px 0 0;
  overflow: hidden;
  overscroll-behavior: none;
}

.webview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: var(--app-bg, #1a1a1a);
  border-bottom: 1px solid var(--app-line, rgba(255, 255, 255, 0.08));
  flex-shrink: 0;
}

.webview-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--app-text-primary, #ffffff);
}

.webview-close {
  width: 28px;
  height: 28px;
  font-size: 24px;
  color: var(--app-text-secondary, rgba(255, 255, 255, 0.72));
  background: none;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.webview-body {
  flex: 1;
  position: relative;
  width: 100%;
  overflow: hidden;
  background: var(--app-bg, #1a1a1a);
  overscroll-behavior: none;
  -webkit-overflow-scrolling: auto;
}

.webview-iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: none;
  background: var(--app-bg, #1a1a1a) !important;
  color-scheme: dark;
  overscroll-behavior: none;
}

.webview-loading {
  position: absolute;
  inset: 0;
  background: var(--app-bg, #1a1a1a);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.loading-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(255, 255, 255, 0.16);
  border-top: 3px solid var(--app-accent, #65d941);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
