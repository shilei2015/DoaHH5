import { TranslateState } from './msg/MessageModel';
import AgoraRTM from 'agora-rtm-sdk';
import { ref } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { NET_CONFIG } from './net/config';
import { getMessageManager } from '@/utils/msg/MessageManager';
import { createUUID, MessageType, type LHMessage } from '@/utils/msg/MessageModel';
import type { RTMClient, RTMEvents } from 'agora-rtm-sdk';
import loginedMissions from './loginedMissions';
import type { CallInfoModel } from '@/components/appModels/CallInfoModel';
import { useCallStore } from '@/stores/callStore';
import router from '@/router';
import RTCService from './MOMORTC';
import { notificationService } from './tools/notificationService';
import { isDBInitialized, onDBReady } from './msg/DBService';

// Singleton client instance
let rtmClient: RTMClient | null = null;
const isRtmLoggedIn = ref(false);

const APP_ID = NET_CONFIG.SWID;

interface MOMORtmMessage {
    type: string
    message?: Object
    data?: Object
}

interface PendingChatPacket {
    payload: MOMORtmMessage
    event: any
}

type IncomingMessageUser = NonNullable<LHMessage['fromUser']>;

const pendingChatPackets: PendingChatPacket[] = [];
let isFlushingPendingChatPackets = false;
let hasRegisteredDBReadyFlush = false;
const MAX_PENDING_CHAT_PACKETS = 100;

