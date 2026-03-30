<script setup lang="ts">
import type { LimitOffModel } from '@/components/appModels/LimitOffModel';
import { API } from '@/utils/net/api';
import { post } from '@/utils/net/request';
import { LHTimer } from '@/utils/Timer';
import { onMounted, onUnmounted, ref, computed } from 'vue';

// Use LHTimer for countdown
let timer: LHTimer;

const countDonwTime = ref(900); // 15 mins
const countDonwText = ref("");

const timerHandler = () => {
    if (countDonwTime.value <= 0) {
        timer?.stop();
        return;
    }
    countDonwTime.value -= 1;
    countDonwText.value = formatTime(countDonwTime.value);
};

const formatTime = (total: number): string => {
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const limitOffInfo = ref<LimitOffModel | null>(null)

const isShowLimitOfferView = computed(() => {
    return limitOffInfo.value && limitOffInfo.value.State == '1' && limitOffInfo.value.IsBuy == '0' && todayIsShow
})

const todayIsShow = computed(() => {
    return true
})
const getLimitOfferInfo = async () => {
    const res = await post(API.specail_lto)
    if (res.code == "0") {
        limitOffInfo.value = res.data
    }
}

const payLimitOff = () => {

}

onMounted(() => {
    getLimitOfferInfo()
    countDonwText.value = formatTime(countDonwTime.value);
    timer = new LHTimer(1000, () => timerHandler());
    timer.start();
});

onUnmounted(() => {
    timer?.stop();
});
</script>

<template>
    <div v-if="isShowLimitOfferView" class="limit-page" @click="payLimitOff">
        <div class="leftWihtView"></div>
        <img src="@/assets/limitOff/limit-off-gift-icon.png" alt="" class="giftLogo">
        <div class="limitInfoContent">
            <div class="topInfo">
                <div class="coinsCount">200</div>
                <div class="countDonwView">{{ countDonwText }}</div>
                <div class="priceView">$1.99</div>
            </div>
            <div class="bottomInfo">Will miss the offer the countdown ends.</div>
        </div>
    </div>
</template>

<style scoped>
.limit-page {
    background: linear-gradient(to right, #AD5CFF, #FF99EB);
    border-radius: 16px;
    overflow: hidden;
    display: flex;
    padding-right: 17px;
}

.leftWihtView {
    background-color: rgba(255, 255, 255, 0.1);
    width: 118px;
    height: 118px;
    border-radius: 50%;
    position: absolute;
    top: -14px;
    left: -31px;
}

.giftLogo {
    position: relative;
    top: 6px;
    width: 74px;
    height: 74px;
}

.limitInfoContent {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: left;
    gap: 12px;
}

.topInfo {
    display: flex;
    align-items: center;
}

.priceView {
    position: absolute;
    right: 17px;
    height: 27px;
    line-height: 27px;
    background-color: rgba(255, 255, 255, 0.25);
    padding-left: 8px;
    padding-right: 8px;
    border-radius: 13.5px;
    border-color: rgba(255, 255, 255, 0.3);
    border-width: 1px;
    border-style: solid;
    color: #fff;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    font-size: 12px;
    font-weight: 700;
}

.countDonwView {
    background-color: #A93FED;
    margin-left: 8px;
    padding-left: 8px;
    padding-right: 8px;
    height: 22px;
    line-height: 22px;
    border-radius: 11px;
    color: #fff;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    font-size: 12px;
    font-weight: 590;
}

.bottomInfo {
    height: 14px;
    line-height: 14px;
    color: #fff;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    font-size: 12px;
    font-weight: 510;
}

.coinsCount {
    color: #fff;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    font-size: 20px;
    font-weight: 700;
}
</style>