<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import SVGA from 'svgaplayerweb';

/**
 * SVGAComponent.vue
 * 封装 SVGAPlayerWeb 的底层渲染逻辑，提供简单的 URL 驱动接口
 */

const props = defineProps<{
  url: string;
  loop?: number; // 0 为无限循环，默认为 0
  clearsAfterStop?: boolean; // 播放结束后是否清理 Canvas
}>();

const emit = defineEmits<{
  (e: 'finished'): void;
}>();

const svgaContainer = ref<HTMLDivElement | null>(null);
let player: any = null;
let parser: any = null;

const initSVGA = () => {
  if (!svgaContainer.value) return;
  
  // 初始化播放器和解析器
  player = new SVGA.Player(svgaContainer.value);
  parser = new SVGA.Parser();
  
  player.loops = props.loop ?? 0;
  player.clearsAfterStop = props.clearsAfterStop ?? false;

  // 监听播放完成
  player.onFinished(() => {
    emit('finished');
  });

  // 加载并播放
  parser.load(props.url, (videoItem: any) => {
    player.setVideoItem(videoItem);
    player.startAnimation();
  }, (err: any) => {
    console.error('[SVGA] Load failed:', err, 'URL:', props.url);
  });
};

onMounted(() => {
  initSVGA();
});

onUnmounted(() => {
  if (player) {
    player.stopAnimation();
    player = null;
  }
  parser = null;
});

// 监听 URL 变化自动重播
watch(() => props.url, (newUrl) => {
  if (newUrl && player) {
    player.stopAnimation();
    initSVGA();
  }
});
</script>

<template>
  <div ref="svgaContainer" class="svga-player-canvas"></div>
</template>

<style scoped>
.svga-player-canvas {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(canvas) {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
</style>
