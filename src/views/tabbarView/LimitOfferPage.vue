<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import type { LimitOffModel } from '@/components/appModels/LimitOffModel';
import { API } from '@/utils/net/api';
import { post } from '@/utils/net/request';
import { LHTimer } from '@/utils/Timer';
import { paymentService } from '@/utils/tools/paymentService';
import { useLimitOfferStore } from '@/stores/limitOfferStore';
import LimitOfferModal from '@/components/limitOff/LimitOfferModal.vue';

// Use LHTimer for countdown
// const emits = defineEmits({
//     isShowLimitOfferView
// })

const emits = defineEmits<{
    isShowLimitOfferView: [value: boolean]
}>()

let timer: LHTimer;

const limitOfferStore = useLimitOfferStore()

const countDonwTime = ref(0);
const countDonwText = ref("");
const currentTime = ref(Date.now());
const limitOffInfo = ref<LimitOffModel | null>(null);

const showFullModal = ref(false); // 控制全屏弹窗显示
const isDebug = import.meta.env.DEV;

const createDebugLimitOfferInfo = (): LimitOffModel => ({
    State: '1',
    FirstStart: '0',
    LimitTime: '3600',
    IsBuy: '0',
    Product: {
        ProductId: 'debug-limit-offer',
        ProductName: 'Debug Limited Offer',
        ProductType: '3',
        ProductSort: '1',
        ProductCover: '',
        ProductImages: '',
        ProductDesc: '',
        ExtraCoins: '0',
        Coins: '200',
        Days: '0',
        ProductPower: '',
        IsValid: '1',
        PaypalSkuId: '',
        Position: '',
        Purpose: '',
        ApplePrice: '1.99',
        AppleSkuId: 'debug-limit-offer',
        AppleOriginalPrice: '3.99',
        GooglePrice: '0.00',
        GoogleSkuId: '',
        GoogleOriginalPrice: '0.00',
        ShowPrice: '$1.99',
        ShowOriginalPrice: '$3.99',
    },
});

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


watch(isShowLimitOfferView, (newValue) => {
    emits("isShowLimitOfferView", newValue as boolean)
}, { immediate: true })

const showDebugLimitOffer = () => {
    if (!isDebug) return;

    const info = limitOffInfo.value || createDebugLimitOfferInfo();
    limitOffInfo.value = {
        ...info,
        State: '1',
        IsBuy: '0',
        FirstStart: '0',
        LimitTime: info.LimitTime || '3600',
        Product: info.Product || createDebugLimitOfferInfo().Product,
    };

    const now = Date.now();
    limitOfferStore.limitOffInfoModel = limitOffInfo.value;
    limitOfferStore.showTimeRange.startTime = now;
    limitOfferStore.showTimeRange.endTime = now + Number(limitOffInfo.value.LimitTime || 3600) * 1000;
    limitOfferStore.lastModalShownStartTime = now;
    currentTime.value = now;
    timerHandler();
    timer?.stop();
    timer?.start();
}

defineExpose({
    isShowLimitOfferView,
    showDebugLimitOffer
});

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
    const product = limitOffInfo.value?.Product
    if (product) {
        paymentService.startPayment(product, () => {
            getLimitOfferInfo()
        })
    }
}

onMounted(() => {
    paymentService.preloadApplePaySdk()
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
    <div class="limit-offer-wrapper" v-if="isShowLimitOfferView">
        <div class="limit-page" @click="payLimitOff">
            <img src="@/assets/limit-off-gift-icon.png" alt="" class="giftLogo">
            <div class="limitInfoContent">
                <div class="topInfo">
                    <div class="coinsCount">{{ limitOffInfo?.Product?.Coins }}</div>
                    <div class="countDonwView">{{ countDonwText }}</div>
                    <div class="priceView">{{ limitOffInfo?.Product?.ApplePrice ? '$' + limitOffInfo.Product.ApplePrice
                        :
                        'Buy' }}</div>
                </div>
                <div class="bottomInfo">Will miss the offer when countdown ends.</div>
            </div>
        </div>

        <Teleport to="body">
            <LimitOfferModal v-model:visible="showFullModal" @buy="payLimitOff" />
        </Teleport>
    </div>
</template>

<style scoped>
.limit-offer-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    box-sizing: border-box;
}

.limit-page {
    position: relative;
    width: 100%;
    background: linear-gradient(100deg, #c8f24e 0%, #78eb3f 100%);
    border-radius: 16px;
    overflow: hidden;
    display: flex;
    align-items: center;
    padding: 0 14px 0 10px;
    height: 72px;
    cursor: pointer;
    color: #111;
    box-sizing: border-box;
}

.limit-page::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 85% 8%, rgba(255, 255, 255, 0.4), transparent 42%);
    pointer-events: none;
}

.giftLogo {
    position: relative;
    width: 58px;
    height: 58px;
    z-index: 1;
    flex-shrink: 0;
}

.limitInfoContent {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 6px;
    margin-left: 8px;
    min-width: 0;
    position: relative;
    z-index: 1;
}

.topInfo {
    display: flex;
    align-items: center;
    min-width: 0;
}

.priceView {
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    height: 32px;
    line-height: 32px;
    background-color: #1a1a1a;
    padding-left: 14px;
    padding-right: 14px;
    border-radius: 16px;
    color: #65d941;
    font-size: 14px;
    font-weight: 800;
    white-space: nowrap;
}

.countDonwView {
    background-color: #ffde09;
    margin-left: 10px;
    padding: 0 9px;
    height: 22px;
    line-height: 22px;
    border-radius: 11px;
    color: #111;
    font-size: 12px;
    font-weight: 800;
    white-space: nowrap;
}

.bottomInfo {
    color: rgba(0, 0, 0, 0.5);
    font-size: 11px;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding-right: 88px;
}

.coinsCount {
    color: #111;
    font-size: 24px;
    line-height: 1;
    font-weight: 800;
}
</style>
