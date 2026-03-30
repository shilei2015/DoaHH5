<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps<{
    refreshing: boolean;
    loading: boolean;
    finished?: boolean;
    isEmpty?: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:refreshing', value: boolean): void;
    (e: 'update:loading', value: boolean): void;
    (e: 'refresh'): void;
    (e: 'load-more'): void;
}>();

// ======== 下拉刷新与上拉加载逻辑 ========
const containerRef = ref<HTMLElement | null>(null);
const pullDistance = ref(0);
const startY = ref(0);
const REFRESH_THRESHOLD = 60; // 触发刷新的下拉高度 (px)

// 触摸事件 (用于计算下拉)
const handleTouchStart = (e: TouchEvent) => {
    if (props.refreshing) return;
    const scrollTop = containerRef.value?.scrollTop ?? 0;
    if (scrollTop <= 0) {
        startY.value = e.touches[0]?.clientY || 0;
    } else {
        startY.value = 0; // 若不在顶部则不处理下拉
    }
};

const handleTouchMove = (e: TouchEvent) => {
    if (props.refreshing || startY.value === 0) return;
    const currentY = e.touches[0]?.clientY || 0;
    const diff = currentY - startY.value;

    if (diff > 0) {
        // 在顶部下拉时添加阻力以控制滑动距离
        if (e.cancelable) e.preventDefault();
        pullDistance.value = Math.min(diff * 0.4, 100);
    }
};

const handleTouchEnd = () => {
    if (props.refreshing || startY.value === 0) return;

    if (pullDistance.value >= REFRESH_THRESHOLD) {
        // 达到阈值，开始刷新
        emit('update:refreshing', true);
        pullDistance.value = REFRESH_THRESHOLD;
        emit('refresh');
    } else {
        // 未达阈值，直接回弹
        pullDistance.value = 0;
    }
    startY.value = 0;
};

// 监听外界状态变化回弹页面
watch(() => props.refreshing, (newVal) => {
    if (!newVal) {
        pullDistance.value = 0;
    }
});

// 滚动到底部事件 (用于计算加载更多)
// 监听容器自身滚动，因为父级使用了 height:100vh + overflow-y:auto，
// 滚动不在 window 上发生。
const handleScroll = () => {
    if (props.loading || props.refreshing || props.finished || props.isEmpty) return;
    const el = containerRef.value;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    // 距离底部少于 150px 时触发加载更多
    if (scrollTop + clientHeight >= scrollHeight - 150) {
        emit('update:loading', true);
        emit('load-more');
    }
};

onMounted(() => {
    containerRef.value?.addEventListener('scroll', handleScroll, { passive: true });
});

onUnmounted(() => {
    containerRef.value?.removeEventListener('scroll', handleScroll);
});
</script>

<template>
    <div ref="containerRef" class="scroll-list-container" @touchstart="handleTouchStart" @touchmove="handleTouchMove"
        @touchend="handleTouchEnd">
        <!-- 下拉包裹层，实现列表被拉下的效果 -->
        <div class="pull-container" :style="{
            transform: `translateY(${pullDistance}px)`,
            transition: props.refreshing || pullDistance === 0 ? 'transform 0.3s ease' : 'none'
        }">

            <!-- 头部隐藏的刷新指示器，展示菊花图 -->
            <!-- 将位置下移并根据拉伸距离显示透明度，以便其不会被系统刘海挡住 -->
            <div class="refresh-indicator"
                :style="{ opacity: props.refreshing ? 1 : Math.max(0, (pullDistance - 10) / 40) }">
                <div class="sl-spinner" v-show="pullDistance > 0 || props.refreshing"></div>
            </div>

            <!-- 插槽区，放置真正的页面内容 -->
            <slot></slot>

            <!-- 空页面状态 -->
            <div v-if="props.isEmpty" class="empty-container">
                <img src="@/assets/comm/comm-no-more-data.svg" alt="No data" class="empty-icon" />
            </div>

            <!-- 底部加载更多指示器 -->
            <div class="load-more-indicator" v-if="props.loading && !props.isEmpty">
                <div class="sl-spinner small-spinner"></div>
            </div>

            <!-- 已完成全部加载提示 -->
            <!-- <div class="finished-indicator" v-else-if="props.finished">
                <span>No more data</span>
            </div> -->
        </div>
    </div>
</template>

<style scoped>
.scroll-list-container {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
}

.pull-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 100%;
    position: relative;
    will-change: transform;
}

.empty-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    /* padding-top: 100px; */
    /* Adjust based on navbar height if needed */
}

.empty-icon {
    width: 200px;
    height: auto;
}

/* 下拉刷新指示器区 */
.refresh-indicator {
    position: absolute;
    top: 10px;
    /* 改为 10px，使其在拉下来后正好出现在标题与刘海的空隙间 */
    left: 0;
    width: 100%;
    height: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10;
    pointer-events: none; /* 防止遮挡下方内容的点击 */
}

/* 加载更多指示器 */
.load-more-indicator {
    width: 100%;
    height: 60px;
    display: flex;
    justify-content: center;
    align-items: center;
    padding-bottom: 20px;
    pointer-events: none; /* 防止拦截点击 */
}

.finished-indicator {
    width: 100%;
    height: 60px;
    display: flex;
    justify-content: center;
    align-items: center;
    padding-bottom: 20px;
    font-size: 14px;
    color: #b3b3b3;
    font-style: italic;
}

/* 专属的 Spinner 旋转动画样式，加上 sl- 前缀防全局污染 */
.sl-spinner {
    width: 28px;
    height: 28px;
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-top-color: #ff1ad0;
    border-radius: 50%;
    animation: sl-spin 0.8s linear infinite;
}

.small-spinner {
    width: 22px;
    height: 22px;
    border-width: 2px;
}

@keyframes sl-spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
