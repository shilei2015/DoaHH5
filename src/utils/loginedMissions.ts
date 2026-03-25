import { useUserStore } from '@/stores/userStore';
import { useMomoRTM } from "./MOMORTM"
import { API } from "./net/api"
import { post } from "./net/request"
import { LHTimer } from "./Timer"
import { reactive } from 'vue';
import { initDB } from './msg/DBService';


class LoginedMissions {

    private timer = new LHTimer(1000, () => this.timerTask())
    private isStarted = false
    private initPromise: Promise<void> | null = null;

    public async start() {
        if (this.initPromise) return this.initPromise;

        this.initPromise = (async () => {
            this.minuteTimerTask()
            this.timer.start()
            await this.loginRTM()
        })();

        return this.initPromise;
    }

    public stop() {
        this.timer.stop()
    }

    private timerTask() {
        let currentSecond = Math.floor(this.timer.totalTime)
        if (currentSecond % 60 == 0) {
            this.minuteTimerTask()
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


}

export default new LoginedMissions()