<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { LimitOffModel } from '@/components/appModels/LimitOffModel';
import { API } from '@/utils/net/api';
import { post } from '@/utils/net/request';
import { LHTimer } from '@/utils/Timer';
import { paymentService } from '@/utils/tools/paymentService';
import { useLimitOfferStore } from '@/stores/limitOfferStore';
import LimitOfferModal from '@/components/limitOff/LimitOfferModal.vue';

// Use LHTimer for countdown
let timer: LHTimer;

const limitOfferStore = useLimitOfferStore()

const countDonwTime = ref(0);
const countDonwText = ref("");
const currentTime = ref(Date.now());
const limitOffInfo = ref<LimitOffModel | null>(null);

const showFullModal = ref(false); // 控制全屏弹窗显示

const timerHandler = () => {
    currentTime.value = Date.now();
    const start = limitOfferStore.showTimeRange.startTime;
    const end = limitOfferStore.showTimeRange.endTime;

    // --- 全屏弹窗触发逻辑 ---
    // 只有在 [start, end) 之间，且本轮 startTime 未弹过时才弹
    if (currentTime.value >= start && currentTime.value < end && start !== 0) {
        if (limitOfferStore.lastModalShownStartTime !== start) {
            showFullModal.value = true;
            limitOfferStore.lastModalShownStartTime = start;
        }
    }

    // 情况 A: 正在优惠期内
    if (currentTime.value >= start && currentTime.value <= end) {
        const totalSeconds = Math.max(0, Math.floor((end - currentTime.value) / 1000));
        countDonwTime.value = totalSeconds;
        countDonwText.value = formatTime(totalSeconds);
    }
    // 情况 B: 优惠已经彻底过时了
    else if (currentTime.value > end && end !== 0) {
        timer?.stop();
        console.log("Limit Off ended, timer stopped.");
    }
}

const formatTime = (total: number): string => {
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const isShowLimitOfferView = computed(() => {
    const active = limitOfferStore.isTimeInPeriod(
        currentTime.value,
        limitOfferStore.showTimeRange.startTime,
        limitOfferStore.showTimeRange.endTime
    );
    return limitOffInfo.value && limitOffInfo.value.State == '1' && limitOffInfo.value.IsBuy == '0' && active
})

const getLimitOfferInfo = async () => {
    const res = await post(API.specail_lto)
    if (res.code == "0" && res.data) {

        // res.data.FirstStart = "3"
        // res.data.LimitTime = "100000"

        limitOffInfo.value = res.data
        // limitOfferStore.reset()
        limitOfferStore.updateTimeInfo(res.data)

        // 重启计时器
        timer?.stop();
        timer?.start();
    }
}

const payLimitOff = () => {
    const productId = limitOffInfo.value?.Product?.ProductId
    if (productId) {
        paymentService.startPayment(productId, () => {
            getLimitOfferInfo()
        })
    }
}

onMounted(() => {
    getLimitOfferInfo()
    timer = new LHTimer(1000, () => timerHandler());
    timer.start();
    timerHandler(); // 立即执行一次
});

onUnmounted(() => {
    timer?.stop();
});
</script>

<template>
    <div class="limit-offer-wrapper">
        <div v-if="isShowLimitOfferView" class="limit-page" @click="payLimitOff">
            <div class="leftWihtView"></div>
            <img src="@/assets/limitOff/limit-off-gift-icon.png" alt="" class="giftLogo">
            <div class="limitInfoContent">
                <div class="topInfo">
                    <div class="coinsCount">{{ limitOffInfo?.Product?.Coins }}</div>
                    <div class="countDonwView">{{ countDonwText }}</div>
                    <div class="priceView">{{ limitOffInfo?.Product?.ApplePrice ? '$' + limitOffInfo.Product.ApplePrice
                        :
                        'Buy' }}</div>
                </div>
                <div class="bottomInfo">Will miss the offer the countdown ends.</div>
            </div>
        </div>

        <Teleport to="body">
            <LimitOfferModal v-model:visible="showFullModal" @buy="payLimitOff" />
        </Teleport>
    </div>
</template>

<style scoped>
.limit-page {
    position: relative;
    background: linear-gradient(to right, #AD5CFF, #FF99EB);
    border-radius: 16px;
    overflow: hidden;
    display: flex;
    padding-right: 17px;
    height: 86px;
    cursor: pointer;
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
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 8px;
    margin-left: 4px;
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
    padding-left: 12px;
    padding-right: 12px;
    border-radius: 13.5px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: #fff;
    font-size: 14px;
    font-weight: 700;
}

.countDonwView {
    background-color: #A93FED;
    margin-left: 12px;
    padding: 0 8px;
    height: 22px;
    line-height: 22px;
    border-radius: 11px;
    color: #fff;
    font-size: 12px;
    font-weight: 600;
}

.bottomInfo {
    color: rgba(255, 255, 255, 0.8);
    font-size: 11px;
    font-weight: 500;
}

.coinsCount {
    color: #fff;
    font-size: 22px;
    font-weight: 800;
}
</style>