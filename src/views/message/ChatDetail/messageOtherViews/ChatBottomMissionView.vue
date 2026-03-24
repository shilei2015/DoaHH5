<script setup lang="ts">
import { MissionType } from '@/utils/Enums/Enums';
import { reactive } from 'vue';

export interface MissionData {
    helloMission: {
        completed: boolean;
    }
    giftMission: {
        completed: boolean;
        giftIcon: string;
        giftPrice: string;
    }
    clickMission: (type: MissionType) => void;
}

const props = defineProps<{
    missionData: MissionData;
}>();

const missionData = reactive<MissionData>(props.missionData)

</script>

<template>
    <div class="viewContent">
        <div v-if="!missionData.helloMission.completed" class="helloView"
            @click="missionData.clickMission(MissionType.hello)">👋 say hello</div>
        <div v-if="!missionData.giftMission.completed" class="sendGiftView"
            @click="missionData.clickMission(MissionType.gift)">
            <img class="giftIcon" :src="missionData.giftMission.giftIcon" alt="">
            <span class="sendTitle">send gift</span>
            <img class="diamondTag" src="@/assets/profile/diamond_icon.svg" alt="">
            <span class="diamondCount">{{ missionData.giftMission.giftPrice }}</span>
        </div>
    </div>
</template>

<style scoped>
.viewContent {
    display: flex;
    align-self: flex-start;
    max-width: 100%;
    padding: 12px;
    gap: 9px;
    height: 40px;
}

.helloView,
.sendGiftView {
    background-color: #fff;
    border-radius: 20px;
    padding: 12px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
}

.giftIcon {
    width: 22px;
    height: 22px;
}

.diamondTag {
    width: 20px;
    height: 20px;
}
</style>