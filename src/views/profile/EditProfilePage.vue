<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { 
  Popup as VanPopup, 
  Field as VanField, 
  Cell as VanCell, 
  CellGroup as VanCellGroup, 
  Uploader as VanUploader, 
  Picker as VanPicker, 
  Icon as VanIcon 
} from 'vant';
import { useUserStore } from '@/stores/userStore';
import { storeToRefs } from 'pinia';

// Assets
import backIcon from '@/assets/comm/comm-back.png';
import addIcon from '@/assets/profile/add_icon.svg';
import closeIcon from '@/assets/profile/close_icon.svg';

const userStore = useUserStore();
const { userInfo } = storeToRefs(userStore);
const router = useRouter();

// Form data (reactive)
const formData = ref({
  nickname: userInfo.value?.Nickname || 'John Doe',
  age: 24,
  gender: userInfo.value?.Gender === '1' ? 'Male' : 'Female',
  country: userInfo.value?.Country || 'United States',
  aboutMe: userInfo.value?.Introduce || 'I love traveling and meeting new people. Feel free to message me!',
  avatar: userInfo.value?.HeadImage || ''
});

// Photo album state
const album = ref([
  { id: 1, url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&h=200&fit=crop' },
  { id: 2, url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&h=200&fit=crop' },
  { id: 3, url: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&h=200&fit=crop' }
]);

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', data: any): void;
}>();

// Picker states
const showGenderPicker = ref(false);
const showAgePicker = ref(false);
const genderOptions = ['Male', 'Female', 'Other'];
const ageOptions = Array.from({ length: 100 }, (_, i) => i + 18);

// UI Handlers
const onSave = () => {
  console.log('Save profile', formData.value);
  emit('save', formData.value);
  router.back();
};

const deletePhoto = (id: number) => {
  album.value = album.value.filter(p => p.id !== id);
};

const addPhoto = () => {
  // Mock add photo
  album.value.push({
    id: Date.now(),
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&h=200&fit=crop'
  });
};

const onAvatarRead = (file: any) => {
  // Mock upload
  formData.value.avatar = URL.createObjectURL(file.file);
};

</script>

<template>
  <div class="edit-profile-page">
    <!-- Header -->
    <header class="header">
      <button class="back-btn" @click="router.back()">
        <img :src="backIcon" alt="Back" />
      </button>
      <h1 class="title">Edit Profile</h1>
      <button class="save-btn" @click="onSave">Save</button>
    </header>

    <div class="content">
      <!-- Avatar Section -->
      <section class="avatar-section">
        <div class="avatar-wrapper">
          <div class="avatar-image">
            <img v-if="formData.avatar" :src="formData.avatar" alt="Avatar" />
            <div v-else class="avatar-placeholder">
              <van-icon name="user-o" size="40" color="#999" />
            </div>
            <!-- Edit overlay -->
            <van-uploader :after-read="onAvatarRead" class="avatar-uploader">
              <div class="camera-btn">
                <van-icon name="photograph" color="#fff" size="14" />
              </div>
            </van-uploader>
          </div>
        </div>
        <div class="nickname-field">
          <input 
            v-model="formData.nickname" 
            class="nickname-input" 
            placeholder="Input Nickname"
          />
          <van-icon name="edit" size="16" color="#999" />
        </div>
      </section>

      <!-- Details List -->
      <section class="form-section">
        <van-cell-group inset :border="false">
          <van-cell title="Age" :value="formData.age" is-link @click="showAgePicker = true" />
          <van-cell title="Gender" :value="formData.gender" is-link @click="showGenderPicker = true" />
          <van-cell title="Country" is-link>
            <template #value>
              <div class="country-value">
                <span class="flag-icon">🇺🇸</span>
                <span>{{ formData.country }}</span>
              </div>
            </template>
          </van-cell>
        </van-cell-group>
      </section>

      <!-- Album Section -->
      <section class="album-section">
        <h2 class="section-title">Album</h2>
        <div class="photos-grid">
          <div v-for="photo in album" :key="photo.id" class="photo-item">
            <img :src="photo.url" alt="Photo" />
            <div class="delete-btn" @click="deletePhoto(photo.id)">
              <img :src="closeIcon" alt="Delete" />
            </div>
          </div>
          <!-- Add photo button -->
          <div v-if="album.length < 9" class="add-photo-btn" @click="addPhoto">
            <img :src="addIcon" alt="Add" />
          </div>
        </div>
      </section>

      <!-- About Me Section -->
      <section class="about-section">
        <h2 class="section-title">About Me</h2>
        <div class="textarea-wrapper">
          <textarea 
            v-model="formData.aboutMe" 
            placeholder="Write something about yourself..."
            maxlength="200"
          ></textarea>
        </div>
      </section>
    </div>

    <!-- Pickers -->
    <van-popup v-model:show="showGenderPicker" position="bottom" round>
      <van-picker
        :columns="genderOptions.map(text => ({ text, value: text }))"
        @confirm="({ selectedOptions }) => { formData.gender = selectedOptions[0].text; showGenderPicker = false }"
        @cancel="showGenderPicker = false"
      />
    </van-popup>

    <van-popup v-model:show="showAgePicker" position="bottom" round>
      <van-picker
        :columns="ageOptions.map(num => ({ text: num.toString(), value: num }))"
        @confirm="({ selectedOptions }) => { formData.age = Number(selectedOptions[0].text); showAgePicker = false }"
        @cancel="showAgePicker = false"
      />
    </van-popup>
  </div>
</template>

<style scoped>
.edit-profile-page {
  width: 100%;
  height: 100vh;
  background-color: #F8F9FB; /* Light grey bg */
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
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
  padding: 0;
  background: none;
  border: none;
}

.back-btn img {
  width: 100%;
  height: auto;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #1A1A1A;
}

.save-btn {
  background: linear-gradient(135deg, #FF5290 0%, #B847FF 100%);
  color: #fff;
  border: none;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
}

/* Content */
.content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: env(safe-area-inset-bottom);
}

/* Avatar Section */
.avatar-section {
  background-color: #fff;
  padding: 40px 0 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-wrapper {
  position: relative;
  margin-bottom: 16px;
}

.avatar-image {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 4px solid #fff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  overflow: hidden;
  position: relative;
  background-color: #f0f0f0;
}

.avatar-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-uploader {
  position: absolute;
  inset: 0;
  z-index: 10;
}

.camera-btn {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 28px;
  height: 28px;
  background-color: #5B47FF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #fff;
  z-index: 20;
}

.nickname-field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nickname-input {
  border: none;
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  color: #1A1A1A;
  width: auto;
  max-width: 200px;
}

/* Details Section */
.form-section {
  margin-top: 12px;
}

:deep(.van-cell) {
  padding: 16px;
  font-size: 16px;
}

:deep(.van-cell__title) {
  color: #999;
}

:deep(.van-cell__value) {
  color: #1A1A1A;
  font-weight: 500;
}

.country-value {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
}

.flag-icon {
  font-size: 18px;
}

/* Album Section */
.album-section {
  background-color: #fff;
  margin-top: 12px;
  padding: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A1A;
  margin-bottom: 12px;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.photo-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  background-color: #f0f0f0;
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.delete-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  padding: 4px;
  background-color: rgba(0,0,0,0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-btn img {
  width: 100%;
  height: 100%;
}

.add-photo-btn {
  aspect-ratio: 1;
  border: 2px dashed #E5E7EB;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.add-photo-btn img {
  width: 32px;
  height: 32px;
  opacity: 0.5;
}

/* About Section */
.about-section {
  background-color: #fff;
  margin-top: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.textarea-wrapper {
  background-color: #F8F9FB;
  border-radius: 12px;
  padding: 12px;
}

textarea {
  width: 100%;
  height: 120px;
  border: none;
  background: none;
  font-size: 14px;
  color: #1A1A1A;
  resize: none;
}

textarea::placeholder {
  color: #999;
}
</style>
