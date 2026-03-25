<script setup lang="ts">
import { computed } from 'vue';
import SVGAComponent from './SVGAComponent.vue';

/**
 * AnimationPlayer.vue
 * 混合格式统一播放器：自动识别 .svga 或 .gif 并选择最优渲染引擎
 */

const props = defineProps<{
  src: string;
  loop?: boolean | number;
  clearsAfterStop?: boolean;
}>();

const emit = defineEmits<{
  (e: 'finished'): void;
}>();

// 自动处理 URL 协议，尝试解决混合内容 (Mixed Content) 拦截问题
const processedSrc = computed(() => {
  if (!props.src) return '';
  if (props.src.startsWith('http://')) {
    return props.src.replace('http://', 'https://');
  }
  return props.src;
});

// 简单的后缀识别逻辑
const isSVGA = computed(() => {
  const url = processedSrc.value;
  return url && (url.toLowerCase().endsWith('.svga') || url.toLowerCase().endsWith('.zz'));
});

// 处理 SVGA 循环次数类型
const svgaLoopCount = computed(() => {
  if (typeof props.loop === 'number') return props.loop;
  return props.loop === false ? 1 : 0; // false 播一次，否则默认 0 (无限)
});

</script>

<template>
  <div class="animation-player-wrap">
    <!-- SVGA 渲染路径 -->
    <SVGAComponent 
      v-if="isSVGA" 
      :url="processedSrc" 
      :loop="svgaLoopCount" 
      :clears-after-stop="props.clearsAfterStop"
      @finished="emit('finished')" 
      class="renderer-full" 
    />

    <!-- GIF 渲染路径 -->
    <img v-else :src="processedSrc" class="renderer-full gif-img" alt="animation" />
  </div>
</template>

<style scoped>
.animation-player-wrap {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.renderer-full {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.gif-img {
  display: block;
}
</style>
