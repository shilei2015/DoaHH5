<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useCallStore } from '@/stores/callStore';
import { storeToRefs } from 'pinia';

const router = useRouter();
const route = useRoute();
const callStore = useCallStore();
const { currentCallInfo } = storeToRefs(callStore);

const callRole = (route.query.role as string) || 'caller';
type CallState = 'outgoing' | 'incoming';
const callState = ref<CallState>(callRole === 'callee' ? 'incoming' : 'outgoing');

// Audio reference for ringback tone
const ringbackAudio = ref<HTMLAudioElement | null>(null);

// Use callInfo from store if available, otherwise fallback to basic route info
const anchor = computed(() => {
    if (currentCallInfo.value?.User) {
        return currentCallInfo.value.User;
    }
    return {
        Nickname: '---',
        Age: '--',
        Country: '...',
        CountryCode: '',
        HeadImage: '',
    };
});

const callCoins = computed(() => currentCallInfo.value?.LiveCoins || '0');
const oldCoins = computed(() => currentCallInfo.value?.LiveOriginalCoins || '');
const isFreeCall = computed(() => Number(currentCallInfo.value?.LiveFreeTime || 0) > 0);

const totalTime = 30;
const countdown = ref(totalTime);
const circleProgress = computed(() => {
    const percent = totalTime > 0 ? (countdown.value / totalTime) * 100 : 100;
    return `${percent}, 100`;
});
let timer: ReturnType<typeof setInterval> | null = null;

const goBack = () => {
    router.back();
};

onMounted(() => {
    // Start countdown for the call request
    timer = setInterval(() => {
        if (countdown.value > 0) {
            countdown.value--;
        } else {
            if (timer) clearInterval(timer);
        }
    }, 1000);
});

const answerCall = () => {
    if (timer) clearInterval(timer);
    router.push({ name: 'videoPage' });
};

onUnmounted(() => {
    if (timer) clearInterval(timer);
});
</script>

<template>
    <div class="call-page">
        <!-- Background Image (Using HeadImage as fallback for Cover) -->
        <img :src="anchor.HeadImage" alt="bg" class="bg-img" />

        <!-- Top & Bottom Gradient Overlay for readability -->
        <div class="gradient-top"></div>
        <div class="gradient-bottom"></div>

        <!-- Top Bar Area -->
        <div class="top-bar">
            <!-- Back Button -->
            <button class="back-btn" @click="goBack">
                <img src="@/assets/profile/back_arrow.png" alt="Back" class="back-icon" />
            </button>

            <!-- Coin Balance (Placeholder for actual balance, currently showing price/info) -->
            <div class="coin-badge">
                <img src="@/assets/setting/ic_diamond.png" alt="Diamond" class="diamond-icon" />
                <span class="coin-text">{{ callCoins }}</span>
                <div class="add-btn">
                    <img src="@/assets/setting/ic_wallet_bg.svg" alt="Add" class="add-icon" />
                </div>
            </div>
        </div>

        <!-- Incoming specific UI -->
        <div v-if="callState === 'incoming'" class="incoming-wrapper">
            <div v-if="isFreeCall" class="free-call-text">✨ Free Call ✨</div>
            <div class="info-box glass-card">
                <div class="user-info-row">
                    <img :src="anchor.HeadImage" alt="Avatar" class="avatar" />
                    <div class="user-details">
                        <div class="name-age">{{ anchor.Nickname }}<span v-if="anchor.Age">, {{ anchor.Age }}</span>
                        </div>
                        <div class="country-row">
                            <span v-if="anchor.CountryCode" class="flag">{{ anchor.CountryCode }}</span>
                            <span class="country-text">{{ anchor.Country || 'Unknown' }}</span>
                        </div>
                    </div>
                    <div class="countdown-circle">
                        <svg viewBox="0 0 36 36" class="circular-chart">
                            <path class="circle-bg"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            <path class="circle" :stroke-dasharray="circleProgress"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        </svg>
                        <span class="countdown-text">{{ countdown }}</span>
                    </div>
                </div>
            </div>

            <div class="answer-btn-container" @click="answerCall">
                <div class="ripple"></div>
                <div class="ripple delay-1"></div>
                <img src="@/assets/call/callButton.png" alt="Answer" class="answer-img-btn" />
            </div>
        </div>

        <!-- Outgoing specific UI -->
        <div v-else-if="callState === 'outgoing'" class="info-box-wrapper">
            <div class="info-box glass-card">
                <!-- User Info Row -->
                <div class="user-info-row">
                    <img :src="anchor.HeadImage" alt="Avatar" class="avatar" />
                    <div class="user-details">
                        <div class="name-age">{{ anchor.Nickname }}<span v-if="anchor.Age">, {{ anchor.Age }}</span>
                        </div>
                        <div class="country-row">
                            <span v-if="anchor.CountryCode" class="flag">{{ anchor.CountryCode }}</span>
                            <span class="country-text">{{ anchor.Country || 'Unknown' }}</span>
                        </div>
                    </div>

                    <!-- Countdown Circle -->
                    <div class="countdown-circle">
                        <svg viewBox="0 0 36 36" class="circular-chart">
                            <path class="circle-bg" d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831" />
                            <path class="circle" :stroke-dasharray="circleProgress" d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831" />
                        </svg>
                        <span class="countdown-text">{{ countdown }}</span>
                    </div>
                </div>

                <!-- Price Row -->
                <div class="price-row">
                    <span class="charge-text">You'll be charged</span>
                    <img src="@/assets/setting/ic_diamond.png" alt="Diamond" class="small-diamond" />
                    <span v-if="oldCoins" class="old-price">{{ oldCoins }}</span>
                    <span class="new-price">{{ callCoins }} coins per time</span>
                </div>
            </div>
        </div>

        <!-- Pagination dots placeholder -->
        <div class="pagination-dots">
            <span class="dot active"></span>
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
        </div>
    </div>
