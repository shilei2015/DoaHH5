<script setup lang="ts">
import { useRouter } from 'vue-router';
import { onMounted } from 'vue';
import launchBg from '@/assets/launch/momof-launch.png'
import { useUserStore } from '@/stores/userStore';
import loginedMissions from '@/utils/loginedMissions';
import HUD from '@/components/HUD';

const userStore = useUserStore()
const router = useRouter()

const toMainTab = () => {
    router.push({ name: "anchorList" })
}
const getSysInfo = async () => {
    try {
        await userStore.initSystemInfo()
        await checkLogin()
    } catch (error) {
        console.error("Launch setup failed:", error);
    }
}

const checkLogin = async () => {
    if (userStore.token.length > 0) {
        await userStore.updateLoginUserInfo()
        loginedMissions.start()
        toMainTab()
    } else {
        HUD.showLoading()
        const ok = await userStore.registerGuest()
        HUD.hideLoading()
        if (ok) {
            loginedMissions.start()
            toMainTab()
        } else {
            HUD.showToast('Unable to connect. Please try again.')
        }
    }
}

onMounted(() => {
    getSysInfo()
})
</script>

<template>
    <div class="launchContianer">
        <img :src="launchBg" alt="">
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
}

.launchContianer img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    /* display: block; */
}
</style>