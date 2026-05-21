<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { MessageSendStatus, TranslateState, type LHMessage } from '@/utils/msg/MessageModel';
import { useUserStore } from '@/stores/userStore';
import { translateText } from '@/utils/tools';

const props = defineProps<{
    msg: LHMessage;
}>();

const msg = computed(() => props.msg);
const userStore = useUserStore();
const isMe = computed(() => props.msg.fromUid === userStore.userInfo?.UserId);
const currentUserAvatar = computed(() => userStore.userInfo?.HeadImage ?? '');
const emit = defineEmits<{
    (e: 'clickSendFaild', msg: LHMessage): void
    (e: 'clickAvatar', msg: LHMessage): void
}>()

const translateMessage = async () => {
    switch (msg.value.translateState) {
        case TranslateState.Noyet:
            msg.value.translateState = TranslateState.Translating
            let result = await translateText(msg.value.textMessage ?? "")
            if (result) {
                msg.value.transLateTextMessage = result
                msg.value.translateState = TranslateState.Translated
            } else {
                msg.value.translateState = TranslateState.Noyet
            }
            break
        case TranslateState.Translating:
            break
        case TranslateState.Translated:
            msg.value.translateState = TranslateState.Noyet
            break
        case undefined:
            break
    }
}

onMounted(() => {
    if (msg.value.translateState == undefined) {
        msg.value.translateState = TranslateState.Noyet
    }
})

watch(() => props.msg.sendStatus, (val) => {
    console.log(`[ChatTextMessageView] status changed for ${props.msg.messageId}: ${val}`);
})

</script>

<template>
    <div :class="['contentView', isMe ? 'me' : 'other']">
        <div v-if="!isMe" class="userAvatar" role="button" tabindex="0" @click="emit('clickAvatar', props.msg)">
            <img :src="msg.fromUser?.HeadImage ?? ''" alt="" class="avatarImg">
        </div>

        <div class="messageContainer">
            <div v-if="msg.sendStatus == MessageSendStatus.Failed && isMe" class="sendFaildView"
                @click="emit('clickSendFaild', props.msg)">
                <img src="@/assets/msg-send-fail.svg" alt="">
            </div>
            <div class="bubbleView">
                <div class="messageText">
                    {{ msg.textMessage }}
                </div>
                <div v-if="msg.translateState != TranslateState.Noyet" class="translateContianer">
                    <div class="line"></div>
                    <van-loading class="translateingLoading" v-if="msg.translateState == TranslateState.Translating" />
                    <div v-else class="translateMessageText">{{ msg.transLateTextMessage }}</div>
                </div>
            </div>
            <!-- Future placeholders for translate/status -->

            <div v-if="!isMe" class="translateView" @click="translateMessage">
                <img v-if="msg.translateState != TranslateState.Noyet" src="@/assets/msg-translate-on.svg"
                    alt="" class="translateIcon">
                <img v-else src="@/assets/msg-translate-off.svg" alt="" class="translateIcon">
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
    /* bottom: 4px; */
    cursor: pointer;
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
    align-items: flex-end;
    max-width: calc(100% - 48px);
    margin: 0 10px;
}

.me .messageContainer {
    align-items: flex-end;
}

.bubbleView {
    padding: 8px 12px;
    border-radius: 16px;
    position: relative;
    word-break: break-word;
    max-width: 230px;
}

/* Styles for others (Left) */
.other .bubbleView {
    background-color: #292929;
    color: #fff;
    align-items: flex-end;
}

/* Styles for me (Right) */
.me .bubbleView {
    background: #58D339;
    color: #060000;
    align-items: flex-start;
}

.messageText {
    font-size: 15px;
    font-weight: 510;
    line-height: 24px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
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

.translateView img {
    position: relative;
    left: 10px;
    width: 20px;
    height: 20px;
}

.translateContianer {
    padding: 8px 0px 0px 0px;
}

.translateContianer .line {
    width: 100%;
    height: 1px;
    background-color: rgba(255, 255, 255, 0.05);
    margin-bottom: 8px;
}

.translateMessageText {
    font-size: 14px;
    font-weight: 510;
    line-height: 22px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.translateingLoading {
    width: 16px;
    height: 16px;
}
</style>
