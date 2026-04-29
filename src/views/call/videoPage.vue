<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useCallStore } from '@/stores/callStore';
import { useUserStore } from '@/stores/userStore';
import { storeToRefs } from 'pinia';
import rtc, { EndLiveEndState } from '@/utils/MOMORTC';
import { getFlagEmoji, translateText } from '@/utils/tools';
import { showExitCallConfirmModal, showUserActionModal, showModal, showEvaluateCallModal } from '@/utils/tools/modalService';
import ChatGiftPicker from '@/views/message/ChatDetail/messageOtherViews/ChatGiftPicker.vue';
import { getMessageManager } from '@/utils/msg/MessageManager';
import { generateSessionId, MessageType } from '@/utils/msg/MessageModel';
import { showCoinShop } from '@/utils/tools/shopService';
import { showFullScreenAnimation } from '@/utils/tools/animationService';
import type { ChatGiftModel } from '@/utils/msg/ChatGiftModel';
import { useKeyboardInset } from '@/composables/useKeyboardInset';

interface ChatMessage {
    id: string;
    text: string;
    isMe: boolean;
}

// 通话开始时间
const startTime = Date.now();

// 锁定页面高度，避免视频层随布局抖动；输入区上移通过 keyboard inset 单独处理
const pageHeight = ref(`${window.innerHeight}px`);

const { insetPx } = useKeyboardInset();
const chatAreaStyle = computed(() => ({
    bottom: `${98 + insetPx.value}px`,
}));
const bottomBarStyle = computed(() => ({
    bottom: `calc(${34 + insetPx.value}px + env(safe-area-inset-bottom, 0px))`,
}));

// 监听远端视频轨道变化 (rtc.remoteVideoTrack 是响应式的)
watch(() => rtc.remoteVideoTrack.value, async (track) => {
    console.log("[RTC] << Remote Video Track Changed:", track ? 'Track Active' : 'Track NULL');
    if (track) {
        await nextTick();
        console.log("[RTC] Rendering remote stream to 'remote-video'...");
        track.play('remote-video', { fit: 'cover' })
    }
}, { immediate: true });

const router = useRouter();
const callStore = useCallStore();
const userStore = useUserStore();
const { currentCallInfo } = storeToRefs(callStore);
const { userInfo } = storeToRefs(userStore);

// 缓存主播信息与 LiveId，防止销毁时 Store 已清空导致无法弹窗和上报
const cachedAnchor = ref<any>(null);
const cachedLiveId = ref<string>("");

watch(() => currentCallInfo.value, (val) => {
    if (val?.User) cachedAnchor.value = val.User;
    if (val?.LiveId) cachedLiveId.value = val.LiveId;
}, { deep: true, immediate: true });

const isAudioMuted = ref(false);
const coins = computed(() => userInfo.value?.Coins || '0');

const isVideoMode = computed(() => {
    return currentCallInfo.value?.User?.AnchorType === '30';
});

const anchor = computed(() => {
    return (currentCallInfo.value?.User as any) || {
        Nickname: 'Unknown',
        Age: '--',
        Country: 'Unknown',
        CountryCode: '',
        HeadImage: '',
        UserId: '',
        AlbumVideos: null,
    };
});

const fakeVideoUrl = computed(() => {
    return anchor.value?.AlbumVideos?.Video || '';
});

// --- Gift & Message Handling --- (Moved up to avoid ReferenceError)
const messageManager = getMessageManager();

const scrollToBottom = () => {
    nextTick(() => {
        const list = document.querySelector('.messages-list');
        if (list) {
            list.scrollTop = list.scrollHeight;
        }
    });
};

const handleIncomingMessage = async (message: any) => {
    const isMe = message.fromUid === userStore.userInfo?.UserId;
    if (message.msgType === MessageType.Text) {
        const transText = isMe ? message.textMessage : await translateText(message.textMessage || '')
        messages.value.push({
            id: message.messageId || Date.now(),
            text: transText || message.textMessage || '',
            isMe: isMe
        });
        scrollToBottom();
    } else if (message.msgType === MessageType.Animation) {
        // 对方发来礼物动画
        showFullScreenAnimation(message.imageObj?.urlString || '');
    }
};

