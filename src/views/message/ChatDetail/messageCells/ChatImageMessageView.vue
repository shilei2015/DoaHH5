<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { MessageSendStatus, type LHMessage } from '@/utils/msg/MessageModel';
import { useUserStore } from '@/stores/userStore';

const props = defineProps<{
    msg: LHMessage;
}>();

const userStore = useUserStore();
const isMe = computed(() => props.msg.fromUid === userStore.userInfo?.UserId);
const currentUserAvatar = computed(() => userStore.userInfo?.HeadImage ?? '');

const emit = defineEmits<{
    (e: 'clickSendFaild', msg: LHMessage): void,
    (e: 'clickImage', msg: LHMessage): void
}>()

// --- Image URL Handling ---
const objectUrl = ref<string>('');
const isImageLoading = ref(true);

const displayUrl = computed(() => {
    if (props.msg.localBlob) {
        // Create object URL for local blob if it doesn't already exist
        if (!objectUrl.value) {
            objectUrl.value = URL.createObjectURL(props.msg.localBlob);
        }
        return objectUrl.value;
    }
    return props.msg.imageObj?.urlString ?? '';
});

const onImageLoad = () => {
    isImageLoading.value = false;
}

onUnmounted(() => {
    if (objectUrl.value) {
        URL.revokeObjectURL(objectUrl.value);
    }
});
</script>

<template>
    <div :class="['contentView', isMe ? 'me' : 'other']">
        <div v-if="!isMe" class="userAvatar">
            <img :src="msg.fromUser?.HeadImage ?? ''" alt="" class="avatarImg">
        </div>
        <div class="messageContainer">
            <div v-if="msg.sendStatus == MessageSendStatus.Failed && isMe" class="sendFaildView"
                @click="emit('clickSendFaild', props.msg)">
                <img src="@/assets/message/msg-send-fail.svg" alt="">
            </div>
            <div class="imageBubble" @click="emit('clickImage', props.msg)">
                <!-- Loading Spinner -->
                <div v-if="isImageLoading && displayUrl" class="loadingOverlay">
                    <van-loading type="spinner" size="24px" color="#FF1AD0" />
                </div>
                <!-- Actual Image -->
                <img v-if="displayUrl" :src="displayUrl" @load="onImageLoad"
                    :style="{ opacity: isImageLoading ? 0 : 1 }" class="sharedImage">
            </div>
        </div>
        <div v-if="isMe" class="userAvatar meAvatar">
            <img :src="currentUserAvatar" alt="" class="avatarImg">
        </div>
    </div>
</template>

<style scoped>
.contentView {
    display: flex;
    padding: 0px 20px 20px 20px;
    width: 100%;
    box-sizing: border-box;
    align-items: flex-end;
}

.contentView.me {
    justify-content: flex-end;
}

.userAvatar {
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    position: relative;
    bottom: 4px;
}

.avatarImg {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    background-color: #292929;
}

.messageContainer {
    display: flex;
    flex-direction: row;
    max-width: calc(100% - 48px);
    margin: 0 10px;
}

.me .messageContainer {
    align-items: flex-end;
}

.imageBubble {
    position: relative;
    border-radius: 16px;
    overflow: hidden;
    background-color: #292929;
    line-height: 0;
    min-width: 120px;
    min-height: 160px;
}

.loadingOverlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1;
}

.sharedImage {
    width: 120px;
    height: 160px;
    display: block;
    object-fit: cover;
    transition: opacity 0.3s ease;
}

.sendFaildView {
    width: 22px;
    height: 22px;
    position: relative;
    bottom: 4px;
    right: 10px;
}

.sendFaildView img {
    width: 100%;
    height: 100%;
}
</style>
