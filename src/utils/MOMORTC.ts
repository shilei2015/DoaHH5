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
    unkonw = "204"
}
class RTCService {
    public client: IAgoraRTCClient | null = null;
    public localAudioTrack: IMicrophoneAudioTrack | null = null;
    public localVideoTrack: ICameraVideoTrack | null = null;
    public remoteUser = ref<IAgoraRTCRemoteUser | null>(null)
    public remoteVideoTrack = ref<IRemoteVideoTrack | null>(null)
    public remoteOnline = false;
    public remoteUid: string | number = 0;

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

            if (this._isCaller) {
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

        client.on('user-unpublished', (user: IAgoraRTCRemoteUser) => {
            console.log('[RTC] user-unpublished', user.uid);
            // delete this.remoteUsers[user.uid];
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
                    this.endStreamSession("对方声网离线自动挂断", EndLiveEndState.remoteAgoraExit);
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
                tracks.push(this.localVideoTrack);
            } catch (e) {
                console.error('[RTC] Create Video Track Failed:', e);
            }

            if (tracks.length > 0) {
                await client.publish(tracks as any);
                console.log('[RTC] publish success');
            }

            return { audio: this.localAudioTrack, video: this.localVideoTrack };
        } catch (e) {
            console.error('[RTC] publish failed', e);
            throw e;
        }
    }

    /**
     * 离开频道
     */
    public async leave(): Promise<void> {
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
            // Optional: reset client to allow full re-init if needed
            // this.client = null;
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


    private _currentCallInfo?: CallInfoModel
    private _isCaller = false;
    public async startAnchorCall(anchorId: string) {
        this._isCaller = true;
        try {
            HUD.showLoading();
            const res = await post(API.video_to_user, { ToUserId: anchorId });
            HUD.hideLoading();

            if (res.code == "0") {
                const callInfo = res.data;
                if (callInfo) {
                    useCallStore().setCurrentCallInfo(callInfo);
                    this._currentCallInfo = callInfo;
                    // Join and push
                    if (callInfo.LiveToken) {
                        await this.join(
                            callInfo.LiveToken.RoomId,
                            callInfo.LiveToken.UserRtcToken,
                            callInfo.LiveToken.SysUserId
                        );
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

    public async answerCall() {
        this._isCaller = false;
        let callInfo = this._currentCallInfo
        if (callInfo && callInfo.LiveToken) {
            let res = await this.firstCharge()
            switch (res) {
                case ChargeResult.Success:
                    break;
                case ChargeResult.Faild:
                    HUD.showToast("扣费失败");
                    return;
                case ChargeResult.NeedCoins:
                    HUD.showToast("余额不足，请充值");
                    return;
            }
            await this.join(
                callInfo.LiveToken.RoomId,
                callInfo.LiveToken.UserRtcToken,
                callInfo.LiveToken.SysUserId
            )

            // 被叫端容错：15秒对方没进房，自动挂断
            setTimeout(() => {
                if (!this.remoteOnline && this._currentCallInfo) {
                    console.log("接听方进入频道超过15秒未收到远端加入消息，主动挂断");
                    this.endStreamSession("接听方等候超时", EndLiveEndState.remoteAgoraExit);
                }
            }, 15000);
        }
        router.push({ name: "videoPage" });
    }

    private handleUserJoined() {
        if (this._isCaller) {
            router.push({ name: "videoPage" });
        }
    }

    public async endStreamSession(reason: string, endState: EndLiveEndState) {
        if (this._currentCallInfo) {
            let liveId = this._currentCallInfo.LiveId;
            let playEnd = false; // 目前不管假视频的情况
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

        // 挂断本地
        this.timer.stop();
        this.timer.totalTime = 0;
        await this.leave();
        this._currentCallInfo = undefined;
        this.remoteOnline = false;
        this.remoteUid = 0;

        // 挂断后退出页面
        router.back();
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
                //TODO: 余额不足后期接入充值大弹窗
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
        // 每分钟末尾扣费 (59s, 119s, 等)
        if (Math.floor(totalTime) % 60 === 59) {
            this.chargeCall(this._currentCallInfo.LiveId).then(res => {
                if (res === ChargeResult.NeedCoins) {
                    HUD.showToast("金币不足，已挂断");
                    this.endStreamSession("扣费失败，金币不足", EndLiveEndState.notCoins);
                } else if (res === ChargeResult.Faild) {
                    HUD.showToast("扣费网络异常");
                    this.endStreamSession("扣费请求失败", EndLiveEndState.unkonw);
                }
            });
        }
    }
}


export default new RTCService();