// 监听主播 ID 变化动态注册/注销监听器 (解决异步 sid 不一致问题)
watch(() => anchor.value?.UserId, (newId, oldId) => {
    const myId = userStore.userInfo?.UserId;
    if (!myId || !messageManager) return;

    if (oldId) {
        const osid = generateSessionId(oldId, myId);
        messageManager.off(osid, 'received', handleIncomingMessage);
    }
    if (newId) {
        const nsid = generateSessionId(newId, myId);
        messageManager.on(nsid, 'received', handleIncomingMessage);
    }
}, { immediate: true });

const onFakeVideoEnded = () => {
    // 实际上由 RTCService 的 20s 计时器兜底，但如果视频提前结束也可在此处理
    rtc.endStreamSession("Video playback ended", EndLiveEndState.playEnd);
};

const messages = ref<ChatMessage[]>([
    // { id: 1, text: 'Connected!', isMe: false },
]);

const endCall = () => {
    if (rtc.isCaller) {
        showExitCallConfirmModal(() => {
            rtc.endStreamSession("Caller hangup", EndLiveEndState.hangUpByClick);
        });
    } else {
        rtc.endStreamSession("Callee hangup", EndLiveEndState.hangUpByClick);
    }
};

const toggleCamera = () => {
    rtc.switchCamera()
};

const toggleMask = async () => {
    await rtc.toggleVideoMask(!rtc.isVideoMasked.value);
};

const reportAnchor = () => {
    if (!anchor.value?.UserId) return;
    showUserActionModal(anchor.value.UserId, {
        onBlacklistSuccess: () => {
            rtc.endStreamSession("拉黑对方后自动挂断", EndLiveEndState.hangUpByClick);
        }
    });
};


const openGiftPicker = () => {
    showModal(ChatGiftPicker, {
        coins: Number(coins.value),
        onSend: onSendGift
    }, {
        position: 'bottom',
        round: true,
        customStyle: { background: 'transparent' }
    });
};

const inputText = ref('');
const messageInputRef = ref<HTMLInputElement | null>(null);
const isMessageInputFocused = ref(false);

const focusMessageInput = async () => {
    isMessageInputFocused.value = true;
    await nextTick();
    messageInputRef.value?.focus();
};

const handleInputBlur = () => {
    isMessageInputFocused.value = Boolean(inputText.value.trim());
};

const onSendText = async () => {
    if (!inputText.value.trim() || !anchor.value?.UserId) return;
    const fromUid = userInfo.value?.UserId || '';
    const targetUid = anchor.value.UserId;

    const msg = messageManager.newTextMessage(inputText.value, targetUid, fromUid, undefined, undefined, '2');
    inputText.value = '';

    await messageManager.messagePlant(msg, true);

    try {
        // 通话中发送消息，ChatType 为 '2'
        await messageManager.sendMessage(msg, '2');
    } catch (err) {
        console.error("Text send failed:", err);
    }
};

const onSendGift = async (gift: ChatGiftModel) => {
    if (!anchor.value?.UserId) return;
    const fromUid = userInfo.value?.UserId || '';
    const targetUid = anchor.value.UserId;

    const msg = messageManager.newGifMessage(
        gift.GiftId,
        gift.Gif,
        targetUid,
        fromUid,
        userInfo.value || undefined,
        anchor.value as any,
        '2'
    );

    try {
        // 通话中发送礼物，ChatType 为 '2'
        await messageManager.sendMessage(msg, '2');
        // 本地展示动画
        if (gift.Gif) {
            showFullScreenAnimation(gift.Gif);
        }
    } catch (err) {
        console.error("Gift send failed:", err);
    }
};

