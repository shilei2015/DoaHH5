<script setup lang="ts">
import { computed } from 'vue';
import { MessageSendStatus, type LHMessage } from '@/utils/msg/MessageModel';
import { useUserStore } from '@/stores/userStore';
import AnimationPlayer from '@/components/common/AnimationPlayer.vue';

/**
 * ChatGifMessageView.vue
 * 专门用于在聊天列表中渲染 GIF 或 SVGA 动效礼物的消息单元格
 */

const props = defineProps<{
    msg: LHMessage;
}>();

const userStore = useUserStore();
const isMe = computed(() => props.msg.fromUid === userStore.userInfo?.UserId);

const emit = defineEmits<{
    (e: 'clickSendFaild', msg: LHMessage): void
}>()

const gifUrl = computed(() => props.msg.imageObj?.urlString ?? '');
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
            <div class="gifBubble">
                <AnimationPlayer 
                    v-if="gifUrl"
                    :src="gifUrl" 
                    :loop="true" 
                    class="sharedGif" 
                />
            </div>
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
    background-color: #eee;
}

.messageContainer {
    display: flex;
    flex-direction: row;
    max-width: 100%;
    margin: 0 10px;
}

.me .messageContainer {
    align-items: flex-end;
}

.gifBubble {
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    background-color: transparent;
    width: 100px;
    height: 100px;
}

.sharedGif {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.other .gifBubble {
    border-bottom-left-radius: 0px;
}

.me .gifBubble {
    border-bottom-right-radius: 0px;
}

.sendFaildView {
    width: 16px;
    height: 16px;
    position: relative;
    bottom: 4px;
    right: 10px;
}
</style>
