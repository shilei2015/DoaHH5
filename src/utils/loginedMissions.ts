import { API } from "./net/api"
import { post } from "./net/request"
import { LHTimer } from "./Timer"

class LoginedMissions {

    private timer = new LHTimer(1000, () => this.timerTask())

    public start() {
        this.minuteTimerTask()
        this.timer.start()
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

}

export default new LoginedMissions()