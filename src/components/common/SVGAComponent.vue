<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue';
import { Downloader, Parser, Player } from 'svga.lite';
import { normalizeImageCdnUrl } from '@/utils/imageFallback';

/**
 * SVGA 单例管理 (单文件组件作用域外)
 * 将下载器、解析器和解析后的对象缓存放在外部，所有组件实例共享，大幅节省内存
 */
const sharedDownloader = new Downloader();
const sharedParser = new Parser();
const videoItemCache = new Map<string, any>(); // URL -> VideoEntity 缓存

/**
 * SVGAComponent.vue (Lite版)
 * 使用更轻量的 svga.lite 核心库，API 更加简洁直观
 */

const props = defineProps<{
  url: string;
  loop?: number; // 0 为无限循环，默认为 0
}>();

const emit = defineEmits<{
  (e: 'finished'): void;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const normalizedUrl = computed(() => normalizeImageCdnUrl(props.url));
let svgaPlayer: Player | null = null;

const initSVGA = async () => {
  const url = normalizedUrl.value;
  if (!canvasRef.value || !url) return;

  try {
    // 实例化当前组件的播放器
    if (!svgaPlayer) {
      svgaPlayer = new Player(canvasRef.value);
      // 关键修正：直接使用字符串 'end' 以免 runtime 报错 undefined
      svgaPlayer.$on('end' as any, () => {
        emit('finished');
      });
    }

    // 尝试从内存缓存获取解析后的数据
    let videoItem = videoItemCache.get(url);

    if (!videoItem) {
      // 缓存未命中，执行下载和解析
      const fileData = await sharedDownloader.get(url);
      videoItem = await sharedParser.do(fileData);
      videoItemCache.set(url, videoItem); // 写入缓存
      console.log('[SVGA Cache] Parsed & Cached:', url);
    } else {
      console.log('[SVGA Cache] Hit:', url);
    }

    // 停止并清理当前状态
    svgaPlayer.clear();

    // 配置播放参数
    // 修正：直接使用字符串常量，补全缺省参数
    svgaPlayer.set({
      loop: props.loop === 1 ? 1 : 0, // 0 为无限循环
      fillMode: 'forwards' as any,
      playMode: 'forwards' as any,
      cacheFrames: true,
      intersectionObserverRender: true
    });

    // 挂载并播放
    await svgaPlayer.mount(videoItem);
    svgaPlayer.start();

    console.log('[SVGA Lite] Started:', url);
  } catch (err) {
    console.error('[SVGA Lite] Shared Error:', err, 'URL:', url);
  }
};

onMounted(() => {
  nextTick(() => {
    initSVGA();
  });
});

onUnmounted(() => {
  if (svgaPlayer) {
    svgaPlayer.destroy();
    svgaPlayer = null;
  }
});

// 监听 URL 变化自动重播
watch(normalizedUrl, (newUrl) => {
  if (newUrl) {
    initSVGA();
  }
});
</script>

<template>
  <div class="svga-player-wrap">
    <canvas ref="canvasRef" class="svga-canvas"></canvas>
  </div>
</template>

<style scoped>
.svga-player-wrap {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.svga-canvas {
  width: 100%;
  height: 100%;
  /* svga.lite 会自动处理 Canvas 比例，配合 contain 即可完美居中 */
  object-fit: cover;
}
</style>
