import AgoraRTC, { type ILocalVideoTrack, type ICameraVideoTrack } from 'agora-rtc-sdk-ng';

export class VideoMaskTool {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D | null;
    private video: HTMLVideoElement;
    private rafId: number = 0;
    private isMasking: boolean = false;
    public customTrack: ILocalVideoTrack | null = null;
    
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.video = document.createElement('video');
        this.video.autoplay = true;
        this.video.playsInline = true;
        this.video.muted = true;
    }
    
    /**
     * 将传入的摄像头轨道进行全屏高斯模糊处理并返回新的自定义轨道
     */
    public async enableMask(track: ICameraVideoTrack | ILocalVideoTrack): Promise<ILocalVideoTrack> {
        if (this.isMasking) return this.customTrack!;
        
        this.isMasking = true;
        const mediaStreamTrack = track.getMediaStreamTrack();
        const stream = new MediaStream([mediaStreamTrack]);
        this.video.srcObject = stream;
        
        await this.video.play();
        
        // 动态根据视频实际分辨率设置画布
        this.canvas.width = this.video.videoWidth || 640;
        this.canvas.height = this.video.videoHeight || 480;
        
        const drawLoop = () => {
            if (!this.isMasking) return;
            if (this.ctx && this.video.readyState >= 2) {
                // 如果实际分辨率发生变化，重置画布大小
                if (this.canvas.width !== this.video.videoWidth) {
                    this.canvas.width = this.video.videoWidth;
                    this.canvas.height = this.video.videoHeight;
                }
                
                // 应用全屏高斯模糊 (匹配 iOS 原生的 CIGaussianBlur)
                this.ctx.filter = 'blur(15px)';
                this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
            }
            this.rafId = requestAnimationFrame(drawLoop);
        };
        
        drawLoop();
        
        // 从 canvas 抓取 30fps 的流
        const canvasStream = this.canvas.captureStream(30);
        const blurredMediaTrack = canvasStream.getVideoTracks()[0];
        if (!blurredMediaTrack) throw new Error("Failed to capture stream from canvas");
        
        this.customTrack = AgoraRTC.createCustomVideoTrack({ mediaStreamTrack: blurredMediaTrack });
        return this.customTrack;
    }
    
    /**
     * 停止模糊处理
     */
    public disableMask() {
        this.isMasking = false;
        cancelAnimationFrame(this.rafId);
        
        if (this.customTrack) {
            this.customTrack.close();
            this.customTrack = null;
        }
        
        if (this.video.srcObject) {
            // 注意不要 stop 原始 MediaStream的track，这会把真实摄像头也关掉，只清除关联即可
            this.video.srcObject = null;
        }
    }
}