export function useMomoRTM() {
    const userStore = useUserStore();

    /**
     * Initialize and Login RTM
     */
    const loginRTM = async (uid: string, token: string) => {
        if (rtmClient && isRtmLoggedIn.value) return;

        AgoraRTM.setArea({
            areaCodes: [AgoraRTM.constantsType.AreaCode.GLOBAL],
        });


        try {
            if (!rtmClient) {
                console.log("[RTM] Creating client instance...");
                rtmClient = new AgoraRTM.RTM(APP_ID, uid, {
                    encryptionMode: 'NONE',
                });

                // Global event listeners
                rtmClient.addEventListener('message', handleMessageasync);

                rtmClient.addEventListener('status', (event: any) => {
                    console.log("[RTM] Connection Status Changed:", event.state, event.reason);
                    if (event.state === 'CONNECTED') {
                        isRtmLoggedIn.value = true;
                    } else if (event.state === 'DISCONNECTED') {
                        isRtmLoggedIn.value = false;
                    }
                });
                rtmClient.addEventListener("tokenPrivilegeWillExpire", async () => {
                    await userStore.updateRTMToken()
                    await rtmClient?.renewToken(userStore.rtmToken)
                })
            }

            console.log("[RTM] Logging in with UID:", uid);
            await rtmClient.login({ token: token });
            // 同步当前用户 ID 到消息管理器，确保 SessionID 计算的一致性
            getMessageManager().setCurrentUserId(uid);
            isRtmLoggedIn.value = true;
            console.log("[RTM] Login Success");
        } catch (error) {
            console.error("[RTM] Login Failed:", error);
            throw error;
        }
    };




    /**
     * Logout RTM
     */
    const logoutRTM = async () => {
        if (!rtmClient) return;
        try {
            await rtmClient.logout();
            isRtmLoggedIn.value = false;
            console.log("[RTM] Logout Success");
        } catch (error) {
            console.error("[RTM] Logout Failed:", error);
        }
    };

    const normalizeIncomingUser = (user: unknown): IncomingMessageUser | undefined => {
        if (!user || typeof user !== 'object') return undefined;

        const rawUser = user as Record<string, unknown>;
        return {
            ...rawUser,
            UserId: String(rawUser.UserId ?? ''),
            HeadImage: String(rawUser.HeadImage ?? ''),
            Nickname: String(rawUser.Nickname ?? ''),
            Gender: rawUser.Gender === undefined || rawUser.Gender === null ? undefined : String(rawUser.Gender),
            OnlineState: rawUser.OnlineState === undefined || rawUser.OnlineState === null
                ? undefined
                : String(rawUser.OnlineState) as IncomingMessageUser['OnlineState'],
        } as IncomingMessageUser;
    };

    const normalizeIncomingChatMessage = (payload: MOMORtmMessage): LHMessage => {
        if (!payload.message || typeof payload.message !== 'object') {
            throw new Error('[RTM] Invalid ChatMessage payload: missing message object');
        }

        const rawMessage = payload.message as Record<string, unknown>;
        return {
            ...rawMessage,
            messageId: rawMessage.messageId === undefined || rawMessage.messageId === null
                ? ''
                : String(rawMessage.messageId),
            msgType: String(rawMessage.msgType ?? MessageType.Text) as LHMessage['msgType'],
            toUid: rawMessage.toUid === undefined || rawMessage.toUid === null
                ? undefined
                : String(rawMessage.toUid),
            fromUid: rawMessage.fromUid === undefined || rawMessage.fromUid === null
                ? undefined
                : String(rawMessage.fromUid),
            fromUser: normalizeIncomingUser(rawMessage.fromUser),
            toUser: normalizeIncomingUser(rawMessage.toUser),
        } as LHMessage;
    };

    const enqueuePendingChatPacket = (payload: MOMORtmMessage, event: any) => {
        if (pendingChatPackets.length >= MAX_PENDING_CHAT_PACKETS) {
            pendingChatPackets.shift();
            console.warn('[RTM] Pending chat queue is full. Dropping oldest pending message.');
        }

        pendingChatPackets.push({ payload, event });
        console.warn('[RTM] ChatMessage received before DB ready. Queued for retry.', {
            pendingCount: pendingChatPackets.length,
        });

        if (!hasRegisteredDBReadyFlush) {
            hasRegisteredDBReadyFlush = true;
            onDBReady(() => {
                hasRegisteredDBReadyFlush = false;
                void flushPendingChatPackets();
            });
        }
    };

    const flushPendingChatPackets = async () => {
        if (isFlushingPendingChatPackets || !isDBInitialized()) return;

        isFlushingPendingChatPackets = true;
        try {
            while (pendingChatPackets.length > 0 && isDBInitialized()) {
                const packet = pendingChatPackets.shift()!;
                try {
                    await handlerChatMessage(packet.payload, packet.event, true);
                } catch (error) {
                    console.error('[RTM] Failed to process queued ChatMessage.', error);
                }
            }
        } finally {
            isFlushingPendingChatPackets = false;
        }
    };

    const handlerChatMessage = async (payload: MOMORtmMessage, event: any, fromPendingQueue = false) => {
        if (!isDBInitialized()) {
            if (!fromPendingQueue) {
                enqueuePendingChatPacket(payload, event);
            }
            return;
        }

        const message = normalizeIncomingChatMessage(payload);
        message.serverReceivedTs = event.timestamp ? event.timestamp / 1000 : Date.now() / 1000;
        message.isRead = false;
        message.translateState = TranslateState.Noyet;

        let chatType = (payload as any).ChatType || '1';
        const currentRouteName = router.currentRoute.value.name;
        if (chatType === '1' && currentRouteName === 'videoPage') {
            const callStore = useCallStore();
            const currentCallInfo = callStore.currentCallInfo;
            if (currentCallInfo && currentCallInfo.User?.UserId === message.fromUid) {
                chatType = '2';
            }
        }
        message.chatType = chatType;

        const manager = getMessageManager();
        const currentUserId = manager.getCurrentUserId();
        if (!message.fromUid) {
            message.fromUid = (payload as any).FromUserId || (payload as any).UserId;
        }
        if (!currentUserId) {
            console.warn('[RTM] ChatMessage ignored: missing current user id.', message);
            return;
        }
        if (!message.fromUid) {
            console.warn('[RTM] ChatMessage ignored: missing sender id.', message);
            return;
        }
        if (!message.toUid && message.fromUid !== currentUserId) {
            message.toUid = currentUserId;
        }
        if (message.fromUid !== currentUserId && message.toUid !== currentUserId) {
            console.warn('[RTM] ChatMessage ignored: current user is not sender or receiver.', message);
            return;
        }
        if (message.fromUid === currentUserId && (!message.toUid || message.toUid === currentUserId)) {
            console.warn('[RTM] ChatMessage ignored: missing valid receiver id for self-sent message.', message);
            return;
        }

        await manager.processIncomingMessage(message);

        // --- 全局通知触发 ---
        const currentRoute = router.currentRoute.value;
        const currentName = currentRoute.name as string;
        
        // 判定：该通知仅在 TabBar 主页面（首页、匹配、消息、中心）显示
        const tabbarPages = ['anchorList', 'match', 'messageList', 'userCenter', 'mainTabbarView'];
        const isTabbarPage = tabbarPages.includes(currentName);
        
        if (isTabbarPage) {
            notificationService.show(message);
        }
    }

    const handlerCalling = async (payload: MOMORtmMessage, event: any) => {
        const call = payload.data as CallInfoModel
        console.log("[RTM] << [handlerCalling START] LiveId:", call.LiveId);

        // --- 安全路由校验 ---
        const safeRoutes = ['anchorList', 'mainTabbarView', 'messageList', 'userCenter', 'messageDetail', 'AnchorProfile'];
        const currentRouteName = router.currentRoute.value.name as string;
        
        // 如果当前还在登录、注册或启动流程中，不准强行跳转到通话页
        if (!safeRoutes.includes(currentRouteName)) {
            console.warn("[RTM] << [handlerCalling BLOCKED] App is in critical path (Login/Register/Launch). Route:", currentRouteName);
            return;
        }

        const callStore = useCallStore()
        callStore.setCurrentCallInfo(call)

        // 同步 RTCService 状态
        RTCService.setIncomingCall(call)

        console.log("[RTM] [handlerCalling NEXT] Ready to Jump. Store Info:", callStore.currentCallInfo?.LiveId);

        try {
            await router.push({ name: 'callPage', query: { role: 'callee' } });
            console.log("[RTM] << [handlerCalling SUCCESS] Navigation done.");
        } catch (err) {
            console.error("[RTM] << [handlerCalling ERROR] Navigation Failed:", err);
        }
    }

    const handlerCallEnd = async (payload: MOMORtmMessage, event: any) => {
        console.log("[RTM] << [handlerCallEnd] Received hangup signal.");
        const callStore = useCallStore()
        callStore.setCurrentCallInfo(null)
        // 远端已挂断：我方仅静默清理资源并退出页面，不再重复上报 API
        RTCService.handleRemoteHangup();
    }

    const handleMessageasync = async (event: any) => {
        try {
            const payload: MOMORtmMessage = JSON.parse(event.message);
            console.log("[RTM] >> Raw Packet Received:", payload.type, payload);

            // 1. 聊天类消息
            if (payload.type === 'ChatMessage') {
                await handlerChatMessage(payload, event)
            }

            // 2. 呼叫类消息
            if (payload.type === "Calling") {
                console.log("[RTM] Found 'Calling' type, entering handlerCalling...");
                await handlerCalling(payload, event)
            }

            // 3. 挂断类消息
            if (payload.type === "CallEnd") {
                await handlerCallEnd(payload, event)
            }
        } catch (err) {
            console.error("[RTM] FATAL ERROR parsing message packet", err);
        }
    }

    return {
        loginRTM,
        logoutRTM,
        isRtmLoggedIn,
        rtmClient
    };
}