// 在声明完 isVideoMode / anchor / fakeVideoUrl 后再挂载，避免闭包顺序问题；本地预览用 DOM 节点调用 play 更稳
onMounted(async () => {
    console.log('[VideoPage] Mounted. Mode:', isVideoMode.value ? 'Fake Video' : 'Real RTC');
    try {
        const tracks = await rtc.publish();
        console.log('[RTC] Local tracks published successfully.');

        await nextTick();
        if (tracks.video) {
            const el = document.getElementById('local-video');
            if (el) {
                tracks.video.play(el, { fit: 'cover', mirror: true });
            } else {
                tracks.video.play('local-video', { fit: 'cover', mirror: true });
            }
        } else {
            console.warn('[VideoPage] No local video track (camera may be denied or unavailable).');
        }

        if (isVideoMode.value) {
            console.log('[VideoMode] Fake Video URL:', fakeVideoUrl.value);
            const videoEl = document.querySelector('.fake-video') as HTMLVideoElement;
            if (videoEl) {
                videoEl.play().then(() => {
                    console.log('[VideoMode] play() Success');
                }).catch((err) => {
                    console.warn('[VideoMode] play() blocked, retry muted', err);
                    videoEl.muted = true;
                    videoEl.play().then(() => console.log('[VideoMode] muted play() OK'));
                });
            } else {
                console.error('[VideoMode] .fake-video element not found');
            }
        }
    } catch (err) {
        console.error('[VideoPage] FATAL Initialization Error:', err);
    }
});

onUnmounted(async () => {
    const anchorData = cachedAnchor.value;
    const durationMs = Date.now() - startTime;
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    const durationStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    const targetId = anchorData?.UserId;
    if (targetId && userStore.userInfo?.UserId) {
        const sid = generateSessionId(targetId, userStore.userInfo.UserId);
        messageManager.off(sid, 'received', handleIncomingMessage);
    }

    if (anchorData?.UserId) {
        showEvaluateCallModal({
            targetAvatar: anchorData.HeadImage,
            targetName: anchorData.Nickname,
            callDuration: durationStr,
            targetUserId: anchorData.UserId,
            liveId: cachedLiveId.value || '',
        });
    }

    await rtc.leave();
});

</script>

<template>
    <div class="video-page" :style="{ height: pageHeight }">
        <!-- Background Image or Remote Video -->
        <div class="video-layer">
            <!-- 1. 正常声网 RTC 渲染层 -->
            <div v-show="!isVideoMode" class="remote-video" id="remote-video"></div>

            <!-- 2. 马甲假视频预览层 -->
            <video v-if="isVideoMode && fakeVideoUrl" class="remote-video fake-video" :src="fakeVideoUrl" autoplay muted
                loop playsinline webkit-playsinline x5-video-player-type="h5-page" @ended="onFakeVideoEnded"></video>

            <!-- 3. 容错背景（视频加载中或黑屏时显示） -->
            <div v-if="!fakeVideoUrl && isVideoMode" class="video-placeholder">
                <img :src="anchor.HeadImage" class="bg-blur" />
            </div>
        </div>
        <div class="video-gradient video-gradient-top"></div>
        <div class="video-gradient video-gradient-bottom"></div>

        <div class="connected-wrapper">
            <!-- Connected Top Bar -->
            <div class="connected-top-bar">
                <div class="connected-user-info">
                    <img :src="anchor.HeadImage" class="small-avatar" />
                    <div class="connected-details">
                        <span class="connected-name">{{ anchor.Nickname }}</span>
                        <div class="country-info">
                            <span class="country-flag">{{ getFlagEmoji(anchor.CountryCode || "cn") }}</span>
                            <span class="connected-country">{{ anchor.Country }}</span>
                        </div>
                    </div>
                </div>
                <div class="connected-actions">
                    <button class="circle-btn" @click="reportAnchor">
                        <img src="@/assets/call/videoExport.png" alt="">
                    </button>
                    <button class="circle-btn hangup-btn" @click="endCall">
                        <img src="@/assets/call/videoClose.png" alt="">
                    </button>
                </div>
            </div>

            <!-- Local Video PiP -->
            <div class="local-video-container" :class="{ 'is-masked': rtc.isVideoMasked.value }">
                <div class="pip-controls">
                    <button class="pip-btn" @click="toggleMask">
                        <img v-if="rtc.isVideoMasked.value" src="@/assets/call/video-camare-off.png" alt="">
                        <img v-else src="@/assets/call/video-camare-on.png" alt="">
                    </button>
                </div>
                <div class="local-video" id="local-video">
                    <!-- Local video track will go here -->
                </div>
            </div>

            <!-- Chat Area -->
            <div class="chat-area" :style="chatAreaStyle">
                <div class="messages-list">
                    <div v-for="msg in messages" :key="msg.id"
                        :class="['message-bubble', msg.isMe ? 'message-me' : 'message-remote']">
                        {{ msg.text }}
                    </div>
                </div>
            </div>

            <!-- Connected Bottom Bar -->
            <div class="connected-bottom-bar" :class="{ 'is-editing': isMessageInputFocused }" :style="bottomBarStyle">
                <button class="circle-btn compact-action message-mode-btn" @click="focusMessageInput">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                            d="M12 4.5c-4.4 0-8 3-8 6.8 0 2 1 3.8 2.7 5.1l-.6 2.2c-.2.6.5 1.1 1 .8l2.6-1.4c.7.2 1.5.3 2.3.3 4.4 0 8-3 8-6.9 0-3.8-3.6-6.9-8-6.9Zm-3.2 7.8a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Zm3.2 0a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Zm3.2 0a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Z"
                            fill="currentColor" />
                    </svg>
                </button>
                <button class="toggleCamare-button compact-action" @click="toggleCamera">
                    <img class="switch-camare" src="@/assets/call/videoSwitchCamare.png" alt="">
                </button>
                <button class="circle-btn compact-action mask-action" @click="toggleMask">
                    <img v-if="rtc.isVideoMasked.value" src="@/assets/call/video-camare-off.png" alt="">
                    <img v-else src="@/assets/call/video-camare-on.png" alt="">
                </button>
                <div class="message-input-wrapper">
                    <input ref="messageInputRef" type="text" placeholder="Message..." class="message-input"
                        v-model="inputText" @focus="isMessageInputFocused = true" @blur="handleInputBlur"
                        @keyup.enter="onSendText" />
                    <button class="send-message-btn" @pointerdown.prevent="onSendText">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M12 4 5.4 10.6h4.2V20h4.8v-9.4h4.2L12 4Z" fill="currentColor" />
                        </svg>
                    </button>
                </div>
                <button class="circle-btn action-btn compact-action" @click="openGiftPicker">
                    <img src="@/assets/call/video-gift.png" style="width: 24px; height: 24px;" alt="">
                </button>
                <div class="coin-badge connected-coin compact-action" @click="showCoinShop">
                    <img src="@/assets/profile/diamond_icon.svg" alt="Diamond" class="diamond-icon" />
                    <span class="coin-text">{{ coins }}</span>
                    <div class="add-btn">
                        <img src="@/assets/profile/add_icon.svg" alt="Add" class="add-icon" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.video-page {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    background-color: #000;
    overflow: hidden;
    color: white;
    font-family: system-ui, -apple-system, sans-serif;
}

