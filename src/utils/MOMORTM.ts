import AgoraRTM from 'agora-rtm-sdk';
import { ref } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { NET_CONFIG } from './net/config';

// Singleton client instance
let rtmClient: any = null;
const isRtmLoggedIn = ref(false);

const APP_ID = NET_CONFIG.SWID;

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
                rtmClient.addEventListener('message', (event: any) => {
                    console.log("[RTM] Received Message:", event.message);
                });

                rtmClient.addEventListener('status', (event: any) => {
                    console.log("[RTM] Connection Status Changed:", event.state, event.reason);
                    if (event.state === 'CONNECTED') {
                        isRtmLoggedIn.value = true;
                    } else if (event.state === 'DISCONNECTED') {
                        isRtmLoggedIn.value = false;
                    }
                });
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

    /**
     * Send P2P Message
     */
    const sendP2PMessage = async (toUserId: string, message: string) => {
        if (!rtmClient || !isRtmLoggedIn.value) {
            console.warn("[RTM] Not logged in, cannot send message");
            return;
        }
        try {
            const publishOptions = { channelType: 'USER' };
            await rtmClient.publish(toUserId, message, publishOptions);
            console.log("[RTM] Message sent to:", toUserId);
        } catch (error) {
            console.error("[RTM] Send failure:", error);
        }
    };

    return {
        loginRTM,
        logoutRTM,
        sendP2PMessage,
        isRtmLoggedIn,
        rtmClient
    };
}
