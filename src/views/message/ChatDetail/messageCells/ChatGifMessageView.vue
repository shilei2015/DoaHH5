<script setup lang="ts">
import { ref, computed } from 'vue';
import { MessageSendStatus, type LHMessage } from '@/utils/msg/MessageModel';
import { useUserStore } from '@/stores/userStore';
import AnimationPlayer from '@/components/common/AnimationPlayer.vue';

/**
 * ChatGifMessageView.vue
 * 专门用于在聊天列表中渲染 GIF 或 SVGA 动效礼物的消息单元格
 * 样式与 ChatImageMessageView 保持高度一致
 */

const props = defineProps<{
    msg: LHMessage;
}>();

const userStore = useUserStore();
const isMe = computed(() => props.msg.fromUid === userStore.userInfo?.UserId);
const currentUserAvatar = computed(() => userStore.userInfo?.HeadImage ?? '');
const isImageLoading = ref(true);

const emit = defineEmits<{
    (e: 'clickSendFaild', msg: LHMessage): void
}>()

const gifUrl = computed(() => props.msg.imageObj?.urlString ?? '');

const onGifLoad = () => {
    isImageLoading.value = false;
}
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
            <div class="imageBubble">
                <!-- 直接展示 SVGA 动画，不再等待加载事件 -->
                <AnimationPlayer v-if="gifUrl" :src="gifUrl" :loop="true" class="sharedImage" />
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
    width: 120px;
    height: 160px;
}

.loadingOverlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1;
}

.sharedImage {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    transition: opacity 0.3s ease;
    background-color: #292929;
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
