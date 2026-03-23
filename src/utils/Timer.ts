/**
 * 可控制的循环定时器类
 * 支持：指定间隔、启动、暂停、停止、重新开始
 */
export class LHTimer {
    // 定时器ID（TS类型：Node.js环境用NodeJS.Timeout，浏览器环境用number）
    private timerId: number | null = null
    // 执行间隔（毫秒）
    private interval: number;
    // 定时器回调函数
    private callback: () => void;
    // 累积执行时长 (秒)
    public totalTime: number = 0;
    // 定时器状态
    private isPaused: boolean = false;
    private isRunning: boolean = false;
    // 记录暂停时剩余的时间（用于精准恢复）
    private remainingTime: number = 0;
    // 记录定时器启动时间戳（用于计算剩余时间）
    private startTime: number = 0;

    /**
     * 构造函数
     * @param interval 执行间隔（毫秒，必须大于0）
     * @param callback 每次执行的回调函数
     */
    constructor(interval: number, callback: () => void) {
        // 参数校验
        if (typeof interval !== 'number' || interval <= 0) {
            throw new Error('间隔时间必须是大于0的数字');
        }
        if (typeof callback !== 'function') {
            throw new Error('回调函数必须是一个函数');
        }

        this.interval = interval;
        this.callback = callback;
    }

    /**
     * 启动定时器（首次启动/重新开始）
     */
    start(): void {
        // 如果已经在运行且未暂停，直接返回
        if (this.isRunning && !this.isPaused) {
            console.warn('定时器已在运行中');
            return;
        }

        // 如果是暂停后重新启动，恢复剩余时间的执行
        if (this.isPaused) {
            this.startTime = Date.now();
            this.timerId = setTimeout(() => {
                this.totalTime += this.interval / 1000;
                this.callback();
                // 恢复后继续按原间隔执行
                this.timerId = setInterval(() => {
                    this.totalTime += this.interval / 1000;
                    this.callback();
                }, this.interval);
                this.isPaused = false;
            }, this.remainingTime);
        } else {
            // 首次启动，直接按间隔执行
            this.timerId = setInterval(() => {
                this.totalTime += this.interval / 1000;
                this.callback();
            }, this.interval);
            this.startTime = Date.now();
        }

        this.isRunning = true;
        this.isPaused = false;
    }

    /**
     * 暂停定时器（保留当前状态，可恢复）
     */
    pause(): void {
        if (!this.isRunning || this.isPaused) {
            console.warn('定时器未运行或已暂停');
            return;
        }

        // 清除当前定时器
        if (this.timerId) {
            clearTimeout(this.timerId);
            clearInterval(this.timerId);
        }

        // 计算剩余未执行的时间
        const elapsedTime = Date.now() - this.startTime;
        this.remainingTime = Math.max(0, this.interval - elapsedTime);

        this.isPaused = true;
    }

    /**
     * 停止定时器（重置所有状态）
     */
    stop(): void {
        // 清除定时器
        if (this.timerId) {
            clearTimeout(this.timerId);
            clearInterval(this.timerId);
            this.timerId = null;
        }

        // 重置状态
        this.isRunning = false;
        this.isPaused = false;
        this.remainingTime = 0;
        this.startTime = 0;
        this.totalTime = 0;
    }

    /**
     * 修改定时器间隔（修改后需重新start生效）
     * @param newInterval 新的间隔时间（毫秒）
     */
    setInterval(newInterval: number): void {
        if (typeof newInterval !== 'number' || newInterval <= 0) {
            throw new Error('新间隔时间必须是大于0的数字');
        }
        this.interval = newInterval;
        // 如果定时器正在运行，先停止再启动（可选：也可以让用户手动重启）
        if (this.isRunning) {
            this.stop();
            this.start();
        }
    }

    /**
     * 获取当前定时器状态
     */
    getStatus(): { isRunning: boolean; isPaused: boolean; interval: number } {
        return {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            interval: this.interval
        };
    }
}