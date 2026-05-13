<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { API } from '@/utils/net/api';
import { post } from '@/utils/net/request';

const router = useRouter()

const selectedGender = ref<'male' | 'female' | null>('male')

import maleAvatar from '@/assets/maleAvatar.png';
import femaleAvatar from '@/assets/femaleAvatar.png';
import checkedIcon from '@/assets/checkedIcon.svg';
import uncheckedIcon from '@/assets/uncheckedIcon.svg';
import { getUdid } from '@/utils/net/encryption';
import MMHUD from '@/components/HUD'
import { useUserStore } from '@/stores/userStore';
import loginedMissions from '@/utils/loginedMissions';

function selectGender(gender: 'male' | 'female') {
    selectedGender.value = gender;
}

function toInputCodePage() {
    if (!selectedGender.value) return;
    router.push({ name: "inputCode" })
}

const register = async () => {
    try {
        MMHUD.showLoading()
        var genderInt = 1
        switch (selectedGender.value) {
            case 'male':
                genderInt = 1
            case 'female':
                genderInt = 2
            default:
                break;
        }
        const params = {
            UdId: getUdid(),
            Gender: genderInt.toString()
        }
        const userStore = useUserStore()
        const response = await post(API.register, params)

        const token = response.data.Token
        const rtmToken = response.data?.RtmToken
        if (response.code == "0" && token && token.length > 0 && rtmToken && rtmToken.length > 0) {
            userStore.token = token
            userStore.rtmToken = rtmToken
            
            // 关键：只 await 核心的用户信息拉取，确保首页有数据
            await userStore.updateLoginUserInfo()
            
            // 后台静默启动 RTM 和其他任务，不阻塞路由跳转
            loginedMissions.start()
            
            MMHUD.hideLoading()
            router.push({ name: "anchorList" })
        } else {
            MMHUD.hideLoading()
            MMHUD.showToast(response.data.toast)
        }
    } catch {
        MMHUD.hideLoading()
        MMHUD.showToast("Network request failed")
    }
}
</script>

<template>
    <div class="page-container">
        <!-- 头部文字说明 -->
        <div class="header-section">
            <h1 class="title">Gender</h1>
            <p class="subtitle">Once selected, you will be unable to change your gender.</p>
        </div>

        <!-- 选择区域 -->
        <div class="selection-section">
            <!-- Male Card -->
            <div class="gender-card" @click="selectGender('male')">
                <span class="gender-label">Male</span>
                <div class="avatar-container male-bg">
                    <img class="avatar-img" :src="maleAvatar" alt="Male Avatar">
                </div>
                <img class="check-icon" :src="selectedGender === 'male' ? checkedIcon : uncheckedIcon"
                    alt="Check state">
            </div>

            <!-- Female Card -->
            <div class="gender-card" @click="selectGender('female')">
                <span class="gender-label">Female</span>
                <div class="avatar-container female-bg">
                    <img class="avatar-img female-img-opacity" :src="femaleAvatar" alt="Female Avatar">
                </div>
                <img class="check-icon" :src="selectedGender === 'female' ? checkedIcon : uncheckedIcon"
                    alt="Check state">
            </div>
        </div>

        <!-- 底部按钮区 -->
        <div class="bottom-section">
            <div class="continue-button" :class="{ disabled: !selectedGender }" @click="register">
                Start
            </div>
        </div>
    </div>
</template>

<style scoped>
.page-container {
    width: 100%;
    height: 100dvh;
    background-color: #ffffff;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.header-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 130px;
    /* 约等于 Figma 设计的 top: 129px */
    padding: 0 32px;
    text-align: center;
}

.title {
    font-size: 20px;
    font-weight: bold;
    color: #212121;
    margin: 0 0 8px 0;
}

.subtitle {
    font-size: 14px;
    font-weight: 500;
    color: #b3b3b3;
    line-height: 22px;
    margin: 0;
}

.selection-section {
    display: flex;
    gap: 32px;
    margin-top: 60px;
}

.gender-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    transition: transform 0.2s ease;
}

.gender-card:active {
    transform: scale(0.96);
}

.gender-label {
    font-size: 14px;
    font-weight: bold;
    color: #000000;
    margin-bottom: 24px;
}

/* 根据截图估算的图片和背景框尺寸 */
.avatar-container {
    width: 130px;
    height: 130px;
    border-radius: 36px;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    /* 头像大多沉底 */
    margin-bottom: 24px;
}

.male-bg {
    background-color: #57b9f5;
}

.female-bg {
    background-color: #ffe7f3;
}

.avatar-img {
    width: 100%;
    height: auto;
    display: block;
}

.female-img-opacity {
    opacity: 0.85;
    /* 根据原设计女头像有一点透明度处理 */
}

.check-icon {
    width: 24px;
    height: 24px;
}

.bottom-section {
    position: absolute;
    bottom: 8.37%;
    width: 100%;
    display: flex;
    justify-content: center;
    padding: 0 32px;
    box-sizing: border-box;
}

.continue-button {
    width: 100%;
    max-width: 311px;
    height: 56px;
    border-radius: 28px;
    background: linear-gradient(149deg, #FFD13B 0%, #FF1CDB 100%);
    color: #ffffff;
    font-size: 16px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: opacity 0.3s ease;
}

.continue-button.disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>