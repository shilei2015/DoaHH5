<script setup lang="ts">
import { MissionType } from '@/utils/Enums/Enums';
import { reactive } from 'vue';

export interface MissionData {
    helloMission: {
        completed: boolean;
    }
    giftMission: {
        completed: boolean;
        show: boolean;
        giftIcon: string;
        giftPrice: string;
    }
}

const props = defineProps<{
    missionData: MissionData;
}>();

const emit = defineEmits<{
    (e: 'clickMission', type: MissionType): void
}>()

</script>

<template>
    <div class="viewContent">
        <div v-if="!props.missionData.helloMission.completed" class="helloView"
            @click="emit('clickMission', MissionType.hello)">👋 Say “Hi~”</div>
        <!-- <div v-if="!props.missionData.giftMission.completed && props.missionData.giftMission.show" class="sendGiftView"
            @click="emit('clickMission', MissionType.gift)">
            <img class="giftIcon" :src="props.missionData.giftMission.giftIcon" alt="">
            <span class="sendTitle">send gift</span>
            <img class="diamondTag" src="@/assets/profile/diamond_icon.svg" alt="">
            <span class="diamondCount">{{ props.missionData.giftMission.giftPrice }}</span>
        </div> -->
    </div>
</template>

<style scoped>
.viewContent {
    display: flex;
    align-self: flex-start;
    max-width: 100%;
    padding: 0 12px;
    gap: 9px;
    height: 40px;
}

.helloView,
.sendGiftView {
    background-color: #292929;
    border-radius: 16px;
    padding: 5px 8px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    color: #FFFFFF;
}

.giftIcon {
    width: 22px;
    height: 22px;
}

.diamondTag {
    width: 20px;
    height: 20px;
}

.sendTitle,
.helloView {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    font-size: 12px;
    font-weight: 510;
    white-space: nowrap;
}

.diamondCount {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    font-size: 14px;
    font-weight: 510;
    color: #FF5290;
}
</style>