.video-layer {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
}

.remote-video {
    width: 100%;
    height: 100%;
    position: absolute;
    inset: 0;
}

.remote-video :deep(video),
.local-video :deep(video),
.fake-video {
    object-fit: cover !important;
    background-color: #000;
}

.video-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.1);
    pointer-events: none;
    /* Crucial to allow interaction with video underneath if needed */
    z-index: 2;
}

.video-gradient {
    position: absolute;
    left: 0;
    right: 0;
    z-index: 3;
    pointer-events: none;
}

.video-gradient-top {
    top: 0;
    height: 200px;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0));
}

.video-gradient-bottom {
    bottom: 0;
    height: 400px;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.68), rgba(0, 0, 0, 0));
}

.bg-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    pointer-events: none;
}

.video-placeholder,
.bg-blur {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
}

.bg-blur {
    object-fit: cover;
    filter: blur(16px);
    transform: scale(1.08);
}

.connected-wrapper {
    position: absolute;
    inset: 0;
    z-index: 5;
}

.connected-top-bar {
    position: absolute;
    top: calc(56px + env(safe-area-inset-top, 0px));
    left: 20px;
    right: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 20;
}

.connected-user-info {
    display: flex;
    align-items: center;
    min-width: 0;
}

.small-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    margin-right: 8px;
    object-fit: cover;
}

