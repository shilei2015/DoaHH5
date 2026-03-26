<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const transitionName = ref('push');

// --- 右滑返回逻辑 ---
const startX = ref(0);
const startY = ref(0);

const handleTouchStart = (e: TouchEvent) => {
    // 只有在非主页（depth > 20）且从屏幕左侧边缘（30px内）触发时才生效
    const depth = Number(route.meta.depth || 0);
    const touch = e.touches[0];
    if (touch && depth > 20 && touch.pageX < 30) {
        startX.value = touch.pageX;
        startY.value = touch.pageY;
    } else {
        startX.value = 0;
    }
};

const handleTouchEnd = (e: TouchEvent) => {
    if (startX.value <= 0) return;

    const touch = e.changedTouches[0];
    if (!touch) return;

    const deltaX = touch.pageX - startX.value;
    const deltaY = Math.abs(touch.pageY - startY.value);

    // 判定条件：横向滑动距离 > 80 且 比较水平（纵向偏移小）
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
    <div class="app-container" @touchstart="handleTouchStart" @touchend="handleTouchEnd">
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

/* 全局基础页面容器样式，确保动画不位移 */
.page-view {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    /* 使用 cubic-bezier 模拟 iOS 弹跳感 */
    transition: transform 0.4s cubic-bezier(0.3, 0.8, 0.3, 1), opacity 0.4s ease;
    background-color: #fff;
    overflow: hidden;
    z-index: 1;
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

/* 确保动画过程中不出现滚动条干扰 */
body {
    overflow: hidden;
    margin: 0;
    padding: 0;
    width: 100vw;
    height: 100vh;
    background-color: white;
    /* 终极兜底背景 */
}
</style>
