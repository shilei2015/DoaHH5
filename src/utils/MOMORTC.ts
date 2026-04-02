import { reactive, ref } from 'vue';
import AgoraRTC, {
    type IAgoraRTCClient,
    type IMicrophoneAudioTrack,
    type ICameraVideoTrack,
    type IAgoraRTCRemoteUser,
    type IRemoteVideoTrack,
    type UID
} from 'agora-rtc-sdk-ng';
import { NET_CONFIG } from './net/config';
import { CallInfoModel } from '@/components/appModels/CallInfoModel';
import { post } from './net/request';
import { API } from './net/api';
import HUD from '@/components/HUD';
import { useCallStore } from '@/stores/callStore';
import router from '@/router';
import { isCallChain } from 'typescript';
import { } from 'agora-rtc-sdk-ng';
import { LHTimer } from './Timer';
import { useUserStore } from '@/stores/userStore';
import { showCoinShop } from './tools/shopService';

const AGORA_APP_ID = NET_CONFIG.SWID;
AgoraRTC.setLogLevel(2);

enum ChargeResult {
    Success = 0,
    Faild = 1,
    NeedCoins = 2,
}

export enum EndLiveEndState {
    noMeaning = "-1",
    notSelfHangUp = "0",
    remoteAgoraExit = "101",
    agoraExited = "102",
    hangUpByClick = "200",
    notCoins = "203",
    playEnd = "4",
    unkonw = "204"
}
class RTCService {
    public client: IAgoraRTCClient | null = null;
    public localAudioTrack: IMicrophoneAudioTrack | null = null;
    public localVideoTrack: ICameraVideoTrack | null = null;
    public isVideoMasked = ref(false);
    public remoteUser = ref<IAgoraRTCRemoteUser | null>(null)
    public remoteVideoTrack = ref<IRemoteVideoTrack | null>(null)
    public remoteOnline = false;
    public remoteUid: string | number = 0;
    public isCaller = false;
    public fakeAcceptTimer: any = null;

    public get isVideoMode(): boolean {
        return this._currentCallInfo?.User?.AnchorType === '30';
    }

    private timer: LHTimer = new LHTimer(1000, () => this.callTimerTask())

    constructor() {
        // Now constructor is empty to prevent early initialization
    }

    /**
     * Ensure the RTC client is created and event listeners are registered
     */
    private _ensureClient(): IAgoraRTCClient {
        if (this.client) return this.client;

        console.log("[RTC] Creating client instance...");
        this.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        this._initEventListeners(this.client);
        return this.client;
    }

    private _initEventListeners(client: IAgoraRTCClient): void {
        client.on('user-published', async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
            try {
                await client.subscribe(user, mediaType);

                console.log('[RTC] subscribe success', mediaType);

                if (mediaType === 'video') {
                    this.remoteUser.value = user
                    this.remoteVideoTrack.value = user.videoTrack || null
                }
                if (mediaType === 'audio') {
                    user.audioTrack?.play();
                }
            } catch (error) {
                console.error('[RTC] subscribe failed', error);
            }
        });

        client.on('user-joined', (user: IAgoraRTCRemoteUser) => {
            console.log('[RTC] user-joined', user.uid);
            this.remoteUser.value = user
            this.remoteOnline = true;
            this.remoteUid = user.uid;

            if (this.isCaller) {
                // 主叫方：对方进房后进行首次扣费
                this.firstCharge().then(res => {
                    if (res === ChargeResult.NeedCoins) {
                        HUD.showToast("余额不足");
                        this.endStreamSession("扣费失败，金币不足", EndLiveEndState.notCoins);
                    } else if (res === ChargeResult.Faild) {
                        HUD.showToast("扣费失败");
                        this.endStreamSession("首次扣费网络异常", EndLiveEndState.unkonw);
                    } else {
                        // 扣费成功，可进入音视频
                        this.handleUserJoined();
                    }
                });
            } else {
                // 接听方已经在接通前扣过费了
                this.handleUserJoined()
            }
        });

        client.on('user-unpublished', (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
            console.log('[RTC] user-unpublished', user.uid, mediaType);
            if (mediaType === 'video') {
                // 关键点：清空轨道引用，确保下次重新发布时 Vue 的 watch 能识别到变化并触发 play()
                this.remoteVideoTrack.value = null;
            }
        });

