<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';

const props = defineProps<{
    images: string[];
    startPosition?: number;
    onClose?: () => void;
}>();

const activeIndex = ref(props.startPosition || 0);
const scrollRef = ref<HTMLElement | null>(null);

const handleScroll = () => {
    if (scrollRef.value) {
        const index = Math.round(scrollRef.value.scrollLeft / scrollRef.value.clientWidth);
        activeIndex.value = index;
    }
};

const close = () => {
    if (props.onClose) {
        props.onClose();
    }
};

onMounted(() => {
    if (props.startPosition && scrollRef.value) {
        nextTick(() => {
            if (scrollRef.value) {
                // 跳转到指定位置
                scrollRef.value.scrollLeft = scrollRef.value.clientWidth * (props.startPosition || 0);
            }
        });
    }
});
</script>

<template>
    <div class="image-preview-overlay" @click="close">
        <div class="scroll-wrapper" ref="scrollRef" @scroll="handleScroll" @click.stop>
            <div class="slide-item" v-for="(img, idx) in images" :key="idx" @click="close">
                <img :src="img" alt="Preview Image" />
            </div>
        </div>
        
        <div class="indicator" v-if="images.length > 1">
            {{ activeIndex + 1 }} / {{ images.length }}
        </div>
    </div>
</template>

<style scoped>
.image-preview-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 99999;
    background: var(--app-overlay-background-strong);
    backdrop-filter: var(--app-overlay-blur);
    -webkit-backdrop-filter: var(--app-overlay-blur);
    display: flex;
    flex-direction: column;
    animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

.scroll-wrapper {
    flex: 1;
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
}

.scroll-wrapper::-webkit-scrollbar {
    display: none;
}

.slide-item {
    flex: 0 0 100vw;
    width: 100vw;
    height: 100%;
    scroll-snap-align: start;
    display: flex;
    align-items: center;
    justify-content: center;
}

.slide-item img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

.indicator {
    position: absolute;
    top: max(40px, env(safe-area-inset-top, 40px));
    left: 0;
    right: 0;
    text-align: center;
    color: white;
    font-size: 16px;
    font-weight: 500;
    font-family: system-ui, -apple-system, sans-serif;
    pointer-events: none;
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
    letter-spacing: 2px;
}
</style>
