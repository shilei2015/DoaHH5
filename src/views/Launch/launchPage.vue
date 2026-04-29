<script setup lang="ts">
import { useRouter } from 'vue-router';
import { onMounted, ref } from 'vue';
import launchLogo from '@/assets/launch/dark-launch-logo.png'
import { useUserStore } from '@/stores/userStore';
import loginedMissions from '@/utils/loginedMissions';
import HUD from '@/components/HUD';

const userStore = useUserStore()
const router = useRouter()
const isLoading = ref(true)

const toMainTab = () => {
    router.push({ name: "anchorList" })
}
const getSysInfo = async () => {
    try {
        await userStore.initSystemInfo()
        await checkLogin()
    } catch (error) {
        console.error("Launch setup failed:", error);
        isLoading.value = false
    }
}

const checkLogin = async () => {
    try {
        if (userStore.token.length > 0) {
            await userStore.updateLoginUserInfo()
            loginedMissions.start()
            // 添加延迟，确保loading能够显示
            await new Promise(resolve => setTimeout(resolve, 1000))
            isLoading.value = false
            toMainTab()
        } else {
            const ok = await userStore.registerGuest()
            // 添加延迟，确保loading能够显示
            await new Promise(resolve => setTimeout(resolve, 1000))
            isLoading.value = false
            if (ok) {
                loginedMissions.start()
                toMainTab()
            } else {
                HUD.showToast('Unable to connect. Please try again.')
            }
        }
    } catch (error) {
        console.error("Check login failed:", error);
        // 添加延迟，确保loading能够显示
        await new Promise(resolve => setTimeout(resolve, 1000))
        isLoading.value = false
    }
}

onMounted(() => {
    // 确保页面挂载后再执行初始化
    setTimeout(() => {
        getSysInfo()
    }, 100)
})
</script>

<template>
    <div class="launchContianer">
        <img :src="launchLogo" class="launch-logo" alt="Logo">
        <div class="loading-container" v-if="isLoading">
            <div class="loading-spinner"></div>
        </div>
    </div>
</template>

<style scoped>
.launchContianer {
    width: 100%;
    height: 100%;
    position: fixed;
    overflow: hidden;
    background-color: #1a1a1a;
}

.launch-logo {
    position: absolute;
    left: 50%;
    top: 42.4%;
    width: 140px;
    height: auto;
    transform: translate(-50%, -50%);
    object-fit: contain;
    z-index: 2;
}

.loading-container {
    position: absolute;
    left: 50%;
    top: calc(42.4% + 104px);
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
}

.loading-spinner {
    width: 24px;
    height: 24px;
    border: 2px solid rgba(255, 255, 255, 0.14);
    border-top-color: #65d941;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