        client.on('user-left', (user: IAgoraRTCRemoteUser) => {
            console.log('[RTC] user-left', user.uid);
            this.remoteUser.value = null
            this.remoteVideoTrack.value = null
            this.remoteOnline = false;
            this.remoteUid = 0;

            // 延迟1秒挂断，防止网络抖动导致的误触
            setTimeout(() => {
                if (!this.remoteOnline && this._currentCallInfo) {
                    this.handleRemoteHangup();
                }
            }, 1000);
        });
    }

    /**
     * 加入频道
     */
    public async join(channel: string, token: string | null, uid: string | number | null): Promise<void> {
        try {
            const client = this._ensureClient();
            const uidNum = uid ? Number(uid) : null;
            await client.join(AGORA_APP_ID, channel, token, uidNum);
            console.log('[RTC] join success', channel);
        } catch (e) {
            console.error('[RTC] join failed', e);
            throw e;
        }
    }

    /**
     * 发布本地流
     */
    public async publish(): Promise<{ audio: IMicrophoneAudioTrack | null; video: ICameraVideoTrack | null }> {
        try {
            const client = this._ensureClient();
            console.log('[RTC] Starting to publish tracks...');

            // 检查是否在安全上下文中
            if (!window.isSecureContext && window.location.hostname !== 'localhost') {
                throw new Error('浏览器安全策略限制：获取摄像头权限需要 HTTPS 环境或 localhost。');
            }

            // 尝试创建音视频轨道
            const tracks: (IMicrophoneAudioTrack | ICameraVideoTrack)[] = [];

            try {
                if (!this.localAudioTrack) {
                    this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
                }
                tracks.push(this.localAudioTrack);
            } catch (e) {
                console.error('[RTC] Create Audio Track Failed:', e);
            }

            try {
                if (!this.localVideoTrack) {
                    this.localVideoTrack = await AgoraRTC.createCameraVideoTrack();
                }

                if (this.isVideoMasked.value) {
                    await this.localVideoTrack.setMuted(true);
                }

                tracks.push(this.localVideoTrack);
            } catch (e) {
                console.error('[RTC] Create Video Track Failed:', e);
            }

            if (tracks.length > 0) {
                // 特别注意：马甲模式没有真实的 RTC 频道，不需要（也无法）发布到云端
                if (this.isVideoMode) {
                    console.log('[RTC] Fake mode detected, skipping cloud publish, local capture only.');
                } else {
                    const client = this._ensureClient();
                    await client.publish(tracks as any);
                    console.log('[RTC] publish success');
                }
            }

            return { audio: this.localAudioTrack, video: this.localVideoTrack };
        } catch (e) {
            console.error('[RTC] capture/publish failed', e);
            throw e;
        }
    }

    /**
     * 离开频道
     */
    public async leave(): Promise<void> {
        if (this.fakeAcceptTimer) {
            clearTimeout(this.fakeAcceptTimer);
            this.fakeAcceptTimer = null;
        }

        if (this.localAudioTrack) {
            this.localAudioTrack.stop();
            this.localAudioTrack.close();
            this.localAudioTrack = null;
        }
        if (this.localVideoTrack) {
            this.localVideoTrack.stop();
            this.localVideoTrack.close();
            this.localVideoTrack = null;
        }

        if (this.client) {
            await this.client.leave();
        }

        useCallStore().clearCallInfo();
        this.remoteUser.value = null
        this.remoteVideoTrack.value = null
        console.log('[RTC] leave success');
    }

    /**
     * 切换摄像头
     */
    public async switchCamera(deviceId?: string): Promise<void> {
        if (!this.localVideoTrack) return;
        try {
            if (deviceId) {
                await this.localVideoTrack.setDevice(deviceId);
                return;
            }

            const devices = await AgoraRTC.getCameras();
            if (devices.length <= 1) {
                console.warn('[RTC] No other camera devices available');
                return;
            }

            const currentSettings = this.localVideoTrack.getMediaStreamTrack().getSettings();
            const currentId = currentSettings.deviceId;

            const currentIndex = devices.findIndex(d => d.deviceId === currentId);
            const nextIndex = (currentIndex + 1) % devices.length;
            const nextDevice = devices[nextIndex];

            if (nextDevice) {
                console.log(`[RTC] Switching camera to: ${nextDevice.label || nextDevice.deviceId}`);
                await this.localVideoTrack.setDevice(nextDevice.deviceId);
            }
        } catch (e) {
            console.error('[RTC] switchCamera failed', e);
        }
    }

    /**
     * 控制本地视频画面开关
     */
    public async toggleVideoMask(enable: boolean) {
        this.isVideoMasked.value = enable;
        if (!this.localVideoTrack) return;

        try {
            await this.localVideoTrack.setMuted(enable);
        } catch (error) {
            console.error('[RTC] toggleVideoMask error:', error);
        }
    }


    private _currentCallInfo?: CallInfoModel
    public async startAnchorCall(anchorId: string) {
        this.isCaller = true;
        try {
            HUD.showLoading();
            const res = await post(API.video_to_user, { ToUserId: anchorId });
            HUD.hideLoading();

            if (res.code == "0") {
                const callInfo = res.data;
                if (callInfo) {
                    useCallStore().setCurrentCallInfo(callInfo);
                    this._currentCallInfo = callInfo;
                    if (this.isVideoMode) {
                        // 仅做标记，由 UI 引导接听，不再自动启动定时器执行接接听任务
                    } else if (callInfo.LiveToken) {
                        this.join(
                            callInfo.LiveToken.RoomId,
                            callInfo.LiveToken.UserRtcToken,
                            callInfo.LiveToken.SysUserId
                        ).catch(e => {
                            console.error("[RTC] background join error:", e);
                        });
                    }
                    router.push({ name: "callPage", query: { role: "caller" } });
                }
            } else {
                HUD.showToast(res.data?.toast || "Call failed");
            }
        } catch (error: any) {
            console.error("[RTC] startAnchorCall error:", error);
            HUD.showToast("Networking error");
        }
    }

    public setIncomingCall(callInfo: CallInfoModel) {
        this._currentCallInfo = callInfo;
        this.isCaller = false;
    }

    public async answerCall() {
        HUD.showLoading();
        this.isCaller = false;
        let callInfo = this._currentCallInfo

        if (callInfo) {
            // 无论是真人还是马甲，接听前都需尝试扣费（针对非免费通话）
            let res = await this.firstCharge()
            switch (res) {
                case ChargeResult.Success:
                    break;
                case ChargeResult.Faild:
                    HUD.hideLoading()
                    HUD.showToast("扣费失败");
                    return;
                case ChargeResult.NeedCoins:
                    HUD.hideLoading()
                    HUD.showToast("余额不足，请充值");
                    return;
            }

            if (this.isVideoMode) {
                // --- 视频马甲支线 ---
                HUD.hideLoading()
                this.remoteOnline = true;
                this.timer.start();
                router.replace({ name: 'videoPage' });
                
                // 统一 20 秒后自动挂断退出
                if (this.fakeAcceptTimer) clearTimeout(this.fakeAcceptTimer);
                this.fakeAcceptTimer = setTimeout(() => {
                    console.log("[RTC] Fake video callee session timeout (20s). Ending...");
                    this.endStreamSession("Fake video timeout", EndLiveEndState.playEnd);
                }, 20000);
                return; // 结束逻辑，不走下方的声网入会
            }

            // --- 正常声网支线 ---
            if (callInfo.LiveToken) {
                await this.join(
                    callInfo.LiveToken.RoomId,
                    callInfo.LiveToken.UserRtcToken,
                    callInfo.LiveToken.SysUserId
                )
                HUD.hideLoading()
                // 被叫端容错：15秒对方没进房，自动挂断
                setTimeout(() => {
                    if (!this.remoteOnline && this._currentCallInfo) {
                        this.handleRemoteHangup();
                    }
                }, 15000);
                router.replace({ name: "videoPage" });
            }
        }
    }

    private handleUserJoined() {
        if (this.isCaller) {
            router.replace({ name: "videoPage" });
        }
    }

    /**
     * 手动触发马甲视频接听进入
     */
    public async handleFakeVideoJoined() {
        if (!this._currentCallInfo || !this.isCaller) return;
        const res = await this.firstCharge();
        if (res === ChargeResult.NeedCoins) {
            HUD.showToast("余额不足");
            this.endStreamSession("扣费失败，金币不足", EndLiveEndState.notCoins);
        } else if (res === ChargeResult.Faild) {
            HUD.showToast("扣费失败");
            this.endStreamSession("首次扣费网络异常", EndLiveEndState.unkonw);
        } else {
            // 扣费成功，模拟进入画面
            this.remoteOnline = true;
            this.timer.start();
            router.replace({ name: 'videoPage' });

            // 马甲视频统一 20 秒后自动挂断退出
            if (this.fakeAcceptTimer) clearTimeout(this.fakeAcceptTimer);
            this.fakeAcceptTimer = setTimeout(() => {
                console.log("[RTC] Fake video session timeout (20s). Ending...");
                this.endStreamSession("Fake video timeout", EndLiveEndState.playEnd);
            }, 20000);
        }
    }

    /**
     * 系统退出通话 UI 逻辑 (支持双层回退)
     */
    private exitCallUI() {
        const currentRouteName = router.currentRoute.value.name as string;
        if (currentRouteName === 'callPage' || currentRouteName === 'videoPage') {
            router.back();

            // 针对被叫场景优化：首页 -> callPage -> videoPage
            // 第一次 back 回到来电页，如果发现还在通话流程内，则继续 back
            setTimeout(() => {
                const nextRoute = router.currentRoute.value.name;
                if (nextRoute === 'callPage' || nextRoute === 'videoPage') {
                    router.back();
                }
            }, 150);
        }
    }

    public async endStreamSession(reason: string, endState: EndLiveEndState) {
        // 1. 立即执行 UI 回退，防止数据清空后页面残留
        this.exitCallUI();

        if (this._currentCallInfo) {
            let liveId = this._currentCallInfo.LiveId;
            let playEnd = false;
            let liveTime = Math.floor(this.timer.totalTime);

            try {
                const params = {
                    LiveId: liveId,
                    PlayEnd: playEnd ? 'true' : 'false',
                    LiveTime: liveTime.toString(),
                    Reason: reason,
                    EndState: endState.toString()
                };
                await post(API.video_stop, params);
            } catch (e) {
                console.error("[RTC] endStream failed", e);
            }
        }

        this.timer.stop();
        this.timer.totalTime = 0;
        await this.leave();
        this._currentCallInfo = undefined;
        this.remoteOnline = false;
        this.remoteUid = 0;
    }

    /**
     * 响应远端挂断信号 (仅清理本地资源和回退 UI，不上报结束接口)
     */
    public async handleRemoteHangup() {
        // 1. 响应远端挂断，立即回退 UI
        this.exitCallUI();

        this.timer.stop();
        this.timer.totalTime = 0;
        await this.leave();
        this._currentCallInfo = undefined;
        this.remoteOnline = false;
        this.remoteUid = 0;
    }

    private async firstCharge(): Promise<ChargeResult> {
        if (this._currentCallInfo?.LiveId) {
            let res = await this.chargeCall(this._currentCallInfo?.LiveId)
            if (res === ChargeResult.Success) {
                this.timer.start();
            }
            return res
        }
        return ChargeResult.Faild
    }

    private async chargeCall(LiveId: string): Promise<ChargeResult> {
        try {
            const params = {
                LiveId: LiveId
            }
            const res = await post(API.video_charging, params)
            if (res.code == "10103") {
                showCoinShop()
                return ChargeResult.NeedCoins
            } else if (res.code != "0") {
                return ChargeResult.Faild
            }
            if (res.data.Coins) {
                let coins: string = res.data.Coins
                const userInfo = useUserStore().userInfo
                if (userInfo) {
                    userInfo.Coins = coins
                }
            }
            return ChargeResult.Success
        } catch (error) {
            return ChargeResult.Faild
        }
    }

    private callTimerTask() {
        if (!this._currentCallInfo) return;

        let totalTime = this.timer.totalTime;
        if (Math.floor(totalTime) % 60 === 59) {
            this.chargeCall(this._currentCallInfo.LiveId).then(res => {
                if (res === ChargeResult.NeedCoins) {
                    this.endStreamSession("扣费失败，金币不足", EndLiveEndState.notCoins);
                } else if (res === ChargeResult.Faild) {
                    this.endStreamSession("扣费请求失败", EndLiveEndState.unkonw);
                }
            });
        }
    }
}

export default new RTCService();
