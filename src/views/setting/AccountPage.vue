<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';

// Assets
import backIcon from '@/assets/comm-back.png';

import { useUserStore } from '@/stores/userStore';
import { closeWebView, logoutApp } from '@/utils/native/A0019Bridge';

const userStore = useUserStore();
const router = useRouter();
const showLogoutConfirm = ref(false);

/**
 * Handle logout action
 */
const handleLogout = () => {
  showLogoutConfirm.value = true;
};

const cancelLogout = () => {
  showLogoutConfirm.value = false;
};

const confirmLogout = () => {
  showLogoutConfirm.value = false;
  userStore.logout();
  showToast('Logged out successfully');
  logoutApp();
  closeWebView();
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
      <section class="account-list">
        <button class="account-row" type="button" @click="handleLogout">
          <span>Logout</span>
          <span class="chevron">›</span>
        </button>
      </section>
    </div>

    <Teleport to="body">
      <div v-if="showLogoutConfirm" class="logout-overlay" @click.self="cancelLogout">
        <div class="logout-dialog">
          <button class="dialog-close" type="button" aria-label="Close" @click="cancelLogout">×</button>
          <h2 class="dialog-title">Logout</h2>
          <p class="dialog-message">Are you sure you want to logout?</p>
          <div class="dialog-actions">
            <button class="dialog-btn dialog-btn-cancel" type="button" @click="cancelLogout">Cancel</button>
            <button class="dialog-btn dialog-btn-confirm" type="button" @click="confirmLogout">Yes</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.account-page {
  width: 100%;
  height: 100vh;
  background-color: #1A1A1A;
  display: flex;
  flex-direction: column;
  color: #FFFFFF;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", sans-serif;
}

/* Header */
.header {
  height: 44px;
  background-color: #1A1A1A;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  flex-shrink: 0;
  margin-top: env(safe-area-inset-top);
}

.back-btn {
  width: 28px;
  height: 28px;
  background: none;
  border: none;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-btn img {
  width: 28px;
  height: 28px;
  filter: invert(1);
}

.title {
  font-size: 17px;
  line-height: 26px;
  font-weight: 700;
  color: #FFFFFF;
  margin: 0;
}

.header-right {
  width: 28px;
}

/* Content */
.content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 20px calc(34px + env(safe-area-inset-bottom));
}

.account-list {
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding-top: 4px;
}

.account-row {
  width: 100%;
  min-height: 20px;
  border: none;
  background: transparent;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #FFFFFF;
  font-size: 17px;
  line-height: 20px;
  font-weight: 700;
  text-align: left;
}

.chevron {
  color: rgba(255, 255, 255, 0.35);
  font-size: 28px;
  line-height: 16px;
  font-weight: 300;
}

.logout-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.68);
  backdrop-filter: blur(12px);
}

.logout-dialog {
  position: relative;
  width: min(310px, calc(100vw - 40px));
  background: #1A1A1A;
  border-radius: 24px;
  padding: 36px 20px 20px;
  color: #FFFFFF;
  text-align: center;
}

.dialog-close {
  position: absolute;
  top: 12px;
  right: 14px;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.4);
  font-size: 30px;
  line-height: 22px;
  font-weight: 300;
}

.dialog-title {
  font-size: 17px;
  line-height: 26px;
  font-weight: 700;
  margin: 0 0 12px;
}

.dialog-message {
  font-size: 15px;
  line-height: 24px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 30px;
}

.dialog-actions {
  display: flex;
  gap: 12px;
}

.dialog-btn {
  flex: 1;
  height: 52px;
  border: none;
  border-radius: 18px;
  font-size: 17px;
  font-weight: 700;
}

.dialog-btn-cancel {
  background: #292929;
  color: #FFFFFF;
}

.dialog-btn-confirm {
  background: linear-gradient(90deg, #C8F24E 0%, #78EB3F 100%);
  color: #1A1A1A;
}
</style>
