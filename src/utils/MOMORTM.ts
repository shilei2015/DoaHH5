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

// Singleton client instance
let rtmClient: RTMClient | null = null;
const isRtmLoggedIn = ref(false);

const APP_ID = NET_CONFIG.SWID;

interface MOMORtmMessage {
    type: string
    message?: Object
    data?: Object
}

export function useMomoRTM() {
    const userStore = useUserStore();

    /**
     * Initialize and Login RTM
     */
    const loginRTM = async (uid: string, token: string) => {
        if (rtmClient && isRtmLoggedIn.value) return;

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

    const handleMessageasync = async (event: any) => {

        try {
            // Assuming payload structure follows previous implementation
            const payload: MOMORtmMessage = JSON.parse(event.message);
            console.log("[RTM] Received Message:", payload);
            if (payload.type === 'ChatMessage' || payload.type !== undefined) {
                handlerChatMessage(payload, event)
            }
            if (payload.type === "Calling") {
                handlerCalling(payload, event)
            }
            if (payload.type === "CallEnd") {
                handlerCallEnd(payload, event)
            }
        } catch (err) {
            console.error("[RTM] Failed to parse and store incoming message", err);
        }
    }

    const handlerChatMessage = async (payload: MOMORtmMessage, event: any) => {
        // Unified handling: if nested 'message' exists (Swift logic) use it, else use payload directly
        const message: LHMessage = payload.message as LHMessage
        message.serverReceivedTs = event.timestamp / 1000
        message.isRead = false
        message.translateState = TranslateState.Noyet
        console.log("[RTM] Covert to Message:", message);
        const manager = getMessageManager();
        await manager.processIncomingMessage(message);
    }

    const handlerCalling = async (payload: MOMORtmMessage, event: any) => {
        const call = payload.data as CallInfoModel
        const callStore = useCallStore()
        callStore.setCurrentCallInfo(call)
        RTCService.setIncomingCall(call)
        router.push({ name: 'callPage', query: { role: 'callee' } })
    }

    const handlerCallEnd = async (payload: MOMORtmMessage, event: any) => {
        const call = payload.data as CallInfoModel
        const callStore = useCallStore()
        callStore.setCurrentCallInfo(null)
    }

    return {
        loginRTM,
        logoutRTM,
        isRtmLoggedIn,
        rtmClient
    };
}
