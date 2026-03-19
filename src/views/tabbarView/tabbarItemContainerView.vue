<script setup lang="ts">
import { type mainTabbarConfig } from '@/components/tabbarModels/mainTabbarConfig';

// 修正：defineProps 的泛型必须是一个对象类型
const props = defineProps<{
    tabbarItemList: mainTabbarConfig[]
}>()

// 优化：使用显式的 emits 定义
const emits = defineEmits<{
    (e: 'emitsSwitchTo', name: string): void
}>()

const switchTo = (name: string) => {
    emits("emitsSwitchTo", name)
}
</script>

<template>
    <div class="contianerView">
        <div class="tabbarItem" v-for="item in props.tabbarItemList" :key="item.name" @click="switchTo(item.name)">
            <img v-if="item.isSelected" class="icon" :src="item.selectedIconUrl" alt="">
            <img v-else class="icon" :src="item.iconUrl" alt="">
        </div>
    </div>
</template>

<style scoped>
.contianerView {
    position: fixed;
    display: flex;
    justify-content: space-around;
    align-items: center;
    width: 100%;
    height: 88px;
    background-color: #ffffff;
    left: 0;
    right: 0;
    bottom: 0;
}

.tabbarItem {
    height: 100%;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
}

.tabbarItem img {
    position: absolute;
    width: 32px;
    height: 32px;
    top: 12px;
}
</style>
