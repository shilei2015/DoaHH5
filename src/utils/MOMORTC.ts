import { ref, onUnmounted } from 'vue';
import AgoraRTC from 'agora-rtc-sdk-ng';
import type { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack, IRemoteAudioTrack, IRemoteVideoTrack, IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';

// TODO: Replace with your actual App ID and optionally fetch tokens dynamically
const APP_ID = 'YOUR_APP_ID_HERE'; 
const TOKEN = null; // Use null if testing without App Certificate

export function useMomoRTC() {
    const client = ref<IAgoraRTCClient | null>(null);
    const localAudioTrack = ref<IMicrophoneAudioTrack | null>(null);
    const localVideoTrack = ref<ICameraVideoTrack | null>(null);
    const remoteUsers = ref<IAgoraRTCRemoteUser[]>([]);

    const initRTC = () => {
        client.value = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        
        client.value.on("user-published", async (user, mediaType) => {
            await client.value?.subscribe(user, mediaType);
            
            if (mediaType === "video") {
                const existingUserIndex = remoteUsers.value.findIndex(u => u.uid === user.uid);
                if (existingUserIndex === -1) {
                    remoteUsers.value.push(user);
                } else {
                    remoteUsers.value[existingUserIndex] = user;
                }
            }
            if (mediaType === "audio") {
                user.audioTrack?.play();
            }
        });

        client.value.on("user-unpublished", (user, mediaType) => {
            if (mediaType === 'video') {
                const index = remoteUsers.value.findIndex(u => u.uid === user.uid);
                if (index > -1) {
                    remoteUsers.value.splice(index, 1);
                }
            }
        });
        
        client.value.on("user-left", (user) => {
            const index = remoteUsers.value.findIndex(u => u.uid === user.uid);
            if (index > -1) {
                remoteUsers.value.splice(index, 1);
            }
        });
    };

    const joinChannel = async (channelName: string, uid: string | number) => {
        if (!client.value) initRTC();
        try {
            await client.value!.join(APP_ID, channelName, TOKEN, uid);
            localAudioTrack.value = await AgoraRTC.createMicrophoneAudioTrack();
            localVideoTrack.value = await AgoraRTC.createCameraVideoTrack();
            const tracks = [localAudioTrack.value, localVideoTrack.value].filter(Boolean) as (IMicrophoneAudioTrack | ICameraVideoTrack)[];
            if (tracks.length > 0) {
                await client.value!.publish(tracks);
            }
            console.log("Joined RTC channel successfully");
        } catch (error) {
            console.error("Failed to join RTC channel", error);
        }
    };

    const leaveChannel = async () => {
        localAudioTrack.value?.close();
        localVideoTrack.value?.close();
        localAudioTrack.value = null;
        localVideoTrack.value = null;
        remoteUsers.value = [];
        if (client.value) {
            await client.value.leave();
        }
    };

    onUnmounted(() => {
        leaveChannel();
    });

    return {
        client,
        localVideoTrack,
        localAudioTrack,
        remoteUsers,
        joinChannel,
        leaveChannel
    };
}

// Retained for backward compatibility with AnchorProfile.vue
export function callAnchor(userId: string) {
    import('@/router').then(({ default: router }) => {
        router.push({ path: '/call', query: { id: userId } })
    })
}
