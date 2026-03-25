<script setup lang="ts">

import { ref, watch, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import type { mainTabbarConfig } from '@/components/tabbarModels/mainTabbarConfig.ts';
import { mainTabbarConfigList } from '@/components/tabbarModels/mainTabbarConfig.ts';
import TabbarItemContainerView from '@/views/tabbarView/tabbarItemContainerView.vue';

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

</script>

<template>
    <div class="mainTabView">
        <RouterView v-slot="{ Component }">
            <KeepAlive>
                <component :is="Component" />
            </KeepAlive>
        </RouterView>
    </div>
    <TabbarItemContainerView :tabbarItemList="tabbarItemList" @emitsSwitchTo="switchTo"></TabbarItemContainerView>
</template>

<style scoped>
.mainTabView {
    position: relative;
    width: 100%;
    background-color: orchid;
    bottom: 88px;
    top: 0;
    left: 0;
    right: 0;
    z-index: 0;
}
</style>