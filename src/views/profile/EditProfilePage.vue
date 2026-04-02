<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  Popup as VanPopup,
  Field as VanField,
  Cell as VanCell,
  CellGroup as VanCellGroup,
  Uploader as VanUploader,
  Picker as VanPicker,
  Icon as VanIcon,
  Icon
} from 'vant';
import { useUserStore } from '@/stores/userStore';
import { storeToRefs } from 'pinia';
import { ossUploadService } from '@/utils/net/OSSUploadService';
import { showLoadingToast, closeToast } from 'vant';
import { post } from '@/utils/net/request';
import { API } from '@/utils/net/api';

// Assets
import backIcon from '@/assets/comm/comm-back.png';
import { getAge } from '@/utils/tools';
import { getFlagEmoji } from '@/utils/tools';
import HUD from '@/components/HUD';

interface ProfileFormData {
  nickname?: string;
  age?: number;
  gender?: 'Male' | 'Female';
  countryCode?: string;
  country?: string;
  aboutMe?: string;
  avatar?: string;
  albums?: string[];
}

interface CountryModel {
  Key: string
  Value: string
}
const userStore = useUserStore();
const { userInfo } = storeToRefs(userStore);
const router = useRouter();

// Form data (reactive)
const formData = ref<ProfileFormData>({
  nickname: userInfo.value?.Nickname,
  age: getAge(userInfo.value?.Birthday),
  gender: userInfo.value?.Gender === '1' ? 'Male' : 'Female',
  countryCode: userInfo.value?.CountryCode,
  country: userInfo.value?.Country,
  aboutMe: userInfo.value?.Introduce,
  avatar: userInfo.value?.HeadImage,
  albums: userInfo.value?.Albums ?? []
});

// Photo album state (using Vant Uploader structure)
const albumList = ref<any[]>([]);
// 存储初始数据快照，用于对比差异
let initialDataSnapshot = "";
// 记录本地选中的头像文件
let avatarFile: File | null = null;
// Uploader 引用，用于手动点击触发
const avatarUploaderRef = ref();

const triggerChooseAvatar = () => {
  // 通过 Ref 找到 Uploader 内部隐藏的 input 选择框并触发
  const input = avatarUploaderRef.value?.$el?.querySelector('input');
  input?.click();
};

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', data: any): void;
}>();

// Picker states
const showGenderPicker = ref(false);
const showAgePicker = ref(false);
const showNicknamePopup = ref(false);
const tempNickname = ref('');
const showCountryPicker = ref(false);

const genderOptions = ['Male', 'Female', 'Other'];
const ageOptions = Array.from({ length: 100 }, (_, i) => i + 18);

// UI Handlers
const openNicknameEdit = () => {
  tempNickname.value = formData.value.nickname || '';
  showNicknamePopup.value = true;
};

