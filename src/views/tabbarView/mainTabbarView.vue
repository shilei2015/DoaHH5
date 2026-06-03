<script lang="ts">
export default {
    name: "mainTabbarView"
}
</script>

<script setup lang="ts">

import { ref, shallowRef, watch } from 'vue';
import { useRouter, useRoute, type RouteLocationNormalizedLoaded } from 'vue-router';
import type { mainTabbarConfig } from '@/components/tabbarModels/mainTabbarConfig.ts';
import { mainTabbarConfigList } from '@/components/tabbarModels/mainTabbarConfig.ts';
import TabbarItemContainerView from '@/views/tabbarView/tabbarItemContainerView.vue';
import LimitOfferPage from './LimitOfferPage.vue';
import { triggerHaptic } from '@/utils/native/A0019Bridge';
const router = useRouter()
const route = useRoute()

const tabbarItemList = ref<mainTabbarConfig[]>(mainTabbarConfigList)
const tabPageNames = new Set(mainTabbarConfigList.map(item => item.name))

const syncTabState = (pageName: string | null | undefined) => {
    if (!pageName) return;
    tabbarItemList.value.forEach(item => {
        item.isSelected = item.name === pageName
    })
}

const isTabPageName = (pageName: unknown): pageName is string => typeof pageName === 'string' && tabPageNames.has(pageName)
const cloneRoute = (target: typeof route): RouteLocationNormalizedLoaded => ({
    ...target,
    matched: [...target.matched],
    meta: { ...target.meta },
    params: { ...target.params },
    query: { ...target.query },
})
const stableTabRoute = shallowRef<RouteLocationNormalizedLoaded>(cloneRoute(route))

const switchTo = (pageName: string) => {
    syncTabState(pageName)
    router.push({ name: pageName })
}

watch(() => [route.name, route.fullPath] as const, ([pageName]) => {
    if (!isTabPageName(pageName)) return
    syncTabState(pageName)
    stableTabRoute.value = cloneRoute(route)
}, { immediate: true })

const isShowLimitOfferView = ref(false)
const limitOfferRef = ref<InstanceType<typeof LimitOfferPage> | null>(null)
const isDebug = import.meta.env.DEV

const showDebugLimitOffer = () => {
    limitOfferRef.value?.showDebugLimitOffer()
}
</script>

<template>
    <div class="main-tabbar-root">
        <div class="mainTabView">
            <RouterView :route="stableTabRoute" v-slot="{ Component, route }">
                <KeepAlive>
                    <component :is="Component" :key="route.fullPath" />
                </KeepAlive>
            </RouterView>
        </div>
        <TabbarItemContainerView :tabbarItemList="tabbarItemList" @emitsSwitchTo="switchTo"></TabbarItemContainerView>
        <button
            v-if="isDebug"
            class="debug-limit-offer-trigger"
            type="button"
            @click="showDebugLimitOffer"
        >
            调试：限时优惠入口
        </button>
        <LimitOfferPage ref="limitOfferRef" @isShowLimitOfferView="isShowLimitOfferView = $event" class="limitOffer"></LimitOfferPage>
    </div>
</template>

<style scoped>
.main-tabbar-root {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: var(--app-bg, #1a1a1a);
    color: var(--app-text-primary, #ffffff);
}

.mainTabView {
    width: 100%;
    height: 100vh;
    height: 100dvh;
    overflow: hidden;
    z-index: 0;
    background: var(--app-bg, #1a1a1a);
}

.limitOffer {
    height: 86px;
    position: fixed;
    bottom: calc(var(--app-tabbar-height, 76px) + 17px);
    left: 17px;
    width: calc(100% - 34px);
}

.debug-limit-offer-trigger {
    position: fixed;
    right: 17px;
    bottom: calc(var(--app-tabbar-height, 76px) + 17px);
    z-index: 10001;
    height: 36px;
    padding: 0 14px;
    border: 1px solid rgba(101, 217, 65, 0.45);
    border-radius: 18px;
    background: rgba(26, 26, 26, 0.88);
    color: #65d941;
    font-size: 13px;
    font-weight: 700;
    line-height: 36px;
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.32);
}
</style>
