import { useUserStore } from '@/stores/userStore';
import { useMomoRTM } from "./MOMORTM"
import { API } from "./net/api"
import { post } from "./net/request"
import { LHTimer } from "./Timer"
import { reactive } from 'vue';
import { initDB } from './msg/DBService';

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
    private initPromise: Promise<void> | null = null;

    private nextMatchOutTime = 5

    public async start() {
        if (this.initPromise) return this.initPromise;

        this.initPromise = (async () => {
            this.minuteTimerTask()
            this.nextMatchOutTime = 5
            this.timer.start()
            await this.loginRTM()
        })();

        return this.initPromise;
    }

    public stop() {
        this.timer.stop()
        this.initPromise = null
        this.isStarted = false
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

    private async loginRTM() {
        const userStore = useUserStore()
        const rtm = useMomoRTM()
        await userStore.updateRTMToken()
        await userStore.updateLoginUserInfo()
        if (userStore.userInfo?.UserId && userStore.rtmToken) {
            initDB(userStore.userInfo.UserId)
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

}

export default new LoginedMissions()