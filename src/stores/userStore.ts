import { ref } from 'vue'
import { defineStore } from 'pinia'
import { post } from '@/utils/net/request'
import { API } from '@/utils/net/api'
import type { UserInfoModel } from '@/components/appModels/UserInfoModel'
import { syncMessageUnreadToNative, trackAdjustEvent } from '@/utils/native/A0019Bridge'
import { getUdid } from '@/utils/net/encryption'

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

    /** 无登录页时：匿名注册（与原生游客登录一致传 Gender=0），成功后写入 token / rtmToken 并拉取用户信息 */
    const registerGuest = async (): Promise<boolean> => {
        try {
            const res = await post(API.register, {
                UdId: getUdid(),
                Gender: '0',
            })
            const ok =
                String(res.code) === '0' &&
                Boolean(res.data?.Token?.length) &&
                Boolean(res.data?.RtmToken?.length)
            if (ok) {
                token.value = res.data.Token
                rtmToken.value = res.data.RtmToken
                trackAdjustEvent('registration')
                await updateLoginUserInfo()
                return true
            }
            console.warn('[UserStore] registerGuest failed:', res.code, res.data)
            return false
        } catch (e) {
            console.error('[UserStore] registerGuest error:', e)
            return false
        }
    }
    const isBootstrapDone = ref(false)
    const initSystemInfo = async () => {
        try {
            await post(API.sys_info, {})
        } catch (error) {
            console.error('[UserStore] initSystemInfo failed:', error)
        }
    }

    /**
     * App 引导启动流程 (冷启动/刷新恢复)
     */
    /**
     * App 引导启动流程 (冷启动/刷新恢复)
     * 关键改进：断开顶层循环依赖，增加引导超时机制，防止套壳 App 无限白屏。
     */
    const bootstrapApp = async () => {
        if (isBootstrapDone.value) return;

        // --- 超时强制保护 (5秒) ---
        // 即使请求挂起或崩溃，也必须在5秒后放行路由
        const fallbackTimer = setTimeout(() => {
            if (!isBootstrapDone.value) {
                console.warn("[UserStore] Bootstrap Timeout! Forcing app ready.");
                isBootstrapDone.value = true;
            }
        }, 5000);

        try {
            // 1. 系统核心配置
            await initSystemInfo();

            if (token.value) {
                // 2. 动态导入任务管理器，彻底断开循环引用
                const { default: missions } = await import('@/utils/loginedMissions');

                // 3. 阻塞执行关键初始化 (DB, UserInfo)
                await missions.initEnvironment();

                // 4. 异步开启后台长连接/定时器
                missions.start();

                // 5. 补全用户信息状态（如果 initEnvironment 没能完美赋值）
                if (!userInfo.value) {
                    await updateLoginUserInfo();
                }
            }
        } catch (err) {
            console.error("[UserStore] Bootstrap phase error:", err);
            // 这里不抛出异常，让主业务尝试继续运行，避免死循环白屏
        } finally {
            clearTimeout(fallbackTimer);
            isBootstrapDone.value = true;
        }
    }

    const logout = async () => {
        const { default: missions } = await import('@/utils/loginedMissions');
        missions.stop()

        token.value = ""
        userInfo.value = null
        rtmToken.value = ""
        isBootstrapDone.value = false;
        syncMessageUnreadToNative(0)
    }
    return { token, rtmToken, userInfo, isBootstrapDone, updateLoginUserInfo, getUserInfoById, updateRTMToken, initSystemInfo, bootstrapApp, logout, registerGuest }
},
    {
        persist: {
            pick: ['token'],
        }
    }
)
