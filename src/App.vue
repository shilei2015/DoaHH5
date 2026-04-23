<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const transitionName = ref('push');

import { notificationService } from '@/utils/tools/notificationService';
import FlashNotification from '@/components/Notification/FlashNotification.vue';

const ns = notificationService.state;
const onNotificationClose = () => {
    notificationService.hide();
};

onMounted(() => {
})

// --- 侧滑返回（从左缘向右滑）：用捕获阶段优先于内部 scroll，避免聊天页等全宽列表吞掉手势 ---
const EDGE_PX = 40;
const startX = ref(0);
const startY = ref(0);

const handleTouchStart = (e: TouchEvent) => {
    const depth = Number(route.meta.depth || 0);
    const touch = e.touches[0];
    if (touch && depth > 20 && touch.clientX < EDGE_PX) {
        startX.value = touch.clientX;
        startY.value = touch.clientY;
    } else {
        startX.value = 0;
    }
};

const handleTouchEnd = (e: TouchEvent) => {
    if (startX.value <= 0) return;

    const touch = e.changedTouches[0];
    if (!touch) return;

    const deltaX = touch.clientX - startX.value;
    const deltaY = Math.abs(touch.clientY - startY.value);

    if (deltaX > 80 && deltaY < 60) {
        router.back();
    }
    startX.value = 0;
};


// 路由记录：处理前进后退的方向判断
watch(() => route.meta.depth, (toDepth, fromDepth) => {
    // 首次进入没有 fromDepth
    const to = Number(toDepth || 0);
    const from = Number(fromDepth || 0);

    if (to > from) {
        transitionName.value = 'push';
    } else if (to < from) {
        transitionName.value = 'pop';
    } else {
        // 同级或未知，默认 push
        transitionName.value = 'push';
    }
});

</script>

<template>
    <div class="app-container" @touchstart.capture="handleTouchStart" @touchend.capture="handleTouchEnd">
        <!-- Global Message Flash Banner -->
        <FlashNotification v-if="ns.visible && ns.data" :data="ns.data" @close="onNotificationClose" />

        <router-view v-slot="{ Component, route }">
            <!-- 使用 transition 包裹，并配合 keep-alive 固化旧页面状态 -->
            <!-- 限制 keep-alive 仅包含 mainTabbarView，确保三级以上的页面 (如详情页) 每次进入都是新的 -->
            <!-- 使用稳定的 key 让所有 Tab 子页面共享同一个 mainTabbarView 实例 -->
            <transition :name="transitionName">
                <keep-alive include="mainTabbarView">
                    <component :is="Component" :key="Number(route.meta.depth || 0) <= 20 ? 'tab-root' : route.fullPath"
                        class="page-view" />
                </keep-alive>
            </transition>
        </router-view>
    </div>
</template>

<style>
/* 根容器，接割手势监听 */
.app-container {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    position: relative;
}

/* 全局基础页面容器：白底 + 顶/底与安全区渐变，与原生壳 #141414 衔接 */
.page-view {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transition: transform 0.4s cubic-bezier(0.3, 0.8, 0.3, 1), opacity 0.4s ease;
    overflow: hidden;
    z-index: 1;
    background-color: #fff;
    background-image:
        linear-gradient(180deg, #141414 0%, rgba(255, 255, 255, 0) 100%),
        linear-gradient(0deg, #141414 0%, rgba(255, 255, 255, 0) 100%);
    background-size:
        100% calc(env(safe-area-inset-top, 0px) + 44px),
        100% calc(env(safe-area-inset-bottom, 0px) + 28px);
    background-position: top, bottom;
    background-repeat: no-repeat;
}

/* --- Push (前进) 动画 --- */

/* 新页面进来 */
.push-enter-from {
    transform: translateX(100%);
    z-index: 2;
}

.push-enter-to {
    transform: translateX(0);
}

/* 旧页面离开 */
.push-leave-from {
    transform: translateX(0);
}

.push-leave-to {
    transform: translateX(-25%);
}

/* --- Pop (后退) 动画 --- */

/* 回到旧页面 */
.pop-enter-from {
    transform: translateX(-25%);
}

.pop-enter-to {
    transform: translateX(0);
}

/* 当前页面滑出 */
.pop-leave-from {
    transform: translateX(0);
    z-index: 2;
}

.pop-leave-to {
    transform: translateX(100%);
}

html {
    background-color: #ffffff;
}

/* 白色背景，橡皮筋露底时不出现白边 */
body {
    overflow: hidden;
    margin: 0;
    padding: 0;
    width: 100vw;
    height: 100vh;
    background-color: #ffffff;
}
</style>
