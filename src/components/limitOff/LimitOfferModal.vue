<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useLimitOfferStore } from '@/stores/limitOfferStore';
import { LHTimer } from '@/utils/Timer';

const props = defineProps<{
    visible: boolean;
}>();

const emit = defineEmits(['update:visible', 'close', 'buy']);

const limitOfferStore = useLimitOfferStore();
const countDonwText = ref("");
let timer: LHTimer;

const countdownParts = computed(() => {
    const [hours = '00', minutes = '00', seconds = '00'] = countDonwText.value.split(':');
    return [
        { value: hours, label: 'HRS' },
        { value: minutes, label: 'MIN' },
        { value: seconds, label: 'SEC' },
    ];
});

const product = computed(() => limitOfferStore.limitOffInfoModel?.Product);
const coins = computed(() => product.value?.Coins || '200');
const currentPrice = computed(() => product.value?.ApplePrice || '1.99');
const originalPrice = computed(() => product.value?.AppleOriginalPrice || '3.99');

const formatTime = (total: number): string => {
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const updateCountdown = () => {
    const now = Date.now();
    const end = limitOfferStore.showTimeRange.endTime;
    if (now <= end) {
        const diff = Math.max(0, Math.floor((end - now) / 1000));
        countDonwText.value = formatTime(diff);
    } else {
        closeModal();
    }
};

const closeModal = () => {
    emit('update:visible', false);
    emit('close');
};

const handleBuy = () => {
    emit('buy');
    closeModal();
};

onMounted(() => {
    updateCountdown();
    timer = new LHTimer(1000, updateCountdown);
    timer.start();
});

onUnmounted(() => {
    timer?.stop();
});
</script>

<template>
    <div v-if="visible" class="modal-overlay">
        <div class="modal-content">
            <button class="close-btn" type="button" aria-label="Close" @click="closeModal">×</button>
            <div class="modal-title">Limited Time Offer</div>

            <div class="countdown-row">
                <div v-for="part in countdownParts" :key="part.label" class="countdown-box">
                    <div class="countdown-value">{{ part.value }}</div>
                    <div class="countdown-label">{{ part.label }}</div>
                </div>
            </div>

            <div class="gift-stage">
                <img src="@/assets/limit-off-gift-icon.png" alt="" class="gift-image">
            </div>

            <div class="coin-row">
                <span class="coin-plus">+</span>
                <span class="coin-count">{{ coins }}</span>
            </div>

            <div class="price-row">
                <span class="original-price">${{ originalPrice }}</span>
                <span class="current-price">${{ currentPrice }}</span>
            </div>

            <button class="buy-button" type="button" @click="handleBuy">Get Now</button>
        </div>
    </div>
</template>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--app-overlay-background);
    backdrop-filter: var(--app-overlay-blur);
    -webkit-backdrop-filter: var(--app-overlay-blur);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}

.modal-content {
    position: relative;
    width: min(310px, calc(100vw - 40px));
    min-height: 402px;
    border-radius: 24px;
    background: linear-gradient(180deg, #ccf056 0%, #44d44a 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: hidden;
    padding: 28px 22px 22px;
    color: #111;
    box-shadow: 0 20px 48px rgba(0, 0, 0, 0.42);
}

.modal-content::before {
    content: '';
    position: absolute;
    width: 220px;
    height: 220px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.28);
    top: -86px;
    right: -86px;
}

.modal-title {
    position: relative;
    z-index: 1;
    font-size: 26px;
    line-height: 31px;
    font-weight: 900;
    text-align: center;
    color: #111;
}

.countdown-row {
    position: relative;
    z-index: 1;
    display: flex;
    gap: 8px;
    margin-top: 14px;
}

.countdown-box {
    width: 54px;
    height: 48px;
    border-radius: 12px;
    background: rgba(26, 26, 26, 0.9);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.countdown-value {
    color: #fff;
    font-size: 18px;
    line-height: 20px;
    font-weight: 900;
}

.countdown-label {
    margin-top: 2px;
    color: rgba(255, 255, 255, 0.48);
    font-size: 9px;
    line-height: 11px;
    font-weight: 700;
}

.gift-stage {
    position: relative;
    z-index: 1;
    width: 142px;
    height: 118px;
    margin-top: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.gift-stage::before {
    content: '';
    position: absolute;
    width: 118px;
    height: 70px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    bottom: 4px;
    filter: blur(10px);
}

.gift-image {
    position: relative;
    width: 122px;
    height: 122px;
    object-fit: contain;
}

.coin-row {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: baseline;
    justify-content: center;
    color: #111;
    margin-top: 2px;
}

.coin-plus {
    font-size: 27px;
    line-height: 1;
    font-weight: 900;
}

.coin-count {
    font-size: 45px;
    line-height: 48px;
    font-weight: 900;
}

.price-row {
    position: relative;
    z-index: 1;
    margin-top: 2px;
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 8px;
}

.original-price {
    color: rgba(0, 0, 0, 0.46);
    font-size: 16px;
    font-weight: 700;
    text-decoration: line-through;
}

.current-price {
    color: #111;
    font-size: 24px;
    line-height: 29px;
    font-weight: 900;
}

.buy-button {
    position: relative;
    z-index: 1;
    width: 244px;
    max-width: 100%;
    height: 52px;
    border: none;
    border-radius: 26px;
    background: #1a1a1a;
    color: #65d941;
    cursor: pointer;
    margin-top: 18px;
    font-size: 18px;
    font-weight: 900;
}

.buy-button:active {
    transform: scale(0.97);
}

.close-btn {
    position: absolute;
    top: 14px;
    right: 14px;
    z-index: 2;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(26, 26, 26, 0.14);
    border: none;
    color: rgba(0, 0, 0, 0.58);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 28px;
    line-height: 28px;
    padding: 0 0 2px;
}
</style>
