<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useCallStore } from '@/stores/callStore';
import { storeToRefs } from 'pinia';
import { useUserStore } from '@/stores/userStore';
import { getFlagEmoji } from '@/utils/tools';
import rtc, { EndLiveEndState } from '@/utils/MOMORTC';
import { showExitCallConfirmModal } from '@/utils/tools/modalService';
import callingSound from '@/assets/call.mp3';
import { showCoinShop } from '@/utils/tools/shopService';
import CoinBalanceBadge from '@/components/common/CoinBalanceBadge.vue';

const router = useRouter();
const route = useRoute();
const callStore = useCallStore();
const userStore = useUserStore();
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
const isFreeCall = computed(() => {
    const freeTime = Number(currentCallInfo.value?.LiveFreeTime || 0);
    const coins = Number(currentCallInfo.value?.LiveCoins || 0);
    return freeTime > 0 || coins <= 0;
});

const currentCoins = computed(() => userStore.userInfo?.Coins ?? 0);

const totalTime = 30;
/** 响铃结束时刻（墙钟），避免系统权限弹窗等场景下 setInterval 被节流导致倒计时「停住」 */
const countdownEndsAt = ref(Date.now() + totalTime * 1000);
/** 每帧刷新，驱动倒计时、圆环与波纹；从系统弹窗返回后会立刻对齐真实剩余时间 */
const timeNow = ref(Date.now());
const countdown = computed(() =>
    Math.max(0, Math.ceil((countdownEndsAt.value - timeNow.value) / 1000))
);
const countdownLabel = computed(() => `00:${String(countdown.value).padStart(2, '0')}`);

let rafId: number | null = null;
let countdownEndFired = false;

const isAnswering = ref(false);

const ringtone = new Audio(callingSound);
ringtone.loop = true;

const goBack = () => {
    if (rtc.isCaller) {
        showExitCallConfirmModal(() => {
            rtc.endStreamSession("Caller cancel call", EndLiveEndState.hangUpByClick);
        });
    } else {
        // Callee explicitly rejects the call
        rtc.endStreamSession("Callee reject call", EndLiveEndState.hangUpByClick);
    }
};

function syncClockFromWallTime() {
    timeNow.value = Date.now();
}

function onVisibilityChange() {
    if (document.visibilityState === 'visible') {
        syncClockFromWallTime();
    }
}

function tickCallPage() {
    timeNow.value = Date.now();

    const remainSec = Math.max(0, (countdownEndsAt.value - timeNow.value) / 1000);
    if (remainSec <= 0 && !isAnswering.value && !countdownEndFired) {
        countdownEndFired = true;
        if (rtc.isCaller) {
            rtc.endStreamSession("对方超时未接听，自动挂断", EndLiveEndState.notSelfHangUp);
        } else {
            rtc.handleRemoteHangup();
        }
        return;
    }

    rafId = requestAnimationFrame(tickCallPage);
}

onMounted(() => {
    countdownEndsAt.value = Date.now() + totalTime * 1000;
    countdownEndFired = false;

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pageshow', syncClockFromWallTime);

    // 自动播放铃声 (部分浏览器需要用户手势后才允许，但移动端呼叫通常会放宽或由 Webview 接管)
    ringtone.play().catch(err => console.warn("[Audio] Autoplay ringtone blocked:", err));

    rafId = requestAnimationFrame(tickCallPage);
});

const answerCall = () => {
    // 标记为正在接听，不再主动停计时器（保持动画），同时防止倒计时逻辑冲突
    isAnswering.value = true;
    ringtone.pause();
    rtc.answerCall();
};

onUnmounted(() => {
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('pageshow', syncClockFromWallTime);
    if (rafId != null) {
        cancelAnimationFrame(rafId);
        rafId = null;
    }
    ringtone.pause();
});
</script>

