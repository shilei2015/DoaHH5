<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  NavBar as VanNavBar,
  Field as VanField,
  Uploader as VanUploader,
  Button as VanButton
} from 'vant';
import HUD from '@/components/HUD';

// Assets
import backIcon from '@/assets/comm/comm-back.png';
import addIcon from '@/assets/profile/add_icon.svg';
import closeIcon from '@/assets/profile/close_icon.svg';

const router = useRouter();

// Feedback types
const feedbackTypes = ['Suggestion', 'Bug content', 'Other'];
const selectedType = ref('Suggestion');

// Form data
const feedbackContent = ref('');
const contactEmail = ref('');
const fileList = ref<any[]>([]);

const onTypeSelect = (type: string) => {
  selectedType.value = type;
};

const onSubmit = () => {
  if (!feedbackContent.value) {
    HUD.showToast('Please enter feedback content');
    return;
  }

  // Mock submission
  HUD.showLoading();

  setTimeout(() => {
    HUD.hideLoading();
    HUD.showToast('Feedback submitted successfully!');
    setTimeout(() => {
      router.back();
    }, 1500);
  }, 1500);
};

</script>

<template>
  <div class="feedback-page">
    <!-- Navigation Bar -->
    <header class="header">
      <button class="back-btn" @click="router.back()">
        <img :src="backIcon" alt="Back" />
      </button>
      <h1 class="title">Feedback</h1>
      <div class="header-right"></div>
    </header>

    <div class="content">
      <!-- Feedback Type Tags -->
      <!-- <section class="section">
        <div class="tags-container">
          <div 
            v-for="type in feedbackTypes" 
            :key="type"
            :class="['tag-item', { active: selectedType === type }]"
            @click="onTypeSelect(type)"
          >
            {{ type }}
          </div>
        </div>
      </section> -->

      <!-- Feedback Content Area -->
      <section class="section">
        <label class="section-label">Feedback</label>
        <div class="textarea-wrapper">
          <textarea v-model="feedbackContent" class="feedback-textarea"
            placeholder="Please enter details of your report" maxlength="1000"></textarea>
        </div>
      </section>

      <!-- Media Upload -->
      <section class="section">
        <van-uploader v-model="fileList" multiple :max-count="9" class="media-uploader">
          <template #preview-cover="{ file }">
            <div class="delete-overlay">
              <!-- Custom delete logic handled by Vant natively via v-model -->
            </div>
          </template>
          <div class="upload-placeholder">
            <div class="add-box">
              <img :src="addIcon" alt="Add" />
            </div>
          </div>
        </van-uploader>
      </section>

      <!-- Email Field -->
      <section class="section contact-section">
        <label class="section-label">Email</label>
        <div class="input-wrapper">
          <input v-model="contactEmail" type="email" class="email-input"
            placeholder="Please enter details of your report" />
        </div>
      </section>
    </div>

    <!-- Submit Button (Fixed at Bottom) -->
    <footer class="footer">
      <button class="submit-btn" @click="onSubmit">Submit</button>
    </footer>
  </div>
</template>

<style scoped>
.feedback-page {
  width: 100%;
  height: 100vh;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

/* Header */
.header {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  flex-shrink: 0;
  margin-top: env(safe-area-inset-top);
  background: #fff;
}

.back-btn {
  width: 24px;
  padding: 0;
  background: none;
  border: none;
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
  padding: 20px 16px;
}

.section {
  margin-bottom: 24px;
}

.section-label {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #1A1A1A;
  margin-bottom: 12px;
}

/* Tags */
.tags-container {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.tag-item {
  padding: 8px 20px;
  border-radius: 20px;
  background-color: #F5F6F7;
  color: #666;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.tag-item.active {
  background: linear-gradient(135deg, #FF5290 0%, #B847FF 100%);
  color: #fff;
}

/* Textarea */
.textarea-wrapper {
  background-color: #F8F9FB;
  border-radius: 12px;
  padding: 12px;
  border: 1px solid #EBECED;
}

.feedback-textarea {
  width: 100%;
  height: 160px;
  border: none;
  background: none;
  font-size: 14px;
  color: #1A1A1A;
  resize: none;
}

/* Input */
.input-wrapper {
  background-color: #F8F9FB;
  border-radius: 12px;
  padding: 12px;
  border: 1px solid #EBECED;
}

.email-input {
  width: 100%;
  border: none;
  background: none;
  font-size: 14px;
  color: #1A1A1A;
}

/* Uploader */
.media-uploader {
  margin-top: 4px;
}

.upload-placeholder {
  width: 80px;
  height: 80px;
}

.add-box {
  width: 80px;
  height: 80px;
  border: 2px dashed #EBECED;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-box img {
  width: 24px;
  height: 24px;
  opacity: 0.5;
}

:deep(.van-uploader__preview-image) {
  border-radius: 12px;
  overflow: hidden;
}

/* Footer */
.footer {
  padding: 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
  flex-shrink: 0;
}

.submit-btn {
  width: 100%;
  height: 50px;
  background: linear-gradient(90.2deg, #FED627 0.17%, #FF1AD0 99.85%);
  /* Matching UserCenter gradient */
  color: #fff;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(255, 26, 208, 0.2);
}

.submit-btn:active {
  opacity: 0.9;
  transform: scale(0.98);
}
</style>
