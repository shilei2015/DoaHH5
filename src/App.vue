<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const transitionName = ref('push');
const routeStack: string[] = [];

import { notificationService } from '@/utils/tools/notificationService';
import FlashNotification from '@/components/Notification/FlashNotification.vue';

const ns = notificationService.state;
const onNotificationClose = () => {
    notificationService.hide();
};

// --- 侧滑返回（从左缘向右滑）：用捕获阶段优先于内部 scroll，避免聊天页等全宽列表吞掉手势 ---
const EDGE_PX = 40;
const startX = ref(0);
const startY = ref(0);

const handleTouchStart = (e: TouchEvent) => {
    if (route.meta.disableSwipeBack) {
        startX.value = 0;
        return;
    }

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
    if (route.meta.disableSwipeBack) {
        startX.value = 0;
        return;
    }

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


const getRouteKey = (target: typeof route) => target.fullPath || target.path || String(target.name || '');
const getRouteDepth = (target: typeof route) => Number(target.meta.depth || 0);

onMounted(() => {
    routeStack.splice(0, routeStack.length, getRouteKey(route));
});

// 路由记录：优先用访问栈判断真实前进/返回，同级页面再也不会一律被当成 push。
router.beforeEach((to, from) => {
    const toKey = getRouteKey(to);
    const fromKey = getRouteKey(from);

    if (!from.name) {
        routeStack.splice(0, routeStack.length, toKey);
        transitionName.value = 'push';
        return;
    }

    const toIndex = routeStack.lastIndexOf(toKey);
    const fromIndex = routeStack.lastIndexOf(fromKey);
    const isKnownBack = toIndex !== -1 && (fromIndex === -1 || toIndex < fromIndex);
    const isDepthBack = toIndex === -1 && getRouteDepth(to) < getRouteDepth(from);

    if (isKnownBack || isDepthBack) {
        transitionName.value = 'pop';
        if (toIndex !== -1) {
            routeStack.splice(toIndex + 1);
        } else {
            routeStack.splice(0, routeStack.length, toKey);
        }
        return;
    }

    transitionName.value = 'push';
    if (fromIndex !== -1) {
        routeStack.splice(fromIndex + 1);
    }
    routeStack.push(toKey);
});

</script>

<template>
    <div class="app-container" @touchstart.capture="handleTouchStart" @touchend.capture="handleTouchEnd">
        <!-- Global Message Flash Banner -->
        <FlashNotification v-if="ns.visible && ns.data" :data="ns.data" @close="onNotificationClose" />

        <router-view v-slot="{ Component, route }">
            <!-- KeepAlive 必须放在稳定层级，不能被路由 key 一起销毁，否则返回会重新加载 Tab 内容 -->
            <!-- Tab 子页面共享 tab-root key，避免底部 Tab 内部切换触发整页 push 动画 -->
            <Transition :name="transitionName" :duration="360">
                <KeepAlive include="mainTabbarView,UserListPage">
                    <component :is="Component" :key="Number(route.meta.depth || 0) <= 20 ? 'tab-root' : route.fullPath"
                        class="page-view" />
                </KeepAlive>
            </Transition>
        </router-view>
    </div>
</template>

<style>
/* 根容器，接割手势监听 */
.app-container {
    width: 100vw;
    height: 100vh;
    height: 100dvh;
    overflow: hidden;
    position: relative;
    background: var(--app-bg, #1a1a1a);
    color: var(--app-text-primary, #ffffff);
}

/* 全局基础页面容器：深色底与原生安全区保持一致 */
.page-view {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transition: transform 0.36s cubic-bezier(0.32, 0.72, 0, 1);
    overflow: hidden;
    z-index: 1;
    background-color: var(--app-bg, #1a1a1a);
    color: var(--app-text-primary, #ffffff);
    backface-visibility: hidden;
    will-change: transform;
}

/* --- Push (前进) 动画 --- */

/* 新页面进来 */
.push-enter-from {
    transform: translateX(100%);
}

.push-enter-to {
    transform: translateX(0);
}

/* 旧页面离开 */
.push-leave-from {
    transform: translateX(0);
}

.push-leave-to {
    transform: translateX(-30%);
}

.push-enter-active {
    z-index: 2;
    box-shadow: -12px 0 28px rgba(0, 0, 0, 0.28);
    transition: transform 0.36s cubic-bezier(0.32, 0.72, 0, 1);
    transition-timing-function: cubic-bezier(0.32, 0.72, 0, 1);
}

.push-leave-active {
    z-index: 1;
    transition: transform 0.36s cubic-bezier(0.32, 0.72, 0, 1);
    transition-timing-function: cubic-bezier(0.32, 0.72, 0, 1);
}

/* --- Pop (后退) 动画 --- */

/* 回到旧页面 */
.pop-enter-from {
    transform: translateX(-30%);
}

.pop-enter-to {
    transform: translateX(0);
}

/* 当前页面滑出 */
.pop-leave-from {
    transform: translateX(0);
}

.pop-leave-to {
    transform: translateX(100%);
}

.pop-enter-active {
    z-index: 1;
    transition: transform 0.36s cubic-bezier(0.32, 0.72, 0, 1);
    transition-timing-function: cubic-bezier(0.32, 0.72, 0, 1);
}

.pop-leave-active {
    z-index: 2;
    box-shadow: -12px 0 28px rgba(0, 0, 0, 0.28);
    transition: transform 0.36s cubic-bezier(0.32, 0.72, 0, 1);
    transition-timing-function: cubic-bezier(0.32, 0.72, 0, 1);
}

html {
    background-color: var(--app-bg, #1a1a1a);
}

/* 深色背景，橡皮筋露底时不出现白边 */
body {
    overflow: hidden;
    margin: 0;
    padding: 0;
    width: 100vw;
    height: 100vh;
    background-color: var(--app-bg, #1a1a1a);
}
</style>
