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

interface ChatMessage {
    id: string;
    text: string;
    isMe: boolean;
}

// 通话开始时间
const startTime = Date.now();

// 锁定页面高度，防止键盘弹出修改视口
const pageHeight = ref(`${window.innerHeight}px`);

// 页面挂载时加入频道并发布
onMounted(async () => {
    console.log("[VideoPage] Mounted. Mode:", isVideoMode.value ? 'Fake Video' : 'Real RTC');
    try {
        // 1. 尝试获取本地媒体轨道（让用户能看到自己）
        console.log("[RTC] Starting publish local tracks...");
        const tracks = await rtc.publish();
        console.log("[RTC] Local tracks published successfully.");

        await nextTick();
        // 2. 渲染本地预览
        if (tracks.video) {
            console.log("[RTC] Rendering local preview to 'local-video'...");
            tracks.video.play('local-video', { fit: 'cover', mirror: true });
        }

        // 3. 针对马甲模式的自动播放补救
        if (isVideoMode.value) {
            console.log("[VideoMode] Detected Fake Video Mode. URL:", fakeVideoUrl.value);
            const videoEl = document.querySelector('.fake-video') as HTMLVideoElement;
            if (videoEl) {
                console.log("[VideoMode] Video element found. Attempting play()...");
                videoEl.play().then(() => {
                    console.log("[VideoMode] play() Success");
                }).catch(err => {
                    console.warn("[VideoMode] play() BLOCKED by browser policy. Retrying UI muted...", err);
                    videoEl.muted = true;
                    videoEl.play().then(() => {
                        console.log("[VideoMode] muted play() Success");
                    });
                });
            } else {
                console.error("[VideoMode] ERROR: .fake-video element not found in DOM");
            }
        }
    } catch (err) {
        console.error('[VideoPage] FATAL Initialization Error:', err);
    }
});

// 监听远端视频轨道变化 (rtc.remoteVideoTrack 是响应式的)
watch(() => rtc.remoteVideoTrack.value, async (track) => {
    console.log("[RTC] << Remote Video Track Changed:", track ? 'Track Active' : 'Track NULL');
    if (track) {
        await nextTick();
        console.log("[RTC] Rendering remote stream to 'remote-video'...");
        track.play('remote-video', { fit: 'cover' })
    }
}, { immediate: true });


// 页面销毁时离开
onUnmounted(async () => {
    // 使用缓存的主播信息
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

    // 通话结束后的评价弹窗 (命令式调用)
    // 只有非主播（用户侧）才弹评价
    if (anchorData?.UserId) {
        showEvaluateCallModal({
            targetAvatar: anchorData.HeadImage,
            targetName: anchorData.Nickname,
            callDuration: durationStr,
            targetUserId: anchorData.UserId,
            liveId: cachedLiveId.value || ""
        });
    }

    await rtc.leave();
});

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

const fakeVideoUrl = computed(() => {
    // 优先尝试从 AlbumVideos 获取，如果为空则尝试可能的封面备选（根据业务逻辑调整）
    return anchor.value?.AlbumVideos?.Video || '';
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
    });
};

const inputText = ref('');
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

const preventScroll = () => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
};

const onInputFocus = () => {
    window.addEventListener('scroll', preventScroll, { passive: false });
    setTimeout(preventScroll, 50);
    setTimeout(preventScroll, 100);
    setTimeout(preventScroll, 300);
};

const onInputBlur = () => {
    window.removeEventListener('scroll', preventScroll);
    setTimeout(preventScroll, 50);
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
            <div class="local-video-container">
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
            <div class="chat-area">
                <div class="messages-list">
                    <div v-for="msg in messages" :key="msg.id"
                        :class="['message-bubble', msg.isMe ? 'message-me' : 'message-remote']">
                        {{ msg.text }}
                    </div>
                </div>
            </div>

            <!-- Connected Bottom Bar -->
            <div class="connected-bottom-bar">
                <button class="toggleCamare-button" @click="toggleCamera">
                    <img class="switch-camare" src="@/assets/call/videoSwitchCamare.png" alt="">
                </button>
                <div class="message-input-wrapper">
                    <input type="text" placeholder="Message..." class="message-input" v-model="inputText"
                        @keyup.enter="onSendText" @focus="onInputFocus" @blur="onInputBlur" />
                </div>
                <button class="circle-btn action-btn" @click="openGiftPicker"
                    style="background-color: rgba(255, 255, 255, 0.25)">
                    <img src=" @/assets/call/video-gift.png" style="width: 24px; height: 24px;" alt="">
                </button>
                <div class="coin-badge connected-coin" @click="showCoinShop">
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
    position: relative;
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

.bg-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    pointer-events: none;
}

.connected-wrapper {
    position: absolute;
    inset: 0;
    z-index: 5;
}

.connected-top-bar {
    position: absolute;
    top: 56px;
    left: 20px;
    right: 20px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    z-index: 20;
}

.connected-user-info {
    display: flex;
    align-items: center;
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
}

.country-flag {
    position: relative;
    top: 2px;
}

.connected-name {
    color: white;
    font-size: 16px;
    font-weight: 600;
    width: 150px;
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
    gap: 12px;
}

.circle-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0);
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;
}

.circle-btn img {
    width: 100%;
    height: 100%;
}

.icon-text {
    font-size: 18px;
    font-weight: bold;
}

/* Local Video PiP */
.local-video-container {
    position: absolute;
    top: 120px;
    right: 20px;
    z-index: 20;
}

.pip-controls {
    width: 32px;
    height: 32px;
    position: absolute;
    bottom: 4px;
    left: 4px;
    z-index: 21;
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
    width: 105px;
    height: 140px;
    background-color: #222;
    border-radius: 12px;
    overflow: hidden;
    position: relative;
    border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Chat Area */
.chat-area {
    position: absolute;
    bottom: 98px;
    left: 20px;
    width: 280px;
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
}

.message-bubble {
    padding: 10px 14px;
    border-radius: 16px;
    color: white;
    font-size: 14px;
    line-height: 1.4;
    word-break: break-word;
}

.message-remote {
    background: rgba(134, 59, 95, 0.85);
    align-self: flex-start;
    border-top-left-radius: 4px;
}

.message-me {
    background: rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(10px);
    align-self: flex-start;
    border-top-left-radius: 4px;
}

/* Connected Bottom Bar */
.connected-bottom-bar {
    position: absolute;
    bottom: 34px;
    left: 20px;
    right: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
    z-index: 20;
}

.action-btn {
    width: 42px;
    height: 42px;
    flex-shrink: 0;
}

.message-input-wrapper {
    flex: 1;
    height: 42px;
    background: rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(10px);
    border-radius: 21px;
    padding: 0 16px;
    display: flex;
    align-items: center;
}

.message-input {
    background: transparent;
    border: none;
    outline: none;
    color: white;
    width: 100%;
    font-size: 14px;
}

.message-input::placeholder {
    color: rgba(255, 255, 255, 0.6);
}

.coin-badge.connected-coin {
    height: 42px;
    border-radius: 21px;
    padding: 0 8px;
    background: rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(10px);
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
}

.toggleCamare-button {
    width: 40px;
    height: 40px;
    background-color: rgba(255, 255, 255, 0.25);
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
</style>
