<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  NavBar as VanNavBar,
  Cell as VanCell,
  CellGroup as VanCellGroup,
  Popup as VanPopup,
  Picker as VanPicker,
  Button as VanButton
} from 'vant';
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
      <!-- Main Settings Group -->
      <section class="menu-group">
        <van-cell-group inset round>
          <!-- Version with Update Badge -->
          <van-cell title="Version" :value="currentVersion" />
          <van-cell title="Privacy Policy" is-link @click="showWebviewModal('Privacy Policy', NET_CONFIG.ppUrl)" />
          <van-cell title="Terms of Service" is-link @click="showWebviewModal('Terms of Service', NET_CONFIG.tsUrl)" />
          <!-- <van-cell title="Language" :value="currentLanguage" is-link @click="showLanguagePicker = true" /> -->

          <!-- <van-cell title="Clear Cache" is-link @click="clearCache" /> -->


        </van-cell-group>
      </section>

      <!-- Legal & Privacy Group -->
      <!-- <section class="menu-group">
        <van-cell-group inset round>

        </van-cell-group>
      </section> -->

      <!-- Account Settings Group -->
      <section class="menu-group">
        <van-cell-group inset round>
          <van-cell title="Blacklist" is-link @click="router.push('/setting/blacklist')" />
          <van-cell title="Account Settings" is-link @click="router.push('/setting/account')" />
        </van-cell-group>
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
  background-color: #fff;
  /* Neutral light grey background */
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
}

.back-btn img {
  width: 100%;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #1A1A1A;
}

.header-right {
  width: 24px;
}

/* Content */
.content {
  flex: 1;
  overflow-y: auto;
  padding: 12px 0;
  background-color: #F5F6F7;
}

.menu-group {
  margin-bottom: 20px;
}

:deep(.van-cell-group__title) {
  padding: 8px 32px;
  font-size: 14px;
  color: #999;
}

:deep(.van-cell) {
  padding: 16px 20px;
  align-items: center;
}

:deep(.van-cell__title) {
  font-size: 16px;
  color: #1A1A1A;
  font-weight: 500;
}

:deep(.van-cell__value) {
  font-size: 15px;
  color: #999;
}

/* Version Cell Customization */
.version-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.version-text {
  font-size: 15px;
  color: #999;
}

.update-dot {
  width: 8px;
  height: 8px;
  background-color: #FF3B30;
  /* Notification red */
  border-radius: 50%;
}

/* Picker */
.picker-header {
  padding: 16px;
  text-align: center;
  border-bottom: 1px solid #F2F2F2;
}

.picker-title {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A1A;
}
</style>
