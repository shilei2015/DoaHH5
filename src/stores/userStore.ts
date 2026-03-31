import { ref } from 'vue'
import { defineStore } from 'pinia'
import { post } from '@/utils/net/request'
import { API } from '@/utils/net/api'
import type { UserInfoModel } from '@/components/appModels/UserInfoModel'

export const useUserStore = defineStore('useUserStore', () => {
    const token = ref("")
    const userInfo = ref<UserInfoModel | null>(null)
    const rtmToken = ref("")
    const updateLoginUserInfo = async () => {
        const res = await post(API.main_user_info, {})
        if (res.code == "0") {
            userInfo.value = res.data.User
        }
    }

    const getUserInfoById = async (userId: string): Promise<UserInfoModel | null> => {
        const res = await post(API.user_info, { UserId: userId, Visitor: "0" })
        if (res.code == "0") {
            return res.data.Anchor
        }
        return null
    }

    const updateRTMToken = async () => {
        const res = await post(API.refresh_rtm_token, {})
        if (res.code == "0") {
            rtmToken.value = res.data.RtmToken
        }
    }
    const isAppInitialized = ref(false)
    const initSystemInfo = async () => {
        if (isAppInitialized.value) return
        try {
            await post(API.sys_info, {})
            isAppInitialized.value = true
        } catch (error) {
            console.error('[UserStore] initSystemInfo failed:', error)
        }
    }
    const logout = () => {
        token.value = ""
        userInfo.value = null
        rtmToken.value = ""
    }
    return { token, rtmToken, userInfo, isAppInitialized, updateLoginUserInfo, getUserInfoById, updateRTMToken, initSystemInfo, logout }
},
    {
        persist: true
    }
)