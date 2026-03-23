import { ref } from 'vue'
import { defineStore } from 'pinia'
import { post } from '@/utils/net/request'
import { API } from '@/utils/net/api'
import type { UserInfoModel } from '@/components/appModels/UserInfoModel'

export const useUserStore = defineStore('useUserStore', () => {
    const token = ref("")
    const userInfo = ref<UserInfoModel | null>(null)

    const updateLoginUserInfo = async () => {
        const res = await post(API.main_user_info, {})
        if (res.code == "0") {
            userInfo.value = res.data.User
        }
    }

    return { token, userInfo, updateLoginUserInfo }
},
    {
        persist: true
    }
)