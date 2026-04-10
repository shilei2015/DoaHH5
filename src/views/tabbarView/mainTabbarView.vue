<script lang="ts">
export default {
    name: "mainTabbarView"
}
</script>

<script setup lang="ts">

import { ref, watch, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import type { mainTabbarConfig } from '@/components/tabbarModels/mainTabbarConfig.ts';
import { mainTabbarConfigList } from '@/components/tabbarModels/mainTabbarConfig.ts';
import TabbarItemContainerView from '@/views/tabbarView/tabbarItemContainerView.vue';
import LimitOfferPage from './LimitOfferPage.vue';
import { triggerHaptic } from '@/utils/native/A0019Bridge';
const router = useRouter()
const route = useRoute()

const tabbarItemList = ref<mainTabbarConfig[]>(mainTabbarConfigList)

const syncTabState = (pageName: string | null | undefined) => {
    if (!pageName) return;
    tabbarItemList.value.forEach(item => {
        item.isSelected = item.name === pageName
    })
}

const switchTo = (pageName: string) => {
    syncTabState(pageName)
    router.push({ name: pageName })
}

watch(() => route.name, (newPath) => {
    syncTabState(newPath as string)
}, { immediate: true })

onMounted(() => {
    syncTabState(route.name as string)
})
const isShowLimitOfferView = ref(false)
</script>

<template>
    <div class="main-tabbar-root">
        <div class="mainTabView" :style="{ paddingBottom: isShowLimitOfferView ? '120px' : '0', boxSizing: 'border-box' }">
            <RouterView v-slot="{ Component, route }">
                <KeepAlive>
                    <component :is="Component" :key="route.fullPath" />
                </KeepAlive>
            </RouterView>
        </div>
        <TabbarItemContainerView :tabbarItemList="tabbarItemList" @emitsSwitchTo="switchTo"></TabbarItemContainerView>
        <LimitOfferPage @isShowLimitOfferView="isShowLimitOfferView = $event" class="limitOffer"></LimitOfferPage>
    </div>
</template>

<style scoped>
.mainTabView {
    width: 100%;
    height: 100vh;
    overflow: hidden;
    z-index: 0;
}

.limitOffer {
    height: 86px;
    position: fixed;
    bottom: calc(88px + 21px);
    left: 17px;
    right: 17px;
}
</style>