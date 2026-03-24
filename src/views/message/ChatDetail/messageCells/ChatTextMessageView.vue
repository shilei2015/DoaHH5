<script setup lang="ts">
import { computed } from 'vue';
import type { MessageModel } from '@/utils/msg/MessageModel';

const props = defineProps<{
    msg: MessageModel;
}>();

// Assuming ID "1" is the current user (Alice) and all others are the conversation partner.
const isMe = computed(() => props.msg.id === '1');
</script>

<template>
    <div :class="['contentView', isMe ? 'me' : 'other']">
        <div v-if="!isMe" class="userAvatar">
            <img :src="msg.avatar" alt="" class="avatarImg">
        </div>

        <div class="messageContainer">
            <div class="bubbleView">
                <div class="messageText">
                    {{ msg.textMessage }}
                </div>
            </div>
            <!-- Future placeholders for translate/status -->
            <div class="metaView">
                <div v-if="false" class="translateView"></div>
                <div v-if="false" class="sendFaildView"></div>
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
    background-color: #947474;
}

.messageContainer {
    display: flex;
    flex-direction: column;
    max-width: 75%;
    margin: 0 10px;
}

.me .messageContainer {
    align-items: flex-end;
}

.bubbleView {
    padding: 8px 12px;
    border-radius: 18px;
    position: relative;
    word-break: normal;
}

/* Styles for others (Left) */
.other .bubbleView {
    background-color: #F763A6;
    color: #fff;
    border-bottom-left-radius: 0px;
    align-items: flex-end;
}

/* Styles for me (Right) */
.me .bubbleView {
    background: #fff;
    color: #000;
    border-bottom-right-radius: 0px;
    align-items: flex-start;
}

.messageText {
    font-size: 14px;
    font-weight: 510;
    line-height: 22px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.metaView {
    display: flex;
    margin-top: 4px;
}

.sendFaildView {
    /* Potential error icon styling */
}

.translateView {
    /* Potential translate button styling */
}
</style>