const onNicknameConfirm = () => {
  formData.value.nickname = tempNickname.value;
  showNicknamePopup.value = false;
};
const onSave = async () => {
  try {
    HUD.showLoading()
    // 0. 处理头像上传：如果当前头像是本地预览路径 (blob:)，则进行上传
    if (formData.value.avatar && formData.value.avatar.startsWith('blob:') && avatarFile) {
      formData.value.avatar = await ossUploadService.uploadImage(avatarFile);
      avatarFile = null; // 上传完清空
    }

    // 1. 处理相册混合上传：将还没上传的本地文件上传到服务器
    const uploadPromises = albumList.value.map(async (item) => {
      // 如果存在 file 对象，说明是新选的本地图片，需要上传
      if (item.file) {
        return await ossUploadService.uploadImage(item.file);
      }
      // 否则是服务器返回的旧图片，直接保留 url
      return item.url;
    });

    const albumUrls = await Promise.all(uploadPromises);
    formData.value.albums = albumUrls.filter(Boolean);

    // 2. 对比差异，只提取修改过的字段
    const original = JSON.parse(initialDataSnapshot) as ProfileFormData;
    const current = formData.value;
    const changedData: Partial<ProfileFormData> = {};

    // 基础字段对比
    if (current.nickname !== original.nickname) changedData.nickname = current.nickname;
    if (current.age !== original.age) changedData.age = current.age;
    if (current.aboutMe !== original.aboutMe) changedData.aboutMe = current.aboutMe;
    if (current.avatar !== original.avatar) changedData.avatar = current.avatar;

    // 国家代码通常成对出现
    if (current.countryCode !== original.countryCode) {
      changedData.countryCode = current.countryCode;
      changedData.country = current.country;
    }

    // 数组对比
    if (JSON.stringify(current.albums) !== JSON.stringify(original.albums)) {
      changedData.albums = current.albums;
    }

    // 如果没有任何变化，直接返回
    if (Object.keys(changedData).length === 0) {
      console.log('No changes detected, skipping save.');
      router.back();
      return;
    }

    console.log('Final changed data to save:', changedData);

    // 3. 将前端字段映射为后端 API 字段
    const params: any = {};
    if (changedData.nickname) params.Nickname = changedData.nickname;
    if (changedData.aboutMe) params.Introduce = changedData.aboutMe;
    if (changedData.avatar) params.HeadImage = changedData.avatar;
    if (changedData.albums) params.Albums = JSON.stringify(changedData.albums);
    if (changedData.countryCode) {
      params.CountryCode = changedData.countryCode;
      params.Country = changedData.country;
    }
    // 年龄处理：将年龄转换为出生年份的时间戳 (Birthday)
    if (changedData.age) {
      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - changedData.age;
      // 默认取该年 1 月 1 日的时间戳 (秒级)
      params.Birthday = (Math.floor(new Date(birthYear, 0, 1).getTime() / 1000)).toString()
    }

    // 4. 调用接口保存
    const res = await post(API.edit_profile, params);
    HUD.hideLoading()
    if (res.code === 0 || res.code === "0") {
      // 5. 成功后更新全局 Store 里的用户信息
      router.back();
    } else {
      HUD.showToast(res.data.Toast)
    }
  } catch (error) {
    HUD.showToast("Upload error")
  }
};


const countryList = ref<CountryModel[]>([])
const getCountryList = async () => {
  const res = await post(API.country_list, {});
  if (res.code == "0") {
    countryList.value = res.data.Country;
  }
}

const clickGender = () => {
  showCountryPicker.value = true
  if (countryList.value.length == 0) {
    getCountryList()
  }
}
const onAvatarRead = async (file: any) => {
  // 设置本地预览路径，不立即上传
  formData.value.avatar = URL.createObjectURL(file.file);
  // 暂存文件对象，点击保存时再统一上传
  avatarFile = file.file;
};

onMounted(() => {
  // 初始化预览：将字符串数组转为对象数组
  if (userInfo.value?.Albums) {
    albumList.value = userInfo.value.Albums.map(url => ({ url }));
  }
  // 记录初始数据快照（深拷贝）
  initialDataSnapshot = JSON.stringify(formData.value);
});

</script>