</template>


<style scoped>
.call-page {
    position: relative;
    width: 100%;
    min-height: 100vh;
    background-color: #000;
    overflow: hidden;
    color: white;
    font-family: system-ui, -apple-system, sans-serif;
}

.bg-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    pointer-events: none;
}

.gradient-top {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 160px;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0) 100%);
    pointer-events: none;
}

.gradient-bottom {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 340px;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0) 100%);
    pointer-events: none;
}

.top-bar {
    position: absolute;
    top: 56px;
    /* Status bar spacing */
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
    z-index: 10;
}

.back-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.back-icon {
    width: 18px;
    height: 18px;
    /* transform: rotate(90deg) if needed based on the icon used */
    filter: brightness(0) invert(1);
}

.coin-badge {
    background-color: white;
    height: 32px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    padding: 0 6px;
    gap: 4px;
}

.diamond-icon {
    width: 20px;
    height: 20px;
}

.coin-text {
    color: #ff5290;
    font-size: 16px;
    font-weight: 600;
}

.add-btn {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background-color: #ff5290;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 2px;
}

.add-icon {
    width: 100%;
    height: 100%;
    display: block;
}

.info-box-wrapper {
    position: absolute;
    bottom: 98px;
    left: 20px;
    right: 20px;
    z-index: 10;
}

.incoming-wrapper {
    position: absolute;
    bottom: 98px;
    left: 20px;
    right: 20px;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.free-call-text {
    color: #FFEA00;
    font-size: 24px;
    font-weight: 800;
    margin-bottom: 20px;
    text-shadow: 0 0 15px rgba(255, 234, 0, 0.6);
    letter-spacing: 0.5px;
}

.glass-card {
    background: rgba(255, 255, 255, 0.3) !important;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: 24px;
    width: 100%;
}

.info-box {
    padding: 20px 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.user-info-row {
    display: flex;
    align-items: center;
    width: 100%;
}

.avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
}

.user-details {
    flex: 1;
    margin-left: 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.name-age {
    font-size: 18px;
    font-weight: 600;
    color: white;
}

.country-row {
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 4px;
}

.country-text {
    font-weight: 500;
    color: white;
}

.flag {
    font-size: 14px;
}

.countdown-circle {
    position: relative;
    width: 56px;
    height: 56px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.circular-chart {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
}

.circle-bg {
    fill: none;
    stroke: rgba(255, 255, 255, 0.3);
    stroke-width: 1.5;
}

.circle {
    fill: none;
    stroke: white;
    stroke-width: 1.5;
    stroke-linecap: round;
    transition: stroke-dasharray 0.5s ease;
}

.countdown-text {
    position: relative;
    font-size: 20px;
    font-weight: 600;
    color: white;
    z-index: 1;
}

/* Price Row */
.price-row {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;
    font-weight: 500;
    color: #d9d9d9;
    padding-left: 0px;
}

.charge-text {
    margin-right: 4px;
}

.small-diamond {
    width: 16px;
    height: 16px;
    margin-right: 2px;
}

.old-price {
    text-decoration: line-through;
    color: #d9d9d9;
    margin-right: 4px;
}

.new-price {
    color: #d9d9d9;
}

/* Dots */
.pagination-dots {
    position: absolute;
    bottom: 54px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 6px;
    z-index: 10;
}

.pagination-dots .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.4);
}

.pagination-dots .dot.active {
    background-color: white;
    width: 16px;
    border-radius: 3px;
}

/* Incoming Call Styles */
.answer-btn-container {
    position: relative;
    width: 62px;
    height: 62px;
    margin-top: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.answer-img-btn {
    position: relative;
    width: 62px;
    height: 62px;
    z-index: 2;
    border-radius: 50%;
}

.ripple {
    position: absolute;
    width: 62px;
    height: 62px;
    background: rgba(255, 82, 144, 0.5);
    /* Pinkish matching the theme */
    border-radius: 50%;
    z-index: 1;
    animation: ripple-effect 2s cubic-bezier(0.24, 0, 0.38, 1) infinite;
}

.ripple.delay-1 {
    animation-delay: 1s;
}

@keyframes ripple-effect {
    0% {
        transform: scale(1);
        opacity: 0.8;
    }

    100% {
        transform: scale(2.5);
        opacity: 0;
    }
}
</style>
