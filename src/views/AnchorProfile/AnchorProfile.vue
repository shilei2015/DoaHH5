<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getFlagEmoji, getAge } from '@/utils/tools';
import { API } from '@/utils/net/api';
import { post } from '@/utils/net/request';
import type { AnchorInfoModel } from '@/components/appModels/AnchorInfoModel';
import { showImagePreview } from 'vant';
import MOMORTC from '@/utils/MOMORTC';
import { showUserActionModal } from '@/utils/tools/modalService';
import { normalizeImageCdnUrls } from '@/utils/imageFallback';

const route = useRoute();
const router = useRouter();

const anchorInfo = ref<AnchorInfoModel | null>(null);

const statusInfo = computed(() => {
    switch (anchorInfo.value?.OnlineState) {
        case '1': return { text: 'Online', colorClass: 'is-online', dotColor: '#76f337' };
        case '2': return { text: 'Busy', colorClass: 'is-busy', dotColor: '#ffa339' };
        default: return { text: 'Offline', colorClass: 'is-offline', dotColor: '#d8d8d8' };
    }
});

const displayAge = computed(() => {
    const birthdayAge = getAge(anchorInfo.value?.Birthday);
    if (birthdayAge > 0) {
        return String(birthdayAge);
    }

    const apiAge = Number(anchorInfo.value?.Age);
    return Number.isFinite(apiAge) && apiAge > 0 ? String(Math.floor(apiAge)) : "";
});

const isMale = computed(() => anchorInfo.value?.Gender === '1');

const ageChipClass = computed(() => isMale.value ? 'male-chip' : 'age-chip');

// 相册轮播状态
const activeIndex = ref(0);
const displayAlbums = computed(() => {
    if (anchorInfo.value?.Albums && anchorInfo.value.Albums.length > 0) {
        return normalizeImageCdnUrls(anchorInfo.value.Albums);
    }
    if (anchorInfo.value?.HeadImage) {
        return normalizeImageCdnUrls([anchorInfo.value.HeadImage]);
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
    //     showImagePreview(displayAlbums.value, index);
    showImagePreview({ loop: false, images: displayAlbums.value, startPosition: index })
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
        <div v-if="anchorInfo" class="profile-scroll-content">

            <!-- 顶部导航栏 -->
            <div class="nav-bar">
                <button class="icon-btn" @click="goBack">
                    <img class="icon-back" src="@/assets/anchor_profile_back.svg" alt="Back" />
                </button>
                <button class="icon-btn" @click="clickActionMore">
                    <img class="icon-more" src="@/assets/anchor_profile_more.svg" alt="More" />
                </button>
            </div>

            <!-- 中间大图封面区 (轮播相册) -->
            <div class="cover-section">
                <div class="carousel-container" @scroll="handleScroll">
                    <img v-for="(imgUrl, index) in displayAlbums" :key="index" :src="imgUrl" class="carousel-slide"
                        alt="Cover" @click="handleImageClick(index)" />
                </div>

                <div class="cover-top-gradient"></div>
                <div class="cover-gradient"></div>

                <div class="hero-status-badge" :class="statusInfo.colorClass">
                    <span class="hero-status-dot" :style="{ backgroundColor: statusInfo.dotColor }"></span>
                    <span>{{ statusInfo.text }}</span>
                </div>

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
                            <img class="chat-icon" src="@/assets/anchor_profile_chat.svg" alt="Message" />
                        </div>
                        <span>Chat</span>
                    </button>

                    <!-- 视频通话按钮 (居中大尺寸) -->
                    <button class="action-btn call-btn" @click="MOMORTC.startAnchorCall(anchorInfo.UserId)">
                        <img class="video-icon" src="@/assets/anchor_profile_video.svg" alt="Video Call" />
                        <span>Video Chat</span>
                    </button>
                </div>
            </div>

            <!-- 底部资料区 -->
            <div class="about-section">
                <div class="profile-summary">
                    <div class="summary-main">
                        <h1 class="profile-name">{{ anchorInfo.Nickname }}</h1>
                        <div class="summary-chips">
                            <span v-if="displayAge" class="summary-chip" :class="ageChipClass">
                                <img v-if="isMale" class="gender-icon" src="@/assets/anchor_profile_male.svg" alt="" />
                                <img v-else class="gender-icon" src="@/assets/anchor_profile_female.svg" alt="" />
                                {{ displayAge }}
                            </span>
                            <span v-if="anchorInfo.Country" class="summary-chip country-chip">
                                <span class="flag">{{ getFlagEmoji(anchorInfo.CountryCode) }}</span>
                                {{ anchorInfo.Country }}
                            </span>
                        </div>
                    </div>
                    <button class="summary-like" @click="likeAnchor">
                        <img v-if="anchorInfo.IsLike" class="liked-icon" src="@/assets/heart_liked.svg" alt="Liked" />
                        <img v-else src="@/assets/anchor_profile_heart.svg" alt="Favorite" />
                    </button>
                </div>
                <h2 class="about-title">About Me</h2>
                <p class="about-desc">
                    {{ anchorInfo.Introduce || "" }}
                </p>
            </div>

        </div>
        <template v-else>
            <!-- Lightweight loading state for smooth transition -->
            <div class="inner-loading">
                <van-loading type="spinner" color="#65D941" />
            </div>
        </template>
    </div>
</template>

<style scoped>
.profile-page {
    width: 100%;
    height: 100vh;
    height: 100dvh;
    background-color: #1a1a1a;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    padding-top: 0;
}

.profile-scroll-content {
    width: 100%;
    min-height: calc(100% + 1px);
    display: flex;
    flex-direction: column;
    flex: 0 0 auto;
}

/* 导航栏 */
.nav-bar {
    position: fixed;
    top: calc(12px + env(safe-area-inset-top, 0px));
    left: 0;
    right: 0;
    z-index: 20;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
    height: 28px;
    margin-bottom: 0;
}

.icon-btn {
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.icon-btn img {
    display: block;
    object-fit: contain;
}

.icon-back {
    width: 28px;
    height: 28px;
}

.icon-more {
    width: 23.333px;
    height: 5.556px;
}

/* 封面区与相册轮播 */
.cover-section {
    position: relative;
    width: 100%;
    margin: 0;
    height: min(66.5vh, 540px);
    height: min(66.5dvh, 540px);
    min-height: 500px;
    border-radius: 0;
    background-color: #242424;
    overflow: hidden;
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
    border-radius: 0;
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
    height: 100px;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0) 100%);
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    pointer-events: none;
}

.cover-top-gradient {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 120px;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0) 100%);
    pointer-events: none;
}

