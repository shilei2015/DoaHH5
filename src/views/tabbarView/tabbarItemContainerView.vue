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
                <img v-if="item.isSelected" class="icon" :src="item.selectedIconUrl" alt="">
                <img v-else class="icon" :src="item.iconUrl" alt="">
                <!-- 未读数红点 -->
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
    align-items: center;
    width: 100%;
    height: 88px;
    background-color: #ffffff;
    left: 0;
    right: 0;
    bottom: 0;
    box-shadow: 0px -2px 10px rgba(0, 0, 0, 0.05);
}

.tabbarItem {
    height: 100%;
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
}

.unread-dot {
    position: absolute;
    top: -2px;
    right: -2px;
    width: 10px;
    height: 10px;
    background-color: #FF3B30;
    border: 2px solid #fff;
    border-radius: 50%;
    z-index: 10;
}
</style>
