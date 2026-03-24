<script setup lang="ts">
import { onActivated } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { storeToRefs } from 'pinia';
import { getFlagEmoji } from '@/utils/tools';

// 导入从 Figma 下载到 setting 文件夹的真实切图
import meBg from '@/assets/setting/me_bg.png';
import defaultAvatar from '@/assets/setting/default_avatar.png';
import icEdit from '@/assets/setting/ic_edit.svg';
import icDiamond from '@/assets/setting/ic_diamond.png';
import icWalletBg from '@/assets/setting/ic_wallet_bg.svg';
import icGetMoreBg from '@/assets/setting/ic_get_more_bg.svg';
import icArrowWhite from '@/assets/setting/ic_arrow_white.png';

// 菜单图标
import icMenuLiked from '@/assets/setting/ic_menu_liked.svg';
import icMenuVisited from '@/assets/setting/ic_menu_visited.svg';
import icMenuFeedback from '@/assets/setting/ic_menu_feedback.svg';
import icMenuSettings from '@/assets/setting/ic_menu_settings.svg';
import icArrowRight from '@/assets/setting/ic_arrow_right.png';

const userStore = useUserStore();
const { userInfo } = storeToRefs(userStore);

onActivated(() => {
    userStore.updateLoginUserInfo();
});

// 菜单项配置
const menuItems = [
    { id: 1, title: 'See who liked me', icon: icMenuLiked },
    { id: 2, title: 'See who visited me', icon: icMenuVisited },
    { id: 3, title: 'Feedback', icon: icMenuFeedback },
    { id: 4, title: 'Settings', icon: icMenuSettings }
];

const handleEdit = () => {
    console.log('Edit profile');
};
</script>

<template>
    <div class="user-center-page">
        <!-- Background Layer -->
        <div class="bg-wrapper">
            <img :src="meBg" alt="" class="me-background" />
        </div>

        <div class="content">
            <!-- Header Section -->
            <header class="page-header">
                <span class="title">Me</span>
                <button class="edit-btn" @click="handleEdit">
                    <img :src="icEdit" alt="" class="edit-icon" />
                    <span>Edit</span>
                </button>
            </header>

            <!-- User Info Section -->
            <section class="user-info">
                <div class="avatar-container">
                    <img :src="userInfo?.HeadImage || defaultAvatar" alt="Avatar" class="avatar-img" />
                </div>
                <h2 class="nickname">{{ userInfo?.Nickname || 'Nickname' }}</h2>
                <div class="location-badge">
                    <span class="flag-icon">{{ getFlagEmoji(userInfo?.CountryCode) }}</span>
                    <span class="country">{{ userInfo?.Country || 'Unknown' }}</span>
                </div>
            </section>

            <!-- Statistics Grid -->
            <div class="stats-card">
                <div class="stat-box">
                    <span class="stats-label">Liked me</span>
                    <span class="stats-num">{{ userInfo?.LikeMeNumber }}</span>
                </div>
                <div class="stat-box">
                    <span class="stats-label">Visitors</span>
                    <span class="stats-num">{{ userInfo?.VisitorMeNumber }}</span>
                </div>
                <div class="stat-box">
                    <span class="stats-label">Girls I like</span>
                    <span class="stats-num">{{ userInfo?.UserLikeNumber }}</span>
                </div>
            </div>

            <!-- Wallet Banner -->
            <div class="wallet-banner">
                <div class="wallet-left">
                    <div class="diamond-icon-wrap">
                        <img :src="icWalletBg" alt="" class="wallet-bg-icon" />
                        <img :src="icDiamond" alt="Diamond" class="diamond-img" />
                    </div>
                    <span class="balance">{{ userInfo?.Coins }}</span>
                </div>
                <!-- Get More Button using Figma background asset -->
                <div class="get-more-wrap">
                    <img :src="icGetMoreBg" alt="" class="get-more-bg" />
                    <button class="get-more-btn">
                        <span>Get More</span>
                        <img :src="icArrowWhite" alt="" class="arrow-white" />
                    </button>
                </div>
            </div>

            <!-- List Menu -->
            <div class="menu-container">
                <div v-for="(item, index) in menuItems" :key="item.id" class="menu-row">
                    <div class="menu-item-content">
                        <img :src="item.icon" alt="" class="menu-icon" />
                        <span class="menu-title">{{ item.title }}</span>
                        <img :src="icArrowRight" alt="" class="chevron" />
                    </div>
                    <!-- Divider except for the last item -->
                    <div v-if="index !== menuItems.length - 1" class="divider"></div>
                </div>
            </div>
        </div>
    </div>
