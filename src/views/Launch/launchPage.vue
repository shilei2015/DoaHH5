<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { onMounted, ref } from 'vue';
import { useUserStore } from '@/stores/userStore';
import loginedMissions from '@/utils/loginedMissions';
import HUD from '@/components/HUD';
import { trackAdjustEvent } from '@/utils/native/A0019Bridge';
import { preloadDiscoverRoutes } from '@/router';
import { prefetchDiscoverHome } from '@/utils/discoverPrefetch';

const userStore = useUserStore()
const router = useRouter()
const route = useRoute()
const isLoading = ref(true)

const getRedirectTarget = () => {
    const redirect = route.query.redirect
    const target = Array.isArray(redirect) ? redirect[0] : redirect
    if (target && target.startsWith('/') && !target.startsWith('//') && target !== '/') {
        return target
    }
    return null
}

const toMainTab = () => {
    const redirect = getRedirectTarget()
    if (redirect) {
        router.replace(redirect)
        return
    }
    router.replace({ name: "anchorList" })
}

const shouldWarmDiscoverEntry = () => {
    const redirect = getRedirectTarget()
    return !redirect || redirect === '/tab'
}

const warmDiscoverEntry = () => {
    if (!shouldWarmDiscoverEntry()) return

    preloadDiscoverRoutes()
    void prefetchDiscoverHome()
}

const waitLaunchTransition = () => new Promise(resolve => setTimeout(resolve, 1000))

const checkLogin = async () => {
    try {
        const hasCompleteSession = Boolean(userStore.token.length > 0 && userStore.userInfo?.UserId)

        if (hasCompleteSession) {
            warmDiscoverEntry()
            // 保持启动页过渡节奏，同时把等待时间用于预加载列表入口和首屏数据。
            await waitLaunchTransition()
            isLoading.value = false
            loginedMissions.start()
            toMainTab()
        } else {
            if (userStore.token.length > 0 || userStore.userInfo) {
                userStore.token = ''
                userStore.userInfo = null
                userStore.rtmToken = ''
            }
            const ok = await userStore.registerGuest()
            if (ok) warmDiscoverEntry()
            // 保持启动页过渡节奏，同时把等待时间用于预加载列表入口和首屏数据。
            await waitLaunchTransition()
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
        await waitLaunchTransition()
        isLoading.value = false
    }
}

onMounted(() => {
    trackAdjustEvent('launch_app')
    checkLogin().catch((error) => {
        console.error("Launch setup failed:", error);
        isLoading.value = false
    })
})
</script>

<template>
    <div class="launchContianer">
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

.loading-container {
    width: 100%;
    height: 100%;
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
