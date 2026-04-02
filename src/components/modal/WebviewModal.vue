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
      <iframe :src="url" class="webview-iframe" frameborder="0" @load="handleLoad"></iframe>
    </div>
  </div>
</template>

<style scoped>
.webview-modal-container {
  display: flex;
  flex-direction: column;
  height: 90vh; /* 支付同款高度 */
  background: #fff;
  border-radius: 20px 20px 0 0;
  overflow: hidden;
}

.webview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #F2F1F4;
  flex-shrink: 0;
}

.webview-title {
  font-size: 16px;
  font-weight: 700;
  color: #1A1A1A;
}

.webview-close {
  width: 28px;
  height: 28px;
  font-size: 24px;
  color: #999;
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
}

.webview-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.webview-loading {
  position: absolute;
  inset: 0;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.loading-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #FF1AD0;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
