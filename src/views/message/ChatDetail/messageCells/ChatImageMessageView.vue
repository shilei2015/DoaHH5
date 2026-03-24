<script setup lang="ts">
import { computed } from 'vue';
import type { MessageModel } from '@/utils/msg/MessageModel';

const props = defineProps<{
    msg: MessageModel;
}>();

const isMe = computed(() => props.msg.id === '1');
</script>

<template>
    <div :class="['contentView', isMe ? 'me' : 'other']">
        <div v-if="!isMe" class="userAvatar">
            <img :src="msg.avatar" alt="" class="avatarImg">
        </div>
        <div class="messageContainer">
            <div class="imageBubble">
                <img :src="msg.imageMessage" alt="Shared Image" class="sharedImage">
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
    flex-direction: column;
    max-width: 70%;
    margin: 0 10px;
}

.me .messageContainer {
    align-items: flex-end;
}

.imageBubble {
    border-radius: 16px;
    overflow: hidden;
    background-color: #f0f0f0;
    line-height: 0;
}

.sharedImage {
    width: 120px;
    height: 160px;
    display: block;
    object-fit: cover;
}

.other .imageBubble {
    border-bottom-left-radius: 0px;
}

.me .imageBubble {
    border-bottom-right-radius: 0px;
}
</style>