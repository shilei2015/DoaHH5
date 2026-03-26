<script setup lang="ts">
import { ref, onMounted } from 'vue';
import SVGAComponent from './SVGAComponent.vue';

/**
 * GlobalFullScreenAnimation.vue
 * 专用于全屏特效播放的纯粹组件，无背景、无交互拦截、播放完自动回调销毁
 */
const props = defineProps<{
  url: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const isShow = ref(true);

const onAnimationFinished = () => {
  isShow.value = false;
  // 延迟一小会儿确保动画消失状态同步后再通知外部销毁 DOM
  setTimeout(() => {
    emit('close');
  }, 100);
};

</script>

<template>
  <div v-if="isShow" class="global-animation-container">
    <div class="animation-stage">
      <SVGAComponent 
        :url="props.url" 
        :loop="1" 
        @finished="onAnimationFinished" 
      />
    </div>
  </div>
</template>

<style scoped>
.global-animation-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 10000;
  /* 核心设置：穿透所有交互，不影响底层页面的聊天、点击等操作 */
  pointer-events: none; 
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  overflow: hidden;
}

.animation-stage {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
