<script setup lang="ts">
import { computed } from 'vue';
import SVGAComponent from './SVGAComponent.vue';

/**
 * AnimationPlayer.vue
 * 统一播放器：自动识别 SVGA/ZZ 或 普通图片（PNG/JPG/GIF）并选择最优渲染引擎
 */

const props = defineProps<{
  src: string;
  loop?: boolean | number;
  clearsAfterStop?: boolean;
}>();

const emit = defineEmits<{
  (e: 'finished'): void;
  (e: 'load'): void; // 图片加载完成事件，透传给父组件
}>();

const processedSrc = computed(() => {
  if (!props.src) return '';
  return props.src;
});

// 识别是否为 SVGA 资源
const isSVGA = computed(() => {
  const url = processedSrc.value;
  if (!url) return false;
  const cleanPath = (url.split('?')[0] || '').toLowerCase();
  return cleanPath.endsWith('.svga') || cleanPath.endsWith('.zz');
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
    <SVGAComponent v-if="isSVGA" :url="processedSrc" :loop="svgaLoopCount" :clears-after-stop="props.clearsAfterStop"
      @finished="emit('finished')" class="renderer-full" />

    <!-- 普通图片及 GIF 渲染路径 -->
    <img v-else :src="processedSrc" class="renderer-full image-item" @load="emit('load')" alt="animation" />
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
  object-fit: cover;
}

.image-item {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
