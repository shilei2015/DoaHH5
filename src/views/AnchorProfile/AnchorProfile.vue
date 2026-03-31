<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getFlagEmoji, getAge } from '@/utils/tools';
import { API } from '@/utils/net/api';
import { post } from '@/utils/net/request';
import HUD from '@/components/HUD';
import type { AnchorInfoModel } from '@/components/appModels/AnchorInfoModel';
import { showImagePreview } from '@/utils/imagePreview';
import MOMORTC from '@/utils/MOMORTC';
import { generateSessionId } from '@/utils/msg/MessageModel';
import { showUserActionModal } from '@/utils/tools/modalService';

const route = useRoute();
const router = useRouter();

const anchorInfo = ref<AnchorInfoModel | null>(null);

const statusInfo = computed(() => {
    switch (anchorInfo.value?.OnlineState) {
        case '1': return { text: 'Online', colorClass: 'is-online' };
        case '2': return { text: 'Busy', colorClass: 'is-busy' };
        default: return { text: 'Offline', colorClass: 'is-offline' };
    }
});

// 相册轮播状态
const activeIndex = ref(0);
const displayAlbums = computed(() => {
    if (anchorInfo.value?.Albums && anchorInfo.value.Albums.length > 0) {
        return anchorInfo.value.Albums;
    }
    if (anchorInfo.value?.HeadImage) {
        return [anchorInfo.value.HeadImage];
    }
    return [];
});

const handleScroll = (e: Event) => {
    const target = e.target as HTMLElement;
    if (target.clientWidth > 0) {
        activeIndex.value = Math.round(target.scrollLeft / target.clientWidth);
    }
};

const handleImageClick = (index: number) => {
    showImagePreview(displayAlbums.value, index);
};

const fetchAnchorData = async (userId: string) => {
    try {
        const res = await post(API.user_info, { UserId: userId, Visitor: "1" });
        if (res.code === "0") {
            const anchor = res.data.Anchor;
            // 将 "0"/"1" 字符串转成布尔值
            anchor.IsLike = anchor.IsLike === "1" || anchor.IsLike === true;
            anchorInfo.value = anchor;
        }
    } finally {
    }
}

const canClickLike = ref(true)
const likeAnchor = async () => {
    // 修复这里的逻辑：如果已经点赞了（IsLike 为 true），则直接 return
    if (!canClickLike.value || anchorInfo.value?.IsLike) {
        return
    }
    canClickLike.value = false
    try {
        const res = await post(API.likeUser, { UserId: anchorInfo.value?.UserId });
        if (res.code === "0" && anchorInfo.value) {
            anchorInfo.value.IsLike = true
        }
    } finally {
        canClickLike.value = true
    }
}

onMounted(() => {
    const id = route.query.id as string;
    if (id) {
        fetchAnchorData(id);
    }
});

const goBack = () => {
    router.back();
};

const goMessage = () => {
    router.push({
        name: "messageDetail",
        query: {
            userId: anchorInfo.value?.UserId || "",
        }
    })
}

const clickActionMore = () => {
    showUserActionModal(route.query.id as string, {})
}

</script>

<template>
    <div class="profile-page">
        <template v-if="anchorInfo">

            <!-- 顶部导航栏 -->
            <div class="nav-bar">
                <button class="icon-btn" @click="goBack">
                    <img src="@/assets/profile/close_icon.svg" alt="Close" />
                </button>
                <div class="title-area">
                    <div class="name-age">{{ anchorInfo.Nickname }}, {{ getAge(anchorInfo.Birthday) }}</div>
                    <div class="status-row">
                        <span class="flag">{{ getFlagEmoji(anchorInfo.CountryCode) }}</span>
                        <span class="country">{{ anchorInfo.Country }}</span>
                        <span class="dot" :class="statusInfo.colorClass">·</span>
                        <span class="online-status" :class="statusInfo.colorClass">
                            {{ statusInfo.text }}
                        </span>
                    </div>
                </div>
                <button class="icon-btn" @click="clickActionMore">
                    <img src="@/assets/profile/report_icon.svg" alt="Report" />
                </button>
            </div>

            <!-- 中间大图封面区 (轮播相册) -->
            <div class="cover-section">
                <div class="carousel-container" @scroll="handleScroll">
                    <img v-for="(imgUrl, index) in displayAlbums" :key="index" :src="imgUrl" class="carousel-slide"
                        alt="Cover" @click="handleImageClick(index)" />
                </div>

                <div class="cover-gradient"></div>

                <!-- 轮播指示器 -->
                <div class="pagination-dots" v-if="displayAlbums.length > 1">
                    <span v-for="(_, index) in displayAlbums" :key="index" class="dot"
                        :class="{ active: activeIndex === index }">
                    </span>
                </div>

                <!-- 底部浮动按钮区 -->
                <div class="action-buttons">
                    <!-- 私信按钮 -->
                    <button class="action-btn msg-btn" @click="goMessage">
                        <div class="msg-circle">
                            <img src="@/assets/profile/msg_icon.svg" alt="Message" />
                        </div>
                    </button>

                    <!-- 视频通话按钮 (居中大尺寸) -->
                    <button class="action-btn call-btn" @click="MOMORTC.startAnchorCall(anchorInfo.UserId)">
                        <img src="@/assets/profile/video_call_btn.svg" alt="Video Call" />
                    </button>

                    <!-- 心形关注按钮 -->
                    <button class="action-btn heart-btn" @click="likeAnchor">
                        <div class="heart-circle">
                            <img v-if="anchorInfo.IsLike" src="@/assets/profile/heart_liked.svg" />
                            <img v-else src="@/assets/profile/heart_icon.png" alt="Favorite" />
                        </div>
                    </button>
                </div>
            </div>

            <!-- 底部资料区 -->
            <div class="about-section">
                <h2 class="about-title">About me</h2>
                <p class="about-desc">
                    {{ anchorInfo.Introduce || "" }}
                </p>
            </div>

        </template>
        <template v-else>
            <!-- Lightweight loading state for smooth transition -->
            <div class="inner-loading">
                <van-loading type="spinner" color="#FF1AD0" />
            </div>
        </template>
    </div>
