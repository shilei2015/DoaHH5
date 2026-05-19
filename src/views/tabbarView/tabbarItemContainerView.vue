<script setup lang="ts">
import { type mainTabbarConfig } from '@/components/tabbarModels/mainTabbarConfig';
import { getChatRecordManager } from '@/utils/msg/ChatRecordManager';

// 修正：defineProps 的泛型必须是一个对象类型
const props = defineProps<{
    tabbarItemList: mainTabbarConfig[]
}>()

// 优化：使用显式的 emits 定义
const emits = defineEmits<{
    (e: 'emitsSwitchTo', name: string): void
}>()

const chatRecordManager = getChatRecordManager();
const totalUnread = chatRecordManager.totalUnread;

const switchTo = (name: string) => {
    emits("emitsSwitchTo", name)
}


</script>

<template>
    <div class="contianerView">
        <div class="tabbarItem" v-for="item in props.tabbarItemList" :key="item.name" @click="switchTo(item.name)">
            <div class="icon-wrapper">
                <img v-if="item.isSelected" class="icon selected" :src="item.selectedIconUrl" alt="">
                <img v-else class="icon" :src="item.iconUrl" alt="">
                <div v-if="item.name === 'messageList' && totalUnread > 0" class="unread-dot"></div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.contianerView {
    position: fixed;
    display: flex;
    justify-content: space-around;
    align-items: flex-start;
    width: 100%;
    height: var(--app-tabbar-height, 56px);
    min-height: 56px;
    padding-top: var(--app-edge-gap, 12px);
    padding-bottom: var(--app-tabbar-safe-bottom, 12px);
    background-color: var(--app-bg, #1a1a1a);
    left: 0;
    right: 0;
    bottom: 0;
    border-top: none;
    box-shadow: none;
    box-sizing: border-box;
    z-index: 20;
}

.tabbarItem {
    height: 32px;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
}

.icon-wrapper {
    position: relative;
    width: 32px;
    height: 32px;
}

.icon {
    width: 32px;
    height: 32px;
    display: block;
    opacity: 1;
    filter: none;
    transition: transform 0.2s ease;
}

.icon.selected {
    transform: none;
}

.unread-dot {
    position: absolute;
    top: -2px;
    right: -2px;
    width: 10px;
    height: 10px;
    background-color: #FF3B30;
    border: 2px solid var(--app-bg, #1a1a1a);
    border-radius: 50%;
    z-index: 10;
}
</style>
