<script setup lang="ts">
import { onActivated } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/userStore';
import { storeToRefs } from 'pinia';
import { getFlagEmoji } from '@/utils/tools';
import { showCoinShop } from '@/utils/tools/shopService';

import icEdit from '@/assets/ic_edit.svg';
import coinIcon from '@/assets/coin_icon.png';

// 菜单图标
import icMenuLiked from '@/assets/ic_menu_liked.svg';
import icMenuVisited from '@/assets/ic_menu_visited.svg';
import icMenuFeedback from '@/assets/ic_menu_feedback.svg';
import icMenuSettings from '@/assets/ic_menu_settings.svg';
import icArrowRight from '@/assets/ic_arrow_right.png';

const userStore = useUserStore();
const { userInfo } = storeToRefs(userStore);
const router = useRouter();

onActivated(() => {
    userStore.updateLoginUserInfo();
});

// 菜单项配置
const menuItems = [
    { id: 1, title: 'See who liked me', icon: icMenuLiked, route: '/profile/like-me' },
    { id: 2, title: 'See who visited me', icon: icMenuVisited, route: '/profile/visitor' },
    { id: 3, title: 'Feedback', icon: icMenuFeedback, route: '/setting/feedback' },
    { id: 4, title: 'Settings', icon: icMenuSettings, route: '/setting' }
];

const onMenuItemClick = (item: any) => {
    if (item.route) {
        router.push(item.route);
    }
};


const handleEdit = () => {
    router.push('/profile/edit');
};

const goLikeMe = () => {
    router.push({ name: "LikeMe" })
}

const goVisitor = () => {
    router.push({ name: "Visitor" })
}

const goMyLikes = () => {
    router.push({ name: "MyLikes" })
}
</script>

<template>
    <div class="user-center-page">
        <div class="content">
            <!-- Header Section -->
            <header class="page-header">
                <span class="title">Personal</span>
            </header>

            <!-- User Info Section -->
            <section class="user-info">
                <div class="avatar-container">
                    <img :src="userInfo?.HeadImage" alt="Avatar" class="avatar-img" />
                </div>
                <div class="user-copy">
                    <h2 class="nickname">{{ userInfo?.Nickname || 'Nickname' }}</h2>
                    <div class="location-badge">
                        <span class="flag-icon">{{ getFlagEmoji(userInfo?.CountryCode) }}</span>
                        <span class="country">{{ userInfo?.Country || 'Unknown' }}</span>
                    </div>
                </div>
                <button class="edit-btn" @click="handleEdit" aria-label="Edit profile">
                    <img :src="icEdit" alt="" class="edit-icon" />
                </button>
            </section>

            <!-- Statistics Grid -->
            <div class="stats-card">
                <div class="stat-box" @click="goLikeMe">
                    <span class="stats-num">{{ userInfo?.LikeMeNumber || 0 }}</span>
                    <span class="stats-label">Liked me</span>
                </div>
                <div class="stat-box" @click="goVisitor">
                    <span class="stats-num">{{ userInfo?.VisitorMeNumber || 0 }}</span>
                    <span class="stats-label">Visitors</span>
                </div>
                <div class="stat-box" @click="goMyLikes">
                    <span class="stats-num">{{ userInfo?.UserLikeNumber || 0 }}</span>
                    <span class="stats-label">Like</span>
                </div>
            </div>

            <!-- Wallet Banner -->
            <div class="wallet-banner" @click="showCoinShop()">
                <div class="wallet-left">
                    <img :src="coinIcon" alt="" class="coin-img" />
                    <div class="wallet-copy">
                        <span class="balance">{{ userInfo?.Coins || 0 }}</span>
                        <span class="wallet-label">Coins</span>
                    </div>
                </div>
                <div class="get-more-wrap">
                    <button class="get-more-btn" type="button">Get More</button>
                </div>
            </div>

            <div class="menu-container">
                <div v-for="(item, index) in menuItems" :key="item.id" class="menu-row" @click="onMenuItemClick(item)">
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
    height: 100%;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    background-color: #1a1a1a;
    overflow-x: hidden;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro", "SF Pro Display", "Segoe UI", sans-serif;
    padding-bottom: 0;
    box-sizing: border-box;
}

.content {
    position: relative;
    padding: 20px;
    padding-top: calc(12px + env(safe-area-inset-top, 0px));
    padding-bottom: var(--app-tabbar-content-offset, 88px);
}

/* Header */
.page-header {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
}

.title {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 24px;
    font-weight: 900;
    color: #fff;
    line-height: 32px;
    letter-spacing: 0;
}

.edit-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    margin-left: auto;
    padding: 0;
    background: transparent;
    border-radius: 0;
    border: none;
    cursor: pointer;
}

.edit-icon {
    width: 28px;
    height: 28px;
    filter: brightness(0) invert(1);
}

/* User Info */
.user-info {
    display: flex;
    align-items: center;
    gap: 16px;
    min-height: 90px;
    margin-bottom: 20px;
}

.avatar-container {
    width: 90px;
    height: 90px;
    border-radius: 50%;
    overflow: hidden;
    margin-bottom: 0;
    flex: 0 0 90px;
    background: #2a2a2a;
}

.avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.user-copy {
    min-width: 0;
    flex: 1;
}

.nickname {
    font-size: 18px;
    font-weight: 800;
    line-height: 22px;
    color: #fff;
    margin: 0 0 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.location-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    align-self: start;
}

.flag-icon {
    position: relative;
    top: 1px;
}

.country {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.5);
    font-weight: 500;
    line-height: 18px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* Stats Card */
.stats-card {
    display: flex;
    background: #212121;
    border-radius: 20px;
    height: 91px;
    padding: 0;
    margin-bottom: 20px;
}

.stat-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    gap: 8px;
    min-width: 0;
    cursor: pointer;
}

.stats-label {
    font-size: 14px;
    line-height: 18px;
    color: rgba(255, 255, 255, 0.3);
    font-weight: 500;
    white-space: nowrap;
}

.stats-num {
    font-size: 20px;
    line-height: 24px;
    font-weight: 800;
    color: #fff;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* Wallet Banner */
.wallet-banner {
    background: linear-gradient(90deg, #c8f24e 0%, #78eb3f 100%);
    border-radius: 20px;
    height: 76px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 16px;
    margin-bottom: 30px;
    color: #061900;
    cursor: pointer;
    box-sizing: border-box;
}

.wallet-left {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
}

.coin-img {
    width: 44px;
    height: 44px;
    object-fit: contain;
    flex: 0 0 44px;
}

.wallet-copy {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
}

.balance {
    font-size: 20px;
    line-height: 22px;
    font-weight: 800;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.wallet-label {
    font-size: 12px;
    line-height: 16px;
    font-weight: 600;
}

.get-more-wrap {
    height: 36px;
    min-width: 88px;
    background: #1a1a1a;
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
}

.get-more-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    padding: 0 12px;
    color: #fff;
    font-size: 14px;
    line-height: 18px;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
}

/* Menu Container */
.menu-container {
    background: transparent;
    border-radius: 0;
    padding: 0;
    margin-bottom: 24px;
}

.menu-row {
    position: relative;
}

.menu-item-content {
    display: flex;
    align-items: center;
    height: 58px;
    cursor: pointer;
}

.menu-icon {
    width: 30px;
    height: 30px;
    margin-right: 16px;
    filter: brightness(0) invert(1);
}

.menu-title {
    flex: 1;
    min-width: 0;
    font-size: 17px;
    line-height: 22px;
    font-weight: 600;
    color: #fff;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.chevron {
    width: 16px;
    height: 16px;
    opacity: 0.3;
    filter: brightness(0) invert(1);
}

.divider {
    display: none;
}
</style>