<template>
  <div class="edit-profile-page">
    <!-- Header -->
    <div class="topSpace"></div>
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
        <!-- 隐身 Uploader，仅作为功能组件引用 -->
        <van-uploader ref="avatarUploaderRef" :after-read="onAvatarRead" style="display: none" />

        <div class="avatar-wrapper" @click="triggerChooseAvatar">
          <div class="avatar-image">
            <img :src="formData.avatar" />
          </div>
          <div class="camera-btn">
            <img src="@/assets/profile/profile-change-avatar.svg" />
          </div>
        </div>
        <div class="nickname-field" @click="openNicknameEdit">
          <span class="nickname-text">{{ formData.nickname || 'Input Nickname' }}</span>
          <img class="editName" src="@/assets/profile/profile-change-name.svg" />
        </div>
      </section>

      <!-- Details List -->
      <section class="form-section">
        <van-cell-group inset :border="false">
          <van-cell title="Age" :value="formData.age" is-link @click="showAgePicker = true" />
          <van-cell title="Gender" :value="formData.gender" />
          <van-cell title="Country" is-link @click="clickGender">
            <template #value>
              <div class="country-value">
                <span class="flag-icon">{{ getFlagEmoji(formData.countryCode) }}</span>
                <span>{{ formData.country }}</span>
              </div>
            </template>
          </van-cell>
        </van-cell-group>
      </section>

      <!-- Album Section (Feedback Style) -->
      <section class="album-section">
        <h2 class="section-title">Album</h2>
        <van-uploader v-model="albumList" multiple :max-count="6" :preview-size="['106px', '141px']"
          class="media-uploader">
          <div class="upload-placeholder">
            <div class="add-box">
              <img src="@/assets/setting/setting-feedback-add.svg" alt="Add" />
            </div>
          </div>
        </van-uploader>
      </section>

      <!-- About Me Section -->
      <section class="about-section">
        <h2 class="section-title">About Me</h2>
        <div class="textarea-wrapper">
          <textarea v-model="formData.aboutMe" placeholder="Write something about yourself..."
            maxlength="200"></textarea>
        </div>
      </section>
    </div>

    <!-- Pickers -->
    <van-popup v-model:show="showGenderPicker" position="bottom" round>
      <van-picker :columns="genderOptions.map(text => ({ text, value: text }))"
        @confirm="({ selectedOptions }) => { formData.gender = selectedOptions[0].text; showGenderPicker = false }"
        @cancel="showGenderPicker = false" />
    </van-popup>

    <van-popup v-model:show="showAgePicker" position="bottom" round>
      <van-picker :columns="ageOptions.map(num => ({ text: num.toString(), value: num }))"
        @confirm="({ selectedOptions }) => { formData.age = Number(selectedOptions[0].text); showAgePicker = false }"
        @cancel="showAgePicker = false" />
    </van-popup>

    <van-popup v-model:show="showCountryPicker" position="bottom" round>
      <van-loading v-if="countryList.length == 0" />
      <van-picker v-else :columns="countryList.map(country => ({ text: country.Value, value: country.Key }))"
        @confirm="({ selectedOptions }) => { formData.countryCode = selectedOptions[0].value; formData.country = selectedOptions[0].text; showCountryPicker = false }"
        @cancel="showCountryPicker = false" />
    </van-popup>

    <!-- Nickname Editor Popup -->
    <van-popup v-model:show="showNicknamePopup" position="bottom" round class="nickname-edit-popup">
      <div class="popup-header">
        <span class="popup-cancel" @click="showNicknamePopup = false">Cancel</span>
        <span class="popup-title">Edit Nickname</span>
        <span class="popup-confirm" @click="onNicknameConfirm">Done</span>
      </div>
      <div class="popup-content">
        <van-field v-model="tempNickname" maxlength="20" placeholder="Please input nickname" autofocus :border="false"
          class="nickname-field-input" />
      </div>
    </van-popup>
  </div>
</template>

<style scoped>
.edit-profile-page {
  width: 100%;
  height: 100vh;
  background-color: #F8F9FB;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}

.topSpace {
  position: fixed;
  background-color: #fff;
  width: 100%;
  top: 0;
  height: env(safe-area-inset-top);
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
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #1A1A1A;
}

.save-btn {
  width: 86px;
  height: 38px;
  background: linear-gradient(135deg, #FED627 0%, #FF1AD0 100%);
  color: #fff;
  border: none;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
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
  /* border: 4px solid #fff; */
  /* box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); */
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

/* 隐藏 Uploader 默认样式，利用其插槽传递功能 */
.avatar-uploader-custom :deep(.van-uploader__input-wrapper) {
  display: block;
  width: 100%;
}

.avatar-uploader-custom :deep(.van-uploader__input) {
  width: 100% !important;
  height: 100% !important;
}

.camera-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #fff;
  z-index: 20;
}

.nickname-field {
  position: relative;
  /* left: 12px; */
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: row;
  gap: 4px;
  margin-top: 16px;
}

.nickname-text {
  font-size: 18px;
  font-weight: 600;
  color: #1A1A1A;
}

.editName {
  width: 16px;
  height: 16px;
}

/* Edit Popup Styles */
.nickname-edit-popup {
  padding: 0 0 20px 0;
  background-color: #F8F9FB;
}

.popup-header {
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background-color: #fff;
  border-bottom: 1px solid #F1F2F3;
}

.popup-title {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A1A;
}

.popup-cancel {
  font-size: 14px;
  color: #999;
}

.popup-confirm {
  font-size: 14px;
  font-weight: 600;
  color: #FF1AD0;
  /* 采用保存按钮渐变的主色调 */
}

.popup-content {
  padding: 20px 16px;
}

.nickname-field-input {
  background-color: #fff !important;
  border-radius: 12px;
  padding: 12px 16px;
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

/* ====================================================== */
/* Album Section (Shared Styles with Feedback) */
/* ====================================================== */

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

/* 删除按钮居中加粗美化 */
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

/* ====================================================== */

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
</style>
