<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import HUD from '@/components/HUD';
import { ossUploadService } from '@/utils/net/OSSUploadService';
import { post } from '@/utils/net/request';
import { API } from '@/utils/net/api';

// Assets
import backIcon from '@/assets/comm-back.png';

const router = useRouter();

// Form data
const feedbackContent = ref('');
const contactEmail = ref('');
const fileList = ref<any[]>([]);

/**
 * 校验邮箱格式的正则表达式
 */
const isEmailValid = (email: string) => {
  const reg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return reg.test(email);
};

const onSubmit = async () => {
  const content = feedbackContent.value.trim();
  const email = contactEmail.value.trim();

  if (!content || content.trim().length < 10) {
    HUD.showToast('Please enter feedback content');
    return;
  }

  // 邮箱格式校验拦截
  if (email && !isEmailValid(email)) {
    HUD.showToast('Please enter a valid email address');
    return;
  }

  HUD.showLoading();
  try {
    // 1. 并发上传所有图片
    const imageUrls: string[] = [];
    if (fileList.value.length > 0) {
      const uploadPromises = fileList.value.map(item => {
        // item.file 是原生的 File/Blob 对象
        return ossUploadService.uploadImage(item.file);
      });
      const results = await Promise.all(uploadPromises);
      imageUrls.push(...results);
    }

    // 2. 提交反馈表单
    const res = await post(API.feedback, {
      Content: content.trim(),
      Email: email.trim(),
      Images: imageUrls.join(',') // 多图以逗号分隔
    });

    if (res.code === "0") {
      HUD.showToast('Feedback submitted successfully!');
      setTimeout(() => {
        router.back();
      }, 1500);
    } else {
      HUD.showToast(res.msg || 'Submit failed');
    }
  } catch (error) {
    console.error("[Feedback] Submit error:", error);
    HUD.showToast('Upload failed or network error');
  } finally {
    HUD.hideLoading();
  }
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
        <van-uploader v-model="fileList" multiple :max-count="9" :preview-size="['120px', '160px']"
          class="media-uploader">
          <div class="upload-placeholder">
            <div class="add-box">
              <img src="@/assets/setting-feedback-add.svg" alt="Add" />
            </div>
          </div>
        </van-uploader>
      </section>

      <!-- Email Field -->
      <section class="section contact-section">
        <label class="section-label">Email</label>
        <div class="input-wrapper">
          <input v-model="contactEmail" type="email" class="email-input"
            placeholder="Please enter your email address" />
        </div>
      </section>
    </div>

    <!-- Submit Button -->
    <footer class="footer">
      <button class="submit-btn" @click="onSubmit">Submit</button>
    </footer>
  </div>
</template>

<style scoped>
.feedback-page {
  width: 100%;
  height: 100vh;
  background-color: #1A1A1A;
  display: flex;
  flex-direction: column;
  color: #FFFFFF;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", sans-serif;
}

.header {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  margin-top: env(safe-area-inset-top);
  background: #1A1A1A;
}

.back-btn {
  width: 28px;
  height: 28px;
  padding: 0;
  background: none;
  border: none;
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
  line-height: 26px;
  font-weight: 700;
  color: #FFFFFF;
}

.header-right {
  width: 28px;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 20px 20px;
}

.section {
  margin-bottom: 28px;
}

.section-label {
  display: block;
  font-size: 17px;
  line-height: 20px;
  font-weight: 600;
  color: #FFFFFF;
  margin-bottom: 12px;
}

.textarea-wrapper {
  background-color: #212121;
  border-radius: 16px;
  padding: 16px;
}

.feedback-textarea {
  width: 100%;
  height: 168px;
  border: none;
  background: none;
  font-size: 15px;
  line-height: 24px;
  font-weight: 500;
  color: #FFFFFF;
  resize: none;
  outline: none;
}

.input-wrapper {
  height: 54px;
  background-color: #212121;
  border-radius: 16px;
  padding: 0 16px;
  display: flex;
  align-items: center;
}

.email-input {
  width: 100%;
  height: 100%;
  border: none;
  background: none;
  font-size: 15px;
  line-height: 22px;
  font-weight: 500;
  color: #FFFFFF;
  outline: none;
}

.feedback-textarea::placeholder,
.email-input::placeholder {
  color: rgba(255, 255, 255, 0.2);
}

/* ====================================================== */
/* Vant 原生删除按钮样式美化 */
/* ====================================================== */

:deep(.van-uploader__preview-delete) {
  width: 20px !important;
  height: 20px !important;
  top: 4px !important;
  right: 4px !important;
  background-color: rgba(0, 0, 0, 0.4) !important;
  border-radius: 50% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 !important;
  transform: none !important;
}

:deep(.van-uploader__preview-delete-icon) {
  font-size: 16px !important;
  color: #fff !important;
  transform: none !important;
  line-height: 1 !important;
  margin: 0 !important;
  left: 2.5px !important;
  top: 2.2px !important;
  font-weight: 800 !important;
}

/* ====================================================== */

.media-uploader {
  margin-top: 4px;
  width: 100%;
}

.upload-placeholder {
  width: 120px;
  height: 160px;
}

.add-box {
  width: 120px;
  height: 160px;
  border: 2px dashed #555555;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-box img {
  width: 24px;
  height: 24px;
  opacity: 0.55;
  filter: invert(1);
}

:deep(.van-uploader__preview-image) {
  border-radius: 16px;
  overflow: hidden;
}

:deep(.van-uploader__wrapper) {
  gap: 8px;
  flex-wrap: nowrap;
  overflow-x: auto;
  padding-bottom: 2px;
}

:deep(.van-uploader__preview) {
  margin: 0 !important;
}

.footer {
  padding: 12px 20px;
  padding-bottom: calc(34px + env(safe-area-inset-bottom));
  flex-shrink: 0;
  background: #1A1A1A;
}

.submit-btn {
  width: 100%;
  height: 52px;
  background: linear-gradient(90deg, #C8F24E 0%, #78EB3F 100%);
  color: #1A1A1A;
  border: none;
  border-radius: 18px;
  font-size: 17px;
  font-weight: 700;
}

.submit-btn:active {
  opacity: 0.9;
  transform: scale(0.98);
}
</style>
