<script setup lang="ts">
import { useRouter } from 'vue-router';
import { onMounted } from 'vue';
import launchBg from '@/assets/launch/momof-launch.png'
import { API } from '@/utils/net/api';
import { post } from '@/utils/net/request';
import { type SystemInfoModel } from '@/components/appModels/SystemInfoModel';
import { useUserStore } from '@/stores/userStore';

const userStore = useUserStore()
const router = useRouter()

const toLogin = () => {
    router.push({ name: "login" })
}

const toMainTab = () => {
    router.push({ name: "anchorList" })
}
const getSysInfo = async () => {
    try {
        const response = await post(API.sys_info, {})
        const sysInfo: SystemInfoModel = response.data
        console.log(sysInfo.App.CurrState);
        await checkLogin()
    } catch (error) {
        console.log("error:", error);
    }
}

const checkLogin = async () => {
    if (userStore.token.length > 0) {
        await userStore.updateLoginUserInfo()
        toMainTab()
    } else {
        toLogin()
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