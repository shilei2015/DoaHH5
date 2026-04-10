<script setup lang="ts">
import { useRouter } from 'vue-router';
import {
  Cell as VanCell,
  CellGroup as VanCellGroup,
  showConfirmDialog,
  showToast
} from 'vant';

// Assets
import backIcon from '@/assets/comm/comm-back.png';

import { useUserStore } from '@/stores/userStore';
import { logoutApp } from '@/utils/native/A0019Bridge';

const userStore = useUserStore();
const router = useRouter();

/**
 * Handle logout action
 */
const handleLogout = () => {
  showConfirmDialog({
    title: 'Logout',
    message: 'Are you sure you want to log out?',
    confirmButtonText: 'Confirm',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#000000',
  }).then(() => {
    // 调用统一的登出方法，它会处理 RTM 登出和任务停止
    userStore.logout();
    showToast('Logged out successfully');
    router.push('/login');
    logoutApp()
  }).catch(() => {
    // Cancelled
  });
};

/**
 * Handle delete account action
 */
const handleDeleteAccount = () => {
  showConfirmDialog({
    title: 'Delete Account',
    message: 'Warning: This action is permanent and all data will be lost. Do you want to proceed?',
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#FF3B30',
  }).then(() => {
    // Implement delete account logic
    showToast('Account deletion request submitted');
    // router.push('/login');
  }).catch(() => {
    // Cancelled
  });
};

</script>

<template>
  <div class="account-page">
    <!-- Header -->
    <header class="header">
      <button class="back-btn" @click="router.back()">
        <img :src="backIcon" alt="Back" />
      </button>
      <h1 class="title">Account</h1>
      <div class="header-right"></div>
    </header>

    <div class="content">
      <!-- Account Actions Group -->
      <section class="menu-group">
        <van-cell-group inset round class="custom-cell-group">
          <!-- 暂时隐藏注销账户选项 -->
          <!-- <van-cell title="Delete Account" is-link @click="handleDeleteAccount" class="account-cell" />
          <div class="divider"></div> -->
          <van-cell title="Logout" is-link @click="handleLogout" class="account-cell" />
        </van-cell-group>
      </section>
    </div>
  </div>
</template>

<style scoped>
.account-page {
  width: 100%;
  height: 100vh;
  background-color: #FFFFFF;
  /* Based on Figma design */
  display: flex;
  flex-direction: column;
}

/* Header */
.header {
  height: 44px;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  flex-shrink: 0;
  margin-top: env(safe-area-inset-top);
}

.back-btn {
  width: 24px;
  background: none;
  border: none;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-btn img {
  width: 28px;
  /* Based on Figma 28x28px */
  height: 28px;
}

.title {
  font-size: 18px;
  font-weight: 700;
  /* Bold as per Figma */
  color: #000000;
  margin: 0;
}

.header-right {
  width: 24px;
}

/* Content */
.content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 0;
  /* Vertical spacing */
}

.menu-group {
  padding: 0 20px;
  /* 20px margin on both sides */
}

/* Customizing Vant Cell Group */
.custom-cell-group {
  background-color: #FFFFFF;
  border: 1px solid #EBECED;
  /* Based on Figma 1px solid #EBECED */
  overflow: hidden;
}

:deep(.van-cell-group--inset) {
  margin: 0;
  /* Reset default inset margin since we pad the container */
}

/* Customizing Vant Cell */
.account-cell {
  padding: 16px;
  background: transparent;
}

:deep(.van-cell__title) {
  font-size: 16px;
  color: #2B2B2B;
  /* Based on Figma #2B2B2B */
  font-weight: 600;
  /* Semibold (590) effectively 600 */
}

:deep(.van-cell__right-icon) {
  color: #C8C7CC;
  /* Grey arrow */
  font-size: 16px;
}

/* Custom Divider */
.divider {
  height: 1px;
  background-color: #F5F6F7;
  /* Based on Figma #F5F6F7 */
  margin-left: 16px;
  /* Align with text padding */
}
</style>