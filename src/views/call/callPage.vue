<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

const userId = route.query.id as string;

// Mock data
const anchor = ref({
    Nickname: 'Charlotte',
    Age: 29,
    Country: 'Austria',
    CountryCode: 'AT', // e.g.
    HeadImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200',
    CoverImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600&h=1200'
});

const coins = ref(405);
const totalTime = 30;
const countdown = ref(totalTime);
const circleProgress = computed(() => {
    const percent = (countdown.value / totalTime) * 100;
    return `${percent}, 100`;
});
let timer: ReturnType<typeof setInterval> | null = null;

const goBack = () => {
    router.back();
};

onMounted(() => {
    timer = setInterval(() => {
        if (countdown.value > 0) {
            countdown.value--;
        } else {
            if (timer) clearInterval(timer);
        }
    }, 1000);
});

onUnmounted(() => {
    if (timer) clearInterval(timer);
});
</script>

<template>
    <div class="call-page">
        <!-- Background Image -->
        <img :src="anchor.CoverImage" alt="bg" class="bg-img" />

        <!-- Top & Bottom Gradient Overlay for readability -->
        <div class="gradient-top"></div>
        <div class="gradient-bottom"></div>

        <!-- Top Bar Area -->
        <div class="top-bar">
            <!-- Back Button -->
            <button class="back-btn" @click="goBack">
                <img src="@/assets/profile/back_arrow.png" alt="Back" class="back-icon" />
            </button>

            <!-- Coin Balance -->
            <div class="coin-badge">
                <img src="@/assets/profile/diamond_icon.png" alt="Diamond" class="diamond-icon" />
                <span class="coin-text">{{ coins }}</span>
                <div class="add-btn">
                    <img src="@/assets/profile/add_icon.svg" alt="Add" class="add-icon" />
                </div>
            </div>
        </div>

        <!-- Call Info Box (Glassmorphism Bottom Area) -->
        <div class="info-box-wrapper">
            <div class="info-box">
                <!-- User Info Row -->
                <div class="user-info-row">
                    <img :src="anchor.HeadImage" alt="Avatar" class="avatar" />
                    <div class="user-details">
                        <div class="name-age">{{ anchor.Nickname }}, {{ anchor.Age }}</div>
                        <div class="country-row">
                            <span class="flag">🇦🇹</span>
                            <span class="country-text">{{ anchor.Country }}</span>
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
                    <img src="@/assets/profile/diamond_icon.png" alt="Diamond" class="small-diamond" />
                    <span class="old-price">160</span>
                    <span class="new-price">100 coins per time</span>
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

/* Info Box */
.info-box-wrapper {
    position: absolute;
    bottom: 98px;
    /* Room for dots and home indicator */
    left: 20px;
    right: 20px;
    z-index: 10;
}

.info-box {
    background: rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: 24px;
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
</style>
