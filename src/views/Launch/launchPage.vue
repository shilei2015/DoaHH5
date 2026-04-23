<script setup lang="ts">
import { useRouter } from 'vue-router';
import { onMounted, ref } from 'vue';
// import launchBg from '@/assets/launch/momof-launch.png'
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
        <!-- <img :src="launchBg" alt=""> -->
        <div class="loading-container" v-if="isLoading">
            <div class="loading-spinner"></div>
            <div class="loading-text">Loading...</div>
        </div>
    </div>
</template>

<style scoped>
.launchContianer {
    width: 100%;
    /* 宽度=屏幕宽度 */
    height: 100%;
    /* 高度=屏幕高度 */
    position: fixed;
    /* 可选，用于辅助定位 */
    overflow: hidden;
    /* 隐藏图片超出容器的部分（裁切） */
    background-color: #ffffff;
}

.launchContianer img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    /* display: block; */
}

.loading-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: rgba(255, 255, 255, 0.9);
    z-index: 100;
}

.loading-spinner {
    width: 60px;
    height: 60px;
    border: 4px solid rgba(0, 0, 0, 0.3);
    border-top-color: #000;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

.loading-text {
    color: #000;
    font-size: 18px;
    font-weight: 600;
    margin-top: 20px;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>