</template>

<style scoped>
.profile-page {
    width: 100%;
    height: 100vh;
    background-color: white;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    /* 适配 iOS 安全区域 */
    padding-top: 54px;
}

/* 导航栏 */
.nav-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
    height: 44px;
    margin-bottom: 6px;
}

.icon-btn {
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.icon-btn img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.title-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.name-age {
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 16px;
    font-weight: 700;
    color: black;
    line-height: 20px;
}

.status-row {
    font-family: system-ui, -apple-system, sans-serif;
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;
    line-height: 18px;
}

.country {
    color: #808080;
    font-weight: 500;
}

.dot {
    margin: 0 4px;
}

/* 状态颜色：Online */
.dot.is-online,
.online-status.is-online {
    color: #5EE413;
}

/* 状态颜色：Busy */
.dot.is-busy,
.online-status.is-busy {
    color: #ff8000;
}

/* 状态颜色：Offline */
.dot.is-offline,
.online-status.is-offline {
    color: #cccccc;
}

.online-status {
    font-weight: 600;
}

/* 封面区与相册轮播 */
.cover-section {
    position: relative;
    width: calc(100% - 24px);
    /* 两侧留白 */
    margin: 0 auto;
    aspect-ratio: 363 / 546;
    border-radius: 28px;
    background-color: #f0f0f0;
    /* 加载时有底色 */
    /* 为了让底部的跨界按钮能够溢出并显示，不使用 overflow: hidden */
}

/* 轮播滑动容器 */
.carousel-container {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
    /* Firefox */
    border-radius: 28px;
    /* 切边圆角 */
}

.carousel-container::-webkit-scrollbar {
    display: none;
    /* Safari and Chrome */
}

.carousel-slide {
    flex: 0 0 100%;
    width: 100%;
    height: 100%;
    scroll-snap-align: start;
    object-fit: cover;
    display: block;
}

.cover-gradient {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 160px;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.5) 100%);
    border-bottom-left-radius: 28px;
    border-bottom-right-radius: 28px;
    pointer-events: none;
}

.pagination-dots {
    position: absolute;
    bottom: 54px;
    /* 避开悬浮按钮的位置 */
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 6px;
}

.pagination-dots .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.4);
    transition: all 0.3s ease;
}

.pagination-dots .dot.active {
    background-color: white;
    width: 16px;
    border-radius: 3px;
}

/* 悬浮操作按钮区 */
.action-buttons {
    position: absolute;
    bottom: -32px;
    /* 水平骑缝在底部 */
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: space-evenly;
    padding: 0 20px;
    z-index: 10;
}

.action-btn {
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    transition: transform 0.2s;
}

.action-btn:active {
    transform: scale(0.92);
}

.msg-circle {
    width: 50px;
    height: 50px;
    background-color: #FFCD00;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 10px rgba(255, 205, 0, 0.3);
}

.msg-circle img {
    width: 24px;
    height: 24px;
}

.call-btn {
    width: 78px;
    height: 78px;
}

.call-btn img {
    width: 100%;
    height: 100%;
    display: block;
}

.heart-circle {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 10px rgba(255, 240, 245, 0.5);
}

.heart-circle img {
    width: 100%;
    height: 100%;
}

/* 关于我资料区 */
.about-section {
    padding: 50px 20px 20px 20px;
    /* 给上面的悬浮按钮留出充足的点击空间 */
    flex: 1;
}

.about-title {
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 16px;
    font-weight: 700;
    color: black;
    margin-bottom: 12px;
}

.about-desc {
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    color: #4d4d4d;
    line-height: 22px;
    font-weight: 510;
}

.inner-loading {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: white;
}
</style>
