import { ref, onUnmounted } from 'vue';
import AgoraRTM from 'agora-rtm-sdk';

// TODO: Replace with your actual App ID and fetch token dynamically
const APP_ID = 'YOUR_APP_ID_HERE'; 

export function useMomoRTM(userId: string) {
    const rtmInfo = ref<{
        client: any | null,
        isLoggedIn: boolean
    }>({
        client: null,
        isLoggedIn: false
    });
    const messages = ref<{publisher: string, content: string, timestamp: number}[]>([]);

    const initRTM = async (token = 'YOUR_RTM_TOKEN_HERE') => {
        try {
            const client = new AgoraRTM.RTM(APP_ID, userId);
            
            // Event Handlers
            client.addEventListener("message", (event: any) => {
                messages.value.push({
                    publisher: event.publisher,
                    content: event.message,
                    timestamp: Date.now()
                });
            });

            client.addEventListener("presence", (event: any) => {
                console.log(`Presence event from ${event.publisher}: ${event.eventType}`);
            });

            client.addEventListener("status", (event: any) => {
                console.log(`RTM connection state changed to: ${event.state}`);
            });
            
            // Login
            await client.login({ token });
            rtmInfo.value.client = client;
            rtmInfo.value.isLoggedIn = true;
            console.log("Logged into RTM successfully");
            
        } catch (err) {
            console.error("Failed to initialize or login to RTM", err);
        }
    };

    const subscribeToChannel = async (channelName: string) => {
        try {
            if (!rtmInfo.value.client) return;
            await rtmInfo.value.client.subscribe(channelName);
            console.log(`Subscribed to RTM channel: ${channelName}`);
        } catch (err) {
            console.error("Failed to subscribe to channel", err);
        }
    };

    const publishMessage = async (channelName: string, text: string) => {
        try {
            if (!rtmInfo.value.client) return;
            const payload = JSON.stringify({ type: "text", message: text });
            await rtmInfo.value.client.publish(channelName, payload, { channelType: 'MESSAGE' });
            
            // Also add to local messages array for UI
            messages.value.push({
                publisher: userId,
                content: payload,
                timestamp: Date.now()
            });
        } catch (err) {
            console.error("Failed to publish message", err);
        }
    };

    const logout = async () => {
        try {
            if (rtmInfo.value.client) {
                await rtmInfo.value.client.logout();
                rtmInfo.value.isLoggedIn = false;
            }
        } catch (err) {
            console.error("Failed to logout of RTM", err);
        }
    };

    onUnmounted(() => {
        logout();
    });

    return {
        rtmInfo,
        messages,
        initRTM,
        subscribeToChannel,
        publishMessage,
        logout
    };
}
