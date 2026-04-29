<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import HUD from '@/components/HUD';

import backIcon from '@/assets/comm/comm-back.png';
import { NET_CONFIG } from '@/utils/net/config';
import { showWebviewModal } from '@/utils/tools/modalService';

const router = useRouter();

// Version info
const currentVersion = 'V ' + NET_CONFIG.VERSION
const hasUpdate = ref(true);

// Language state
const showLanguagePicker = ref(false);
const currentLanguage = ref('English');
const languageOptions = [
  { text: 'English', value: 'en' },
  { text: '繁體中文', value: 'zh-TW' },
  { text: '日本語', value: 'ja' },
  { text: '한국어', value: 'ko' }
];

const onLanguageConfirm = ({ selectedOptions }: any) => {
  currentLanguage.value = selectedOptions[0].text;
  showLanguagePicker.value = false;
  HUD.showToast('Language changed to ' + currentLanguage.value);
};

const clearCache = () => {
  HUD.showLoading();
  setTimeout(() => {
    HUD.hideLoading();
    HUD.showToast('Cache cleared');
  }, 1000);
};

const openPrivacyPolicy = () => {
  showWebviewModal('Privacy Policy', NET_CONFIG.ppUrl);
};

const openTermsOfService = () => {
  showWebviewModal('Terms of Service', NET_CONFIG.tsUrl);
};

</script>

<template>
  <div class="setting-page">
    <!-- Header -->
    <header class="header">
      <button class="back-btn" @click="router.back()">
        <img :src="backIcon" alt="Back" />
      </button>
      <h1 class="title">Settings</h1>
      <div class="header-right"></div>
    </header>

    <div class="content">
      <section class="settings-list">
        <button class="settings-row" type="button">
          <span class="row-title">Version</span>
          <span class="row-meta">
            <i v-if="hasUpdate" class="update-dot"></i>
            <span>{{ currentVersion }}</span>
            <span class="chevron">›</span>
          </span>
        </button>
        <button class="settings-row" type="button" @click="openPrivacyPolicy">
          <span class="row-title">Privacy Policy</span>
          <span class="chevron">›</span>
        </button>
        <button class="settings-row" type="button" @click="openTermsOfService">
          <span class="row-title">Terms of Service</span>
          <span class="chevron">›</span>
        </button>
        <button class="settings-row" type="button" @click="showLanguagePicker = true">
          <span class="row-title">Language</span>
          <span class="row-meta">
            <span>{{ currentLanguage }}</span>
            <span class="chevron">›</span>
          </span>
        </button>
        <button class="settings-row" type="button" @click="router.push('/setting/blacklist')">
          <span class="row-title">Blacklist</span>
          <span class="chevron">›</span>
        </button>
        <button class="settings-row" type="button" @click="router.push('/setting/account')">
          <span class="row-title">Account Settings</span>
          <span class="chevron">›</span>
        </button>
      </section>
    </div>

    <!-- Language Picker -->
    <van-popup v-model:show="showLanguagePicker" position="bottom" round>
      <div class="picker-header">
        <span class="picker-title">Select Language</span>
      </div>
      <van-picker :columns="languageOptions" @confirm="onLanguageConfirm" @cancel="showLanguagePicker = false" />
    </van-popup>
  </div>
</template>

<style scoped>
.setting-page {
  width: 100%;
  height: 100vh;
  background-color: #1A1A1A;
  display: flex;
  flex-direction: column;
  color: #fff;
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
  width: 100%;
  height: 100%;
  filter: invert(1);
}

.title {
  font-size: 17px;
  font-weight: 700;
  color: #FFFFFF;
  line-height: 26px;
}

.header-right {
  width: 28px;
}

/* Content */
.content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 20px calc(34px + env(safe-area-inset-bottom));
  background-color: #1A1A1A;
}

.settings-list {
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding-top: 4px;
}

.settings-row {
  width: 100%;
  min-height: 20px;
  border: none;
  background: transparent;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #FFFFFF;
  text-align: left;
}

.row-title {
  font-size: 17px;
  line-height: 20px;
  font-weight: 700;
}

.row-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  line-height: 18px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
}

.update-dot {
  width: 8px;
  height: 8px;
  background: #FF4A78;
  border-radius: 50%;
  display: inline-block;
}

.chevron {
  color: rgba(255, 255, 255, 0.35);
  font-size: 28px;
  line-height: 16px;
  font-weight: 300;
}

/* Picker */
:deep(.van-popup) {
  background: #1A1A1A;
  color: #fff;
}

.picker-header {
  padding: 16px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.picker-title {
  font-size: 16px;
  font-weight: 600;
  color: #FFFFFF;
}

:deep(.van-picker) {
  background: #1A1A1A;
}

:deep(.van-picker__toolbar),
:deep(.van-picker__columns) {
  background: #1A1A1A;
}

:deep(.van-picker-column__item) {
  color: rgba(255, 255, 255, 0.5);
}

:deep(.van-picker-column__item--selected) {
  color: #FFFFFF;
  font-weight: 700;
}

:deep(.van-picker__mask) {
  background-image: linear-gradient(180deg, rgba(26, 26, 26, 0.9), rgba(26, 26, 26, 0.4)), linear-gradient(0deg, rgba(26, 26, 26, 0.9), rgba(26, 26, 26, 0.4));
}
</style>