.connected-details {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.country-flag {
    position: relative;
    top: 2px;
}

.connected-name {
    color: white;
    font-size: 16px;
    font-weight: 600;
    max-width: 210px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.connected-country {
    color: rgba(255, 255, 255, 0.7);
    font-size: 12px;
    margin-top: 2px;
}

.connected-actions {
    display: flex;
    gap: 16px;
    align-items: center;
    flex-shrink: 0;
}

.circle-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;
    color: #fff;
    padding: 0;
}

.circle-btn img {
    width: 100%;
    height: 100%;
}

.circle-btn svg {
    width: 24px;
    height: 24px;
}

.connected-actions .circle-btn {
    width: 28px;
    height: 28px;
    background: transparent;
}

.icon-text {
    font-size: 18px;
    font-weight: bold;
}

/* Local Video PiP */
.local-video-container {
    position: absolute;
    top: 132px;
    right: 20px;
    z-index: 20;
    border-radius: 16px;
    overflow: hidden;
}

.pip-controls {
    display: none;
}

.pip-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;
}

.text-btn {
    font-size: 14px;
    margin-top: 8px;
    /* Spacing between pip buttons */
}

.pip-btn img {
    width: 21px;
    height: 21px;
}

.local-video {
    width: 92px;
    height: 123px;
    background-color: #222;
    border-radius: 16px;
    overflow: hidden;
    position: relative;
    border: none;
}

.local-video-container.is-masked .local-video::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 16px;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(18px);
}

/* Chat Area */
.chat-area {
    position: absolute;
    left: 20px;
    width: min(300px, calc(100vw - 40px));
    max-height: 250px;
    overflow-y: auto;
    z-index: 20;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
}

.messages-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
}

.message-bubble {
    padding: 7px 12px;
    border-radius: 16px;
    color: white;
    font-size: 15px;
    line-height: 24px;
    word-break: break-word;
    max-width: 300px;
}

.message-remote {
    background: rgba(0, 0, 0, 0.3);
    align-self: flex-start;
}

.message-me {
    background: rgba(101, 217, 65, 0.4);
    align-self: flex-start;
}

/* Connected Bottom Bar */
.connected-bottom-bar {
    position: absolute;
    left: 20px;
    right: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    z-index: 20;
    min-height: 40px;
    transition: left 0.18s ease, right 0.18s ease, background-color 0.18s ease;
}

.action-btn {
    width: 40px;
    height: 40px;
    flex-shrink: 0;
}

.message-input-wrapper {
    display: none;
    flex: 1;
    height: 40px;
    background: #292929;
    border-radius: 22px;
    padding: 0 0 0 12px;
    align-items: center;
    min-width: 0;
}

.message-input {
    background: transparent;
    border: none;
    outline: none;
    color: white;
    width: 100%;
    font-size: 15px;
    line-height: 24px;
}

.message-input::placeholder {
    color: rgba(255, 255, 255, 0.6);
}

.send-message-btn {
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 20px;
    background: linear-gradient(180deg, #c8f24e 0%, #78eb3f 100%);
    color: #1a1a1a;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    padding: 0;
}

.send-message-btn svg {
    width: 28px;
    height: 28px;
}

.coin-badge.connected-coin {
    height: 40px;
    border-radius: 70px;
    padding: 0 8px;
    background: rgba(0, 0, 0, 0.3);
    border: none;
    color: white;
    display: flex;
    align-items: center;
    gap: 4px;
}

.diamond-icon {
    width: 20px;
    height: 20px;
}

.coin-text {
    font-size: 16px;
    font-weight: 600;
    color: #ffde09;
}

.add-btn {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: transparent;
    color: #ffde09;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 2px;
}

.add-icon {
    width: 100%;
    height: 100%;
    filter: brightness(0) saturate(100%) invert(86%) sepia(68%) saturate(1983%) hue-rotate(358deg) brightness(106%) contrast(102%);
}

.toggleCamare-button {
    width: 40px;
    height: 40px;
    background-color: rgba(0, 0, 0, 0.3);
    border-radius: 50%;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.switch-camare {
    width: 24px;
    height: 24px;
}

.mask-action img {
    width: 24px;
    height: 24px;
}

.message-mode-btn {
    flex-shrink: 0;
}

.compact-action {
    flex-shrink: 0;
}

.connected-bottom-bar.is-editing {
    left: 0;
    right: 0;
    min-height: 64px;
    padding: 12px 20px;
    background: #1a1a1a;
    gap: 12px;
    box-sizing: border-box;
}

.connected-bottom-bar.is-editing .compact-action {
    display: none;
}

.connected-bottom-bar.is-editing .message-input-wrapper {
    display: flex;
}
</style>
