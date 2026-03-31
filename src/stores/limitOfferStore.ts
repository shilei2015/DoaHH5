import type { LimitOffModel } from './../components/appModels/LimitOffModel';
import { ref, computed, reactive } from 'vue'
import { defineStore } from 'pinia'

export const useLimitOfferStore = defineStore('useLimitOfferStore', () => {

    /**
     * 维护弹窗展示的时间范围 (startTime, endTime)
     */
    const showTimeRange = reactive({
        startTime: 0,
        endTime: 0
    })

    const lastModalShownStartTime = ref(0) // 最近一次触发全屏弹窗所属的 startTime 标记

    const limitOffInfoModel = ref<LimitOffModel | null>(null)

    /**
     * 【方法】判断目标时间是否在两个数字区间内
     */
    const isTimeInPeriod = (target: number, start: number, end: number) => {
        if (start === 0 || end === 0) return false;
        return target >= start && target <= end;
    }

    /**
     * 【计算属性】当前是否属于“限时优惠中”的状态
     * 只要当前时间在 startTime 和 endTime 之间，即返回 true
     */
    const isOfferActive = computed(() => {
        return isTimeInPeriod(Date.now(), showTimeRange.startTime, showTimeRange.endTime);
    })

    /**
     * 接收服务端下发的配置，并尝试更新/重算展示时间段
     */
    const updateTimeInfo = (limitOffInfo: LimitOffModel) => {
        limitOffInfoModel.value = limitOffInfo
        updateRangeInfo()
    }

    /**
     * 核心逻辑计算：决定下一次弹窗的具体起止时间戳
     */
    const updateRangeInfo = () => {
        if (!limitOffInfoModel.value) return

        // 解析配置：FirstStart 为等待时长，LimitTime 为持续时长
        // （通常后端配置为秒，这里我们转成毫秒进行时间戳运算）
        const awaitTime = Number(limitOffInfoModel.value.FirstStart || 0) * 1000
        const countDownTime = Number(limitOffInfoModel.value.LimitTime || 0) * 1000

        const now = Date.now()

        // 1. 如果当前就在优惠有效期内，维持现状，不重新计算
        if (isTimeInPeriod(now, showTimeRange.startTime, showTimeRange.endTime)) {
            return
        }

        // 2. 如果今天已经触发过 (由 startTime 的日期判定)
        // 且现在已经过了 endTime（说明倒计时已结束并失效），本日不再弹出
        const todayIsStarted = isSameDay(now, showTimeRange.startTime)
        if (todayIsStarted) {
            return
        }

        // 3. 开启新的倒计时区间：本次打开应用后的 FirstStart 秒后开始弹出
        const nextStartTime = now + awaitTime
        const nextEndTime = nextStartTime + countDownTime

        showTimeRange.startTime = nextStartTime
        showTimeRange.endTime = nextEndTime
    }

    /**
     * 辅助方法：判断两个时间点是否属于同一天
     */
    function isSameDay(timestamp1: number, timestamp2: number) {
        if (timestamp1 === 0 || timestamp2 === 0) return false;
        const d1 = new Date(timestamp1);
        const d2 = new Date(timestamp2);

        return d1.getFullYear() === d2.getFullYear()
            && d1.getMonth() === d2.getMonth()
            && d1.getDate() === d2.getDate();
    }

    const reset = () => {
        showTimeRange.startTime = 0;
        showTimeRange.endTime = 0;
        lastModalShownStartTime.value = 0;
    }

    return {
        updateTimeInfo,
        showTimeRange,
        isOfferActive,
        isTimeInPeriod,
        limitOffInfoModel,
        lastModalShownStartTime,
        reset
    }
}, {
    persist: {
        pick: ['showTimeRange', 'lastModalShownStartTime']
    }
})
