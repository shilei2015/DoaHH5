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
import { ossUploadService } from '@/utils/net/OSSUploadService';
import { post } from '@/utils/net/request';
import { API } from '@/utils/net/api';

// Assets
import backIcon from '@/assets/comm/comm-back.png';

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
        <van-uploader v-model="fileList" multiple :max-count="9" :preview-size="['106px', '141px']"
          class="media-uploader">
          <div class="upload-placeholder">
            <div class="add-box">
              <img src="@/assets/setting/setting-feedback-add.svg" alt="Add" />
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
  background-color: #fff;
  display: flex;
  flex-direction: column;
}

.header {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
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
}

.upload-placeholder {
  width: 106px;
  height: 141px;
}

.add-box {
  width: 106px;
  height: 141px;
  border: 1px dashed #EBECED;
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

.footer {
  padding: 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
  flex-shrink: 0;
}

.submit-btn {
  width: 100%;
  height: 50px;
  background: linear-gradient(90.2deg, #FED627 0.17%, #FF1AD0 99.85%);
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
