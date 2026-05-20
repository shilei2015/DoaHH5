import { useUserStore } from '@/stores/userStore';
import { useMomoRTM } from "./MOMORTM"
import { API } from "./net/api"
import { post } from "./net/request"
import { LHTimer } from "./Timer"
import { reactive } from 'vue';
import { initDB } from './msg/DBService';
import { NET_CONFIG } from './net/config';
import {
    A0019PermissionGetType,
    checkPermission,
    getCachedA0019DeviceIdentifiers,
    getCachedNativePushToken,
    getDeviceIdentifiers,
    isA0019Native,
    subscribeNativePushToken,
} from './native/A0019Bridge';

interface MatchOutModel {
    //     "IsNew": "1", //是否是新用户，1-是，0-不是
    // "State": "6", //状态：1-结束，2-第一次拨打中，3-第二次拨打或者已经拨打等待回复，4-一直未接轮询中（15分钟），5-为获取到马甲，6-用户忙线中，7-正常拨打,8-审核模式
    // "Second": "5" //定时秒数
    IsNew: string
    State: string
    Second: string
}

class LoginedMissions {

    private timer = new LHTimer(1000, () => this.timerTask())
    private isStarted = false
    private isEnvInitialized = false
    private initPromise: Promise<void> | null = null;
    private nativePushTokenUnsubscribe: (() => void) | null = null;
    private lastBoundNativePushToken = '';
    private isBindingNativePushToken = false;

    private nextMatchOutTime = 5

    /**
     * 第一步：同步初始化核心环境（DB, UserInfo）
     * 路由守卫必须阻塞等待此方法完成，否则页面挂载会报错数据库未初始化
     */
    public async initEnvironment() {
        if (this.isEnvInitialized) return;

        const userStore = useUserStore();
        // 关键：确保拿到最新的用户信息 (获取 UserId)
        await userStore.updateLoginUserInfo();
        
        if (userStore.userInfo?.UserId) {
            // 正式初始化数据库：这一步必须在页面挂载前完成
            initDB(userStore.userInfo.UserId);
            this.isEnvInitialized = true;
            console.log("[LoginedMissions] Environment initialized (DB ready)");
        }
    }

    /**
     * 第二步：开启后台任务（RTM 登录、定时器等）
     * 此过程可以异步在后台进行，不会阻塞页面 UI 渲染
     */
    public async start() {
        // 先确保基础环境已就绪
        await this.initEnvironment();

        if (this.initPromise) return this.initPromise;

        this.initPromise = (async () => {
            this.minuteTimerTask()
            this.nextMatchOutTime = 5
            this.timer.start()
            
            // 后台执行 RTM 登录
            this.loginRTMBackground();
            this.sendAdId();
            this.startNativePushBinding();
        })();

        return this.initPromise;
    }

    public stop() {
        this.timer.stop()
        this.initPromise = null
        this.isStarted = false
        this.isEnvInitialized = false
        this.lastBoundNativePushToken = ''
        this.isBindingNativePushToken = false
        this.nativePushTokenUnsubscribe?.()
        this.nativePushTokenUnsubscribe = null
        const rtm = useMomoRTM()
        rtm.logoutRTM()
    }

    private timerTask() {
        let currentSecond = Math.floor(this.timer.totalTime)
        if (currentSecond % 60 == 0) {
            this.minuteTimerTask()
        }
        if (currentSecond == this.nextMatchOutTime) {
            this.matchOUt()
        }

    }

    private async minuteTimerTask() {
        await post(API.heart_app)
    }

    /**
     * 后台异步执行 RTM 相关连接，不影响主引导流程
     */
    private async loginRTMBackground() {
        const userStore = useUserStore()
        const rtm = useMomoRTM()
        
        // 刷新 RTM Token 并登录 Agora 信令系统 (处理 Call 呼叫)
        await userStore.updateRTMToken()
        if (userStore.userInfo?.UserId && userStore.rtmToken) {
            await rtm.loginRTM(userStore.userInfo.UserId, userStore.rtmToken)
        }
    }

    private async matchOUt() {
        let res = await post(API.tac_out_start)
        if (res.code == "0", res.data) {
            let model = res.data as MatchOutModel
            if (!model) return
            if (model.IsNew == "1" && model.State != "1") {
                this.nextMatchOutTime += Number(model.Second)
            }
        }
    }

    private userFlyerParam(value: unknown): string {
        if (value === undefined || value === null) return '';
        return String(value).trim();
    }

    private async sendAdId() {
        const nativeDeviceInfo = await this.getUserFlyerDeviceInfo();
        const adId = this.userFlyerParam(nativeDeviceInfo?.adId) || this.userFlyerParam(NET_CONFIG.AdId);
        const params: Record<'Idfa' | 'Idfv' | 'AppsflyerId' | 'AdjustId', string> = {
            Idfa: this.userFlyerParam(nativeDeviceInfo?.idfa),
            Idfv: this.userFlyerParam(nativeDeviceInfo?.idfv),
            AppsflyerId: adId,
            AdjustId: adId
        };

        console.log('[UserFlyer] native device info:', nativeDeviceInfo);
        console.log('[UserFlyer] request params:', params);

        await post(API.userFlyer, params)
    }

    private async getUserFlyerDeviceInfo() {
        const cached = getCachedA0019DeviceIdentifiers();
        if (cached) return cached;
        if (!isA0019Native()) return null;

        try {
            return await getDeviceIdentifiers();
        } catch (error) {
            console.warn('[LoginedMissions] getDeviceIdentifiers failed:', error);
            return null;
        }
    }

    private startNativePushBinding() {
        if (!isA0019Native()) return;

        if (!this.nativePushTokenUnsubscribe) {
            this.nativePushTokenUnsubscribe = subscribeNativePushToken((token) => {
                void this.bindNativePushToken(token);
            });
        }

        const cached = getCachedNativePushToken();
        if (cached) {
            void this.bindNativePushToken(cached);
        }

        void this.requestNativeNotificationPermission();
    }

    private async requestNativeNotificationPermission() {
        try {
            const result = await checkPermission(A0019PermissionGetType.Notification);
            if (!result.isOpen) {
                console.warn('[NativePush] notification permission is not open');
            }
        } catch (error) {
            console.warn('[NativePush] notification permission request failed:', error);
        }
    }

    private async bindNativePushToken(token: string) {
        const value = token.trim();
        if (!value || this.isBindingNativePushToken || this.lastBoundNativePushToken == value) return;

        const userStore = useUserStore();
        if (!userStore.token || !userStore.userInfo?.UserId) {
            console.log('[NativePush] skip bindToken before user is ready');
            return;
        }

        this.isBindingNativePushToken = true;
        try {
            const res = await post(API.apns_bind, { Token: value });
            if (String(res?.code) == '0') {
                this.lastBoundNativePushToken = value;
                console.log('[NativePush] bindToken success');
            } else {
                console.warn('[NativePush] bindToken failed:', res);
            }
        } catch (error) {
            console.warn('[NativePush] bindToken error:', error);
        } finally {
            this.isBindingNativePushToken = false;
        }
    }
}

export default new LoginedMissions()
