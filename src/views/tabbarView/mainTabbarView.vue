<script setup lang="ts">

import { ref } from 'vue';
import { useRouter } from 'vue-router';
import type { mainTabbarConfig } from '@/components/tabbarModels/mainTabbarConfig.ts';
import { mainTabbarConfigList } from '@/components/tabbarModels/mainTabbarConfig.ts';
import TabbarItemContainerView from '@/views/tabbarView/tabbarItemContainerView.vue';

const router = useRouter()

const tabbarItemList = ref<mainTabbarConfig[]>(mainTabbarConfigList)

const switchTo = (pageName: string) => {
    tabbarItemList.value.forEach(item => {
        item.isSelected = item.name === pageName
    })
    router.push({ name: pageName })
}

</script>

<template>
    <div class="mainTabView">
        <RouterView></RouterView>
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