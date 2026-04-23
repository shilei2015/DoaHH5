import { useUserStore } from '@/stores/userStore';
import { useMomoRTM } from "./MOMORTM"
import { API } from "./net/api"
import { post } from "./net/request"
import { LHTimer } from "./Timer"
import { reactive } from 'vue';
import { initDB } from './msg/DBService';
import { NET_CONFIG } from './net/config';
import { getCachedA0019DeviceIdentifiers, getDeviceIdentifiers, isA0019Native } from './native/A0019Bridge';

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
        })();

        return this.initPromise;
    }

    public stop() {
        this.timer.stop()
        this.initPromise = null
        this.isStarted = false
        this.isEnvInitialized = false
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

    private async sendAdId() {
        const nativeDeviceInfo = await this.getUserFlyerDeviceInfo();
        const adId = nativeDeviceInfo?.adId || NET_CONFIG.AdId || '';
        const rawPayload = {
            Imei: nativeDeviceInfo?.deviceId || '',
            Idfa: nativeDeviceInfo?.idfa || '',
            Idfv: nativeDeviceInfo?.idfv || '',
            AppsflyerId: adId,
            AdjustId: adId
        };
        const payload = Object.fromEntries(
            Object.entries(rawPayload).filter(([, value]) => {
                if (value === null || value === undefined) return false;
                return String(value).trim().length > 0;
            })
        );

        console.log('[LoginedMissions] userFlyer device info source:', {
            isA0019Native: isA0019Native(),
            nativeDeviceInfo,
            fallbackAdId: NET_CONFIG.AdId || ''
        });
        console.log('[LoginedMissions] userFlyer payload:', payload);

        await post(API.userFlyer, payload)
    }

    private async getUserFlyerDeviceInfo() {
        const cached = getCachedA0019DeviceIdentifiers();
        if (cached) {
            console.log('[LoginedMissions] using cached native device identifiers:', cached);
            return cached;
        }
        if (!isA0019Native()) {
            console.log('[LoginedMissions] current environment is not A0019 native, skip device identifier request');
            return null;
        }

        try {
            const info = await Promise.race([
                getDeviceIdentifiers(),
                new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500))
            ]);
            console.log('[LoginedMissions] getUserFlyerDeviceInfo resolved:', info);
            return info;
        } catch (error) {
            console.warn('[LoginedMissions] getDeviceIdentifiers failed:', error);
            return null;
        }
    }
}

export default new LoginedMissions()