</template>


<style scoped>
.user-center-page {
    position: relative;
    width: 100%;
    height: 100vh; /* 设定固定高度，填满屏幕 */
    overflow-y: auto; /* 开启内部垂直滚动 */
    -webkit-overflow-scrolling: touch; /* 增强 iOS 上的滚动顺滑感 */
    background-color: #F2F1F4;
    overflow-x: hidden;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
    padding-bottom: 90px; /* 预留底部 TabBar 的空间，以免最底部内容被挡住 */
    box-sizing: border-box;
}

.bg-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 0;
    pointer-events: none;
}

.me-background {
    width: 100%;
    object-fit: cover;
}

.content {
    position: relative;
    z-index: 1;
    padding: 20px;
    padding-top: calc(20px + env(safe-area-inset-top));
}

/* Header */
.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

.title {
    font-size: 24px;
    font-weight: 900;
    font-style: italic;
    color: #1A1A1A;
}

.edit-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(10px);
    border-radius: 100px;
    border: none;
    cursor: pointer;
}

.edit-icon {
    width: 16px;
    height: 16px;
}

.edit-btn span {
    font-size: 14px;
    font-weight: 600;
    color: #1A1A1A;
}

/* User Info */
.user-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 32px;
}

.avatar-container {
    width: 110px;
    height: 110px;
    border-radius: 50%;
    overflow: hidden;
    margin-bottom: 12px;
}

.avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.nickname {
    font-size: 22px;
    font-weight: 800;
    color: #2C2C38;
    margin-bottom: 4px;
}

.location-badge {
    display: flex;
    align-items: center;
    gap: 4px;
}

.flag-icon {
    position: relative;
    top: 1px;
}

.country {
    font-size: 14px;
    color: rgba(44, 44, 56, 0.5);
    font-weight: 500;
}

/* Stats Card */
.stats-card {
    display: flex;
    justify-content: space-around;
    background: #FFFFFF;
    border-radius: 16px;
    padding: 18px 0;
    margin-bottom: 12px;
}

.stat-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}

.stats-label {
    font-size: 13px;
    color: rgba(44, 44, 56, 0.4);
    font-weight: 500;
}

.stats-num {
    font-size: 20px;
    font-weight: 800;
    color: #2C2C38;
}

/* Wallet Banner */
.wallet-banner {
    background: linear-gradient(90.2deg, #FED627 0.17%, #FF1AD0 99.85%);
    border-radius: 16px;
    height: 80px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 16px;
    margin-bottom: 12px;
    color: white;
}

.wallet-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.diamond-icon-wrap {
    position: relative;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.wallet-bg-icon {
    position: absolute;
    width: 100%;
    height: 100%;
    opacity: 0.9;
}

.diamond-img {
    position: relative;
    width: 28px;
    height: auto;
    z-index: 1;
}

.balance {
    font-size: 24px;
    font-weight: 800;
}

/* Get More Button with Asset */
.get-more-wrap {
    position: relative;
    height: 36px;
    display: flex;
    align-items: center;
}

.get-more-bg {
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 0;
}

.get-more-btn {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 4px;
    background: none;
    border: none;
    padding: 0 14px;
    color: white;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
}

.arrow-white {
    width: 12px;
    height: 12px;
}

/* Menu Container */
.menu-container {
    background: #FFFFFF;
    border-radius: 16px;
    padding: 0 16px;
    margin-bottom: 24px;
}

.menu-row {
    position: relative;
}

.menu-item-content {
    display: flex;
    align-items: center;
    height: 60px;
    cursor: pointer;
}

.menu-icon {
    width: 24px;
    height: 24px;
    margin-right: 12px;
}

.menu-title {
    flex: 1;
    font-size: 16px;
    font-weight: 600;
    color: #2C2C38;
}

.chevron {
    width: 16px;
    height: 16px;
    opacity: 0.3;
}

.divider {
    position: absolute;
    bottom: 0;
    left: 36px;
    right: 0;
    height: 1px;
    background: #F1F1F5;
}
</style>