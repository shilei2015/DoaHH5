<script setup lang="ts">
import { useRouter } from 'vue-router';
import { API } from '@/utils/net/api';
import { post } from '@/utils/net/request';
import { useUserStore } from '@/stores/userStore';
import { getUdid } from '@/utils/net/encryption';
import logoLogo from '@/assets/loginLogo.png'
import HUD from '@/components/HUD'
import loginedMissions from '@/utils/loginedMissions';
import { showWebviewModal } from '@/utils/tools/modalService';
import { NET_CONFIG } from '@/utils/net/config';

const router = useRouter()
const userStore = useUserStore()

function toRegisterPage() {
    router.push({ name: "selecteGender" })
}

const loginToSystem = async () => {
    try {
        HUD.showLoading()
        const params = {
            UdId: getUdid()
        }
        const response = await post(API.login, params)
        HUD.hideLoading()
        const token = response.data?.Token
        const rtmToken = response.data?.RtmToken
        if (response.code == "0" && token && token.length > 0 && rtmToken && rtmToken.length > 0) {
            HUD.showToast("Login Successful")
            userStore.token = token
            userStore.rtmToken = rtmToken
            router.push({ name: "anchorList" })
            loginedMissions.start()
        } else if (response.code == "10101") {
            toRegisterPage()
        } else {
            HUD.showToast(response.data.toast)
        }
    } catch (error) {
        HUD.hideLoading()
        HUD.showToast("Network request failed")
        console.log("loginError:", error);
    }
}
const toTermsOfServicePage = () => {
    showWebviewModal("Terms of Service", NET_CONFIG.tsUrl)
}
const toPrivacyPolicyPage = () => {
    showWebviewModal("Privacy Policy", NET_CONFIG.ppUrl)
}
</script>

<template>
    <div class="page-container">
        <!-- 品牌区域 -->
        <div class="brand-section">
            <img class="logo" :src="logoLogo" alt="DOA Logo">
            <span class="appName">DOA</span>
        </div>

        <!-- 底部操作区域 -->
        <div class="bottom-section">
            <div class="login-button" @click="loginToSystem">Login</div>
            <p class="terms-text">
                By logging in, you agree to our <span class="highlight-link" @click="toTermsOfServicePage">Terms of
                    Service</span> & <span class="highlight-link" @click="toPrivacyPolicyPage">Privacy
                    Policy</span>
            </p>
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

.brand-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 222px;
    /* 匹配 Figma 中的 Y 位置 */
}

.logo {
    width: 90px;
    height: 90px;
    border-radius: 45px;
    object-fit: cover;
    margin-bottom: 24px;
}

.appName {
    font-size: 24px;
    font-weight: bold;
    color: #000000;
}

.bottom-section {
    position: absolute;
    bottom: 8.37%;
    /* 匹配 Figma 中的下边距比例 */
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 32px;
    box-sizing: border-box;
}

.login-button {
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
    margin-bottom: 30px;
    cursor: pointer;
}

.terms-text {
    text-align: center;
    font-size: 14px;
    font-weight: 500;
    color: #b3b3b3;
    line-height: 22px;
    max-width: 295px;
    margin: 0;
}

.highlight-link {
    color: #4d4d4d;
    text-decoration: underline;
    text-decoration-skip-ink: none;
    cursor: pointer;
}
</style>
