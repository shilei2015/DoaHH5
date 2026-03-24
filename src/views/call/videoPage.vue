<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useCallStore } from '@/stores/callStore';
import { useUserStore } from '@/stores/userStore';
import { storeToRefs } from 'pinia';
import rtc from '@/utils/MOMORTC';
import { getFlagEmoji } from '@/utils/tools';
// 页面挂载时加入频道并发布
onMounted(async () => {
    try {
        // 2. 开启并发布本地音视频
        const tracks = await rtc.publish();

        // 3. 渲染本地视频到 ID 为 'local-video' 的容器
        if (tracks.video) {
            tracks.video.play('local-video');
        }
    } catch (err) {
        console.error('进入通话失败:', err);
    }
});
// 监听远端视频轨道变化 (rtc.remoteVideoTrack 是响应式的)
watch(() => rtc.remoteVideoTrack.value, (track) => {
    console.log("remoteVideoTrackChange", track);
    if (track) {
        track.play('remote-video')
    }
}, { immediate: true });
// 页面销毁时离开
onUnmounted(async () => {
    await rtc.leave();
});
const router = useRouter();
const callStore = useCallStore();
const userStore = useUserStore();
const { currentCallInfo } = storeToRefs(callStore);
const { userInfo } = storeToRefs(userStore);

const isAudioMuted = ref(false);
const coins = computed(() => userInfo.value?.Coins || '0');

// Anchor data from store
const anchor = computed(() => {
    return (currentCallInfo.value?.User as any) || {
        Nickname: 'Unknown',
        Age: '--',
        Country: 'Unknown',
        CountryCode: '',
        HeadImage: '',
    };
});

const messages = ref([
    { id: 1, text: 'Connected!', isMe: false },
]);

const endCall = () => {
    router.back();
};

const toggleCamera = () => {
    rtc.switchCamera()
};

const toggleMask = async () => {
    await rtc.toggleVideoMask(!rtc.isVideoMasked.value);
};

const reportAnchor = () => {

}

</script>

<template>
    <div class="video-page">
        <!-- Background Image or Remote Video -->
        <div class="video-layer">
            <div class="remote-video" id="remote-video">
                <!-- Standby background -->
                <!-- <div class="video-overlay"></div> -->
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
                            <span class="country-flag">{{ getFlagEmoji("cn") }}</span>
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
                    <input type="text" placeholder="Message..." class="message-input" />
                </div>
                <button class="circle-btn action-btn" style="background-color: rgba(255, 255, 255, 0.25)">
                    <img src=" @/assets/call/video-gift.png" style="width: 24px; height: 24px;" alt="">
                </button>
                <div class="coin-badge connected-coin">
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
    position: relative;
    width: 100%;
    min-height: 100vh;
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
