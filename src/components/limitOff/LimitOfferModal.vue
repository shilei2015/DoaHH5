<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useLimitOfferStore } from '@/stores/limitOfferStore';
import { LHTimer } from '@/utils/Timer';
import { paymentService } from '@/utils/tools/paymentService';

const props = defineProps<{
    visible: boolean;
}>();

const emit = defineEmits(['update:visible', 'close', 'buy']);

const limitOfferStore = useLimitOfferStore();
const countDonwText = ref("");
let timer: LHTimer;

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
    <div v-if="visible" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content">
            <!-- 50% OFF Badge -->
            <div class="discount-badge">50% OFF</div>

            <!-- Diamond Image Section -->
            <div class="diamond-section">
                <div class="diamond-info">
                    <div class="diamond-count">{{ limitOfferStore.limitOffInfoModel?.Product?.Coins }}</div>
                    <div class="diamond-label">Diamonds</div>
                </div>
            </div>

            <!-- Description -->
            <div class="desc-text">The hidden discount ends with the countdown.</div>

            <!-- Countdown Banner -->
            <div class="countdown-banner">
                <div class="banner-inner">
                    <span class="banner-label">THE DISCOUNT WILL EXPIRE IN</span>
                    <span class="banner-time">{{ countDonwText }}</span>
                </div>
                <div class="banner-tag">Limited Time!</div>
            </div>

            <!-- Price Button -->
            <div class="buy-button" @click="handleBuy">
                <span class="current-price">${{ limitOfferStore.limitOffInfoModel?.Product?.ApplePrice || '1.99'
                    }}</span>
                <span class="original-price">${{ limitOfferStore.limitOffInfoModel?.Product?.AppleOriginalPrice ||
                    '3.99' }}</span>
            </div>

            <!-- Close Button -->
            <div class="close-btn" @click="closeModal">
                <div class="close-icon">×</div>
            </div>
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
    background-color: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}

.modal-content {
    background-image: url("@/assets/limitOff/limit-big-bg.svg");
    background-repeat: no-repeat;
    position: absolute;
    width: 375px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.discount-badge {
    padding-top: 54px;
    color: white;
    font-weight: 800;
    font-size: 18px;
}

.diamond-section {
    display: flex;
    align-items: center;
}

.diamond-info {
    position: relative;
    padding-top: 35px;
    text-align: left;
    padding-left: 100px;
}

.diamond-count {
    font-size: 44px;
    font-weight: 900;
    color: #A93FED;
    line-height: 1;
}

.diamond-label {
    font-size: 20px;
    font-weight: 600;
    color: #A93FED;
}

.desc-text {
    width: 227px;
    padding-top: 18px;
    font-size: 14px;
    color: #A93FED;
    text-align: left;
    margin-bottom: 40px;
    font-weight: 500;
    opacity: 0.8;
    line-height: 22px;
}

.countdown-banner {
    position: relative;
    width: 120vw;
    background: linear-gradient(135deg, #AD5CFF 0%, #FF99EB 100%);
    height: 145px;
    padding: 15px 0;
    transform: rotate(-4deg);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 20px rgba(173, 92, 255, 0.4);
}

.banner-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
}

.banner-label {
    color: #FFFFFF;
    font-size: 20px;
    font-weight: 800;
}

.banner-time {
    color: #F7F719;
    font-size: 32px;
    font-weight: 900;
}

.banner-tag {
    position: absolute;
    background: #FF1AD0;
    color: white;
    padding: 4px 12px;
    border-radius: 16px;
    font-size: 14px;
    font-weight: 700;
    transform: rotate(4deg);
    margin-bottom: 8px;
    height: 32px;
    line-height: 24px;
    top: -25px;
    margin-left: 155px;
    /* 留出空间给尖尖 */
}

/* 底部居中的尖尖 */
.banner-tag::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid #FF1AD0;
}

.buy-button {
    background: linear-gradient(to right, #AD5CFF, #FF1AD0);
    width: 180px;
    height: 52px;
    border-radius: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: white;
    cursor: pointer;
    /* transition: transform 0.2s; */
    margin-top: 40px;
}

.buy-button:active {
    transform: scale(0.95);
}

.current-price {
    font-size: 20px;
    font-weight: 800;
}

.original-price {
    font-size: 14px;
    text-decoration: line-through;
    opacity: 0.6;
}

.close-btn {
    margin-top: 40px;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.close-icon {
    color: white;
    font-size: 30px;
}
</style>