.hero-status-badge {
    position: absolute;
    left: 20px;
    bottom: 36px;
    z-index: 4;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 28px;
    padding: 0 10px 0 8px;
    border-radius: 16px;
    background: rgba(0, 0, 0, 0.4);
    font-size: 14px;
    font-weight: 600;
    line-height: 28px;
}

.hero-status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex: 0 0 6px;
}

.hero-status-badge.is-online {
    color: #76f337;
}

.hero-status-badge.is-busy {
    color: #ffa339;
}

.hero-status-badge.is-offline {
    color: #d8d8d8;
}

.pagination-dots {
    position: absolute;
    bottom: 46px;
    right: 20px;
    z-index: 4;
    display: flex;
    align-items: center;
    gap: 6px;
}

.pagination-dots .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.4);
    transition: all 0.3s ease;
    margin: 0;
}

.pagination-dots .dot.active {
    background-color: white;
    width: 8px;
    height: 8px;
    border-radius: 50%;
}

/* 悬浮操作按钮区 */
.action-buttons {
    position: fixed;
    bottom: calc(8px + var(--app-safe-bottom, 0px));
    left: 20px;
    right: 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0;
    z-index: 30;
    gap: 12px;
}

.action-btn {
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    transition: transform 0.2s;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif;
}

.action-btn:active {
    transform: scale(0.92);
}

.msg-btn,
.call-btn {
    height: 52px;
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 17px;
    font-weight: 700;
    color: #1a1a1a;
    line-height: normal;
}

.msg-btn {
    width: 120px;
    background: #ffe539;
}

.call-btn {
    flex: 1;
    background: linear-gradient(90deg, #c8f24e 0%, #78eb3f 100%);
}

.chat-icon {
    width: 28px;
    height: 28px;
    display: block;
    object-fit: contain;
}

.video-icon {
    width: 26px;
    height: 16.679px;
    display: block;
    object-fit: contain;
}

.msg-circle {
    display: flex;
    align-items: center;
    justify-content: center;
}

/* 关于我资料区 */
.about-section {
    position: relative;
    z-index: 5;
    margin-top: -24px;
    padding: 20px 20px calc(118px + var(--app-safe-bottom, 0px));
    flex: 1;
    background: #1a1a1a;
    border-radius: 24px 24px 0 0;
}

.profile-summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    margin-bottom: 30px;
}

.summary-main {
    min-width: 0;
    flex: 1 1 auto;
}

.profile-name {
    margin: 0 0 16px;
    color: #fff;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif;
    font-size: 20px;
    line-height: 20px;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.summary-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.summary-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 28px;
    padding: 0 8px 0 7px;
    border-radius: 16px;
    background: #292929;
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    line-height: 16px;
    white-space: nowrap;
}

.summary-chip .gender-icon {
    width: 16px;
    height: 16px;
    display: block;
    object-fit: contain;
}

.age-chip {
    color: #ff7aff;
}

.male-chip {
    color: #47d4ff;
}

.flag {
    font-size: 14px;
    line-height: 1;
}

.summary-like {
    width: 52px;
    height: 52px;
    border: none;
    border-radius: 50%;
    background: #333;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    flex: 0 0 52px;
}

.summary-like img {
    width: 28px;
    height: 28px;
    object-fit: contain;
}

.summary-like .liked-icon {
    width: 52px;
    height: 52px;
}

.about-title {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif;
    font-size: 16px;
    font-weight: 700;
    color: #fff;
    line-height: 20px;
    margin: 0 0 12px;
    display: inline-flex;
    flex-direction: column;
    gap: 4px;
}

.about-title::after {
    content: "";
    width: 77px;
    height: 3px;
    border-radius: 2px;
    background: #65d941;
}

.about-desc {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif;
    font-size: 15px;
    color: rgba(255, 255, 255, 0.5);
    line-height: 24px;
    font-weight: 500;
    margin: 0;
    white-space: pre-wrap;
}

.inner-loading {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #1a1a1a;
}
</style>