<template>
    <div class="call-page">
        <!-- Background Image (Using HeadImage as fallback for Cover) -->
        <img :src="anchor.HeadImage" alt="bg" class="bg-img" />

        <!-- Top & Bottom Gradient Overlay for readability -->
        <div class="gradient-top"></div>
        <div class="gradient-bottom"></div>

        <div class="top-bar">
            <button class="back-btn" @click="goBack">
                <img src="@/assets/back_arrow.png" alt="Back" class="back-icon" />
            </button>

            <div class="top-user-card">
                <img :src="anchor.HeadImage" alt="Avatar" class="top-avatar" />
                <div class="top-name-row">
                    <span class="top-name">{{ anchor.Nickname }}</span>
                    <span v-if="anchor.CountryCode" class="top-flag">{{ getFlagEmoji(anchor.CountryCode) }}</span>
                </div>
            </div>

            <button class="top-call-btn" @click="goBack" aria-label="End call">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                        d="M6.8 10.6c2.9-1.7 7.5-1.7 10.4 0 .6.4 1 1.1.8 1.8l-.5 2.1c-.1.5-.5.8-1 .8h-3c-.5 0-.9-.3-1-.8l-.3-1.4c-.1-.3-.3-.5-.6-.5s-.5.2-.6.5l-.3 1.4c-.1.5-.5.8-1 .8h-3c-.5 0-.9-.3-1-.8l-.5-2.1c-.2-.7.1-1.4.8-1.8Z"
                        fill="currentColor" />
                </svg>
            </button>
        </div>

        <div class="call-bottom-status" :class="{ incoming: callState === 'incoming' }">
            <CoinBalanceBadge
                :coins="currentCoins"
                :config="{ showAdd: true, interactive: true, ariaLabel: 'Open coin shop' }"
                @click="showCoinShop"
            />

            <button v-if="callState === 'incoming'" class="accept-button" @click="answerCall">
                <span v-if="isFreeCall" class="free-ribbon">FREE</span>
                <svg viewBox="0 0 24 24" aria-hidden="true" class="accept-icon">
                    <path
                        d="M4 8.4c0-1.3 1.1-2.4 2.4-2.4h7.2c1.3 0 2.4 1.1 2.4 2.4v7.2c0 1.3-1.1 2.4-2.4 2.4H6.4C5.1 18 4 16.9 4 15.6V8.4Zm13.2 2.2 2.8-2c.7-.5 1.7 0 1.7.9v5c0 .9-1 1.4-1.7.9l-2.8-2v-2.8Z"
                        fill="currentColor" />
                </svg>
                <span>Accept</span>
            </button>

            <div class="status-copy">
                <div class="timer-text">{{ countdownLabel }}</div>
                <div v-if="callState === 'incoming'" class="sub-text">Connecting your call. Please wait...</div>
                <div v-else class="charge-row">
                    <span>You’ll be charged</span>
                    <img src="@/assets/coin_icon.png" alt="" class="small-coin" />
                    <span v-if="oldCoins" class="old-price">{{ oldCoins }}</span>
                    <span>{{ callCoins }} coins per time.</span>
                </div>
            </div>
        </div>

        <!-- Pagination dots placeholder -->
        <!-- <div class="pagination-dots">
            <span class="dot active"></span>
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
        </div> -->
    </div>
</template>


<style scoped>
.call-page {
    position: relative;
    width: 100%;
    min-height: 100vh;
    background-color: #14121f;
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
    height: 375px;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.88) 0%, rgba(0, 0, 0, 0) 100%);
    pointer-events: none;
}

.top-bar {
    position: absolute;
    top: calc(12px + env(safe-area-inset-top, 0px));
    left: 20px;
    right: 20px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    z-index: 10;
    gap: 8px;
}

.back-btn {
    width: 28px;
    height: 28px;
    border-radius: 14px;
    background: transparent;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
    flex-shrink: 0;
}

.back-icon {
    width: 28px;
    height: 28px;
    filter: brightness(0) invert(1);
}

.top-user-card {
    min-width: 0;
    height: 32px;
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
}

.top-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
}

.top-name-row {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 3px;
}

.top-name {
    max-width: 176px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #fff;
    font-size: 15px;
    font-weight: 700;
}

.top-flag {
    font-size: 16px;
    line-height: 1;
}

.top-call-btn {
    width: 52px;
    height: 36px;
    border-radius: 18px;
    border: none;
    background: rgba(26, 26, 26, 0.34);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    cursor: pointer;
}

.top-call-btn svg {
    width: 24px;
    height: 24px;
}

.call-bottom-status {
    position: absolute;
    left: 20px;
    right: 20px;
    bottom: calc(46px + var(--app-safe-bottom, 0px));
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.accept-button {
    position: relative;
    width: min(260px, calc(100vw - 80px));
    height: 52px;
    margin-top: 18px;
    border: none;
    border-radius: 18px;
    background: linear-gradient(100deg, #c8f24e 0%, #78eb3f 100%);
    color: #1a1a1a;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 17px;
    font-weight: 800;
    cursor: pointer;
}

.accept-icon {
    width: 28px;
    height: 28px;
}

.free-ribbon {
    position: absolute;
    right: 15px;
    top: -18px;
    min-width: 70px;
    height: 34px;
    border-radius: 12px;
    background: #ffb13d;
    color: #ffffe5;
    font-size: 18px;
    font-weight: 900;
    font-style: italic;
    line-height: 34px;
    text-align: center;
    box-shadow: 0 2px 4px rgba(236, 126, 46, 0.45);
}

.status-copy {
    margin-top: 16px;
    text-align: center;
}

.timer-text {
    color: #fff;
    font-size: 16px;
    line-height: 20px;
    font-weight: 700;
}

.sub-text,
.charge-row {
    margin-top: 8px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 14px;
    line-height: 18px;
    font-weight: 500;
}

.charge-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 3px;
    flex-wrap: wrap;
}

.small-coin {
    width: 14px;
    height: 14px;
    object-fit: contain;
}

.old-price {
    text-decoration: line-through;
    color: rgba(255, 255, 255, 0.46);
}
</style>
