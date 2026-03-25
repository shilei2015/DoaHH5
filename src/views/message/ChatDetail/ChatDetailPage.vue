<script setup lang="ts">

import msgReport from '@/assets/message/msg-report.svg'
import msgTranslateOff from '@/assets/message/msg-translate-off.svg'
import msgTranslateOn from '@/assets/message/msg-translate-on.svg'
import back from "@/assets/comm/comm-back.png"
import { generateSessionId, MessageType, MessageSendStatus, type LHMessage } from '@/utils/msg/MessageModel';
import { getMessageManager } from '@/utils/msg/MessageManager';
import { getChatRecordManager } from '@/utils/msg/ChatRecordManager';
import { useMomoRTM } from '@/utils/MOMORTM';
import { useUserStore } from '@/stores/userStore';
import ChatTextMessageView from './messageCells/ChatTextMessageView.vue';
import ChatImageMessageView from './messageCells/ChatImageMessageView.vue';
import ChatTimeMessageView from './messageCells/ChatTimeMessageView.vue';
import ChatGifMessageView from './messageCells/ChatGifMessageView.vue';
import ChatBottomMissionView, { type MissionData } from './messageOtherViews/ChatBottomMissionView.vue';
import videoGift from '@/assets/call/video-gift.png';
import { MissionType } from '@/utils/Enums/Enums';
import { ref, reactive, onMounted, onUnmounted, nextTick, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showToast } from 'vant';
import MOMORTC from '@/utils/MOMORTC';
import { getChatTask, upsertChatTask } from '@/utils/msg/DBService';
import { post } from '@/utils/net/request';
import { API } from '@/utils/net/api';
import type { ChatGiftModel } from '@/utils/msg/ChatGiftModel';
import ChatGiftPicker from './messageOtherViews/ChatGiftPicker.vue';
import { showModal } from '@/utils/tools/modalService';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const rtmService = useMomoRTM();
const messageManager = getMessageManager();
const chatManager = getChatRecordManager();

const giftList = ref<ChatGiftModel[]>([]);
const userCoins = computed(() => userStore.userInfo?.Coins ?? 0);
const msgList = ref<LHMessage[]>([]);
const inputText = ref('');
const msgListContainer = ref<HTMLElement | null>(null);
const partnerName = ref('Chat');
const partnerAvatar = ref('');

const targetUserId = ref<string>(route.query.userId as string || '888');
const currentSessionId = computed(() => {
  return generateSessionId(targetUserId.value, userStore.userInfo?.UserId || '1')
})

const clickedMission = (type: MissionType) => {
  console.log(type)
  if (type === MissionType.hello) {
    missionData.helloMission.completed = true
  } else if (type === MissionType.gift) {
    missionData.giftMission.completed = true
  }
}

const missionData = reactive<MissionData>({
  helloMission: {
    completed: true,
  },
  giftMission: {
    completed: true,
    show: false,
    giftIcon: '',
    giftPrice: '',
  }
})

const goBack = () => {
  router.back()
}

const scrollToBottom = () => {
  nextTick(() => {
    if (msgListContainer.value) {
      msgListContainer.value.scrollTop = msgListContainer.value.scrollHeight;
    }
  });
}

const handleReceivedMessage = (message: LHMessage) => {
  msgList.value.push(message);
  scrollToBottom();
}

const handleSendFaildMessage = (message: LHMessage, extra?: any) => {
  console.log(`[ChatDetailPage] sendFail event received for ${message.messageId}`, extra);
  if (extra && extra.toast) {
    showToast(extra.toast);
  }
  const index = msgList.value.findIndex(m => m.messageId === message.messageId);
  console.log(`[ChatDetailPage] find index: ${index}`);
  if (index !== -1) {
    msgList.value[index] = { ...msgList.value[index], sendStatus: MessageSendStatus.Failed } as LHMessage;
  }
}

const handleSendSuccessMessage = (message: LHMessage) => {
  console.log(`[ChatDetailPage] sendSuccess event received for ${message.messageId}`);
  const index = msgList.value.findIndex(m => m.messageId === message.messageId);
  if (index !== -1) {
    msgList.value[index] = { ...msgList.value[index], sendStatus: MessageSendStatus.Success } as LHMessage;
  }
}

const handleWillSaveMessage = (message: LHMessage) => {
  message.isRead = true
}

const loadHistory = async () => {
  const history = await messageManager.loadMessages(currentSessionId.value, undefined, 50);
  msgList.value = history;
  scrollToBottom();
}

/**
 * Returns true if a time tag should be shown before the message at index.
 * Logic: Always show for the first message, or if gap > 3 minutes (180s).
 */
const shouldShowTimeTag = (index: number) => {
  if (index === 0) return true;
  const currentMsg = msgList.value[index];
  const prevMsg = msgList.value[index - 1];
  if (!currentMsg || !prevMsg) return false;
  // 3 minutes threshold (180 seconds)
  return (currentMsg.serverReceivedTs - prevMsg.serverReceivedTs) > 180;
}

const loadMissions = async () => {
  const task = await getChatTask(currentSessionId.value);
  missionData.helloMission.completed = task.helloCompleted;
  missionData.giftMission.completed = task.giftCompleted;
}

const onClickMission = async (type: MissionType) => {
  if (type === MissionType.hello) {
    if (missionData.helloMission.completed) return;
    missionData.helloMission.completed = true;
    inputText.value = "hello";
    await onSendText();
  } else if (type === MissionType.gift) {
    if (missionData.giftMission.completed) return;
    missionData.giftMission.completed = true;
    // showToast("Gift mission completed!");
  }

  // Persistent save to DB
  await upsertChatTask({
    chatId: currentSessionId.value,
    helloCompleted: missionData.helloMission.completed,
    giftCompleted: missionData.giftMission.completed
  });
}

const onSendGift = async (gift: ChatGiftModel) => {
  if (Number(userCoins.value) < Number(gift.Coins)) {
    showToast("Insufficient diamonds");
    return;
  }

  const msg = messageManager.newGifMessage(
    gift.GiftId,
    gift.Gif,
    targetUserId.value,
    userStore.userInfo?.UserId || '',
    userStore.userInfo || undefined,
    { Nickname: partnerName.value, HeadImage: partnerAvatar.value, UserId: targetUserId.value } as any
  );

  msgList.value.push(msg);
  scrollToBottom();

  await messageManager.sendMessage(msg);
}

const openGiftPicker = () => {
  showModal(ChatGiftPicker, {
    coins: userCoins.value,
    onSend: onSendGift,
    onRecharge: () => router.push('/recharge')
  });
}

const onResendMessage = async (message: LHMessage) => {
  console.log(`[ChatDetailPage] Resending message: ${message.messageId}`);
  const index = msgList.value.findIndex(m => m.messageId === message.messageId);
  if (index !== -1) {
    msgList.value[index] = { ...msgList.value[index], sendStatus: MessageSendStatus.Sending } as LHMessage;
  }
  try {
    await messageManager.sendMessage(message);
  } catch (err) {
    console.error("Resend failed:", err);
  }
}

const onSendText = async () => {
  if (!inputText.value.trim()) return;

  const fromUid = userStore.userInfo?.UserId || '1';
  const targetUid = targetUserId.value;

  const msg = messageManager.newTextMessage(inputText.value, targetUid, fromUid);
  inputText.value = '';

  await messageManager.messagePlant(msg, true);

  try {
    await messageManager.sendMessage(msg);
  } catch (err) {
    console.error("Send failed:", err);
  }
}

// --- Image Sending Logic ---
const fileInput = ref<HTMLInputElement | null>(null);

const onImageClick = () => {
  fileInput.value?.click();
}

const onFileChange = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const fromUid = userStore.userInfo?.UserId || '1';
  const targetUid = targetUserId.value;

  // 1. Create message with local blob (no URL yet)
  const msg = messageManager.newImageMessage(
    '', // No URL yet
    targetUid,
    fromUid,
    undefined,
    undefined,
    file,
    file.name.split('.').pop() || 'jpg'
  );

  // 2. Plant in UI/DB (will show as "sending")
  await messageManager.messagePlant(msg, true);

  // 3. Reset input
  target.value = '';

  // 4. Send (will handle upload internally via OSSUploadService)
  try {
    await messageManager.sendMessage(msg);
  } catch (err) {
    console.error("Image send failed:", err);
  }
}

const callAnchor = () => {
  MOMORTC.startAnchorCall(targetUserId.value)
}

const helloGift = ref<ChatGiftModel | null>(null)

const giftSayHello = async () => {
  const res = await post(API.hello_gif)
  if (res.code == "0" && res.data.Gift) {
    helloGift.value = res.data.Gift
    missionData.giftMission.giftIcon = res.data.Gift.Image
    missionData.giftMission.giftPrice = res.data.Gift.Coins
    missionData.giftMission.show = true
  }
}
onMounted(async () => {
  if (userStore.userInfo?.UserId) {
    messageManager.setCurrentUserId(userStore.userInfo.UserId);
  }

  const chatUser = await userStore.getUserInfoById(targetUserId.value)
  if (chatUser) {
    partnerName.value = chatUser.Nickname
  }


  messageManager.on(currentSessionId.value, "willSave", handleWillSaveMessage)
  messageManager.on(currentSessionId.value, 'received', handleReceivedMessage);
  messageManager.on(currentSessionId.value, "sendFail", handleSendFaildMessage)
  messageManager.on(currentSessionId.value, "sendSuccess", handleSendSuccessMessage)
  await loadMissions();
  await loadHistory();
  await giftSayHello();
})

onUnmounted(() => {
  messageManager.off(currentSessionId.value, 'received', handleReceivedMessage);
  messageManager.off(currentSessionId.value, "willSave", handleWillSaveMessage)
  messageManager.off(currentSessionId.value, "sendFail", handleSendFaildMessage)
  messageManager.off(currentSessionId.value, "sendSuccess", handleSendSuccessMessage)
})

</script>

<template>
  <div class="detailPage">
    <header class="detailHeader">
      <div class="naviContent">
        <img class="backButton" :src="back" alt="" @click="goBack">
        <div class="naviTitle">{{ partnerName }}</div>
        <img class="naviReport" :src="msgReport" alt="">
      </div>
    </header>
    <div class="detailContent">
      <div class="msgList" ref="msgListContainer">
        <div v-for="(msg, index) in msgList" :key="msg.messageId">
          <!-- Dynamic Time Tag -->
          <ChatTimeMessageView v-if="shouldShowTimeTag(index)" :timestamp="msg.serverReceivedTs" />

          <!-- User Messages -->
          <ChatTextMessageView v-if="msg.msgType === MessageType.Text" :msg="msg" @clickSendFaild="onResendMessage" />
          <ChatImageMessageView v-else-if="msg.msgType === MessageType.Image" :msg="msg"
            @clickSendFaild="onResendMessage" />
          <ChatGifMessageView v-else-if="msg.msgType === MessageType.Animation" :msg="msg"
            @clickSendFaild="onResendMessage" />
        </div>
      </div>
    </div>

    <footer class="detailFooter">
      <input type="file" ref="fileInput" @change="onFileChange" accept="image/*" hidden />
      <div class="sendImg" @click="onImageClick">
        <img src="@/assets/message/msg-send-img.svg" alt="">
      </div>
      <form action="javascript:void(0)" class="messageForm" @submit.prevent="onSendText">
        <input type="text" placeholder="message..." class="messageTextView" v-model="inputText" enterkeyhint="send">
      </form>
      <div class="giftButton" @click="openGiftPicker">
        <img src="@/assets/call/video-gift.png" alt="">
      </div>
      <div class="callButton" @click="callAnchor">
        <img src="@/assets/call/callButton.png" alt="">
      </div>
      <ChatBottomMissionView class="bottomMissionView" :missionData="missionData" @clickMission="onClickMission">
      </ChatBottomMissionView>
    </footer>
  </div>
</template>

<style scoped>
/* 1. 外层容器：占满视口高度，垂直flex布局 */
.detailPage {
  background-color: #fff;
  width: 100%;
  height: 100vh;
  /* Changed from min-height: 100vh to force fixed height */
  overflow: hidden;
  /* Prevent the entire page from scrolling */
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* 2. 头部：高度包含安全区域，不伸缩 */
.detailHeader {
  background-color: #fff;
  height: calc(env(safe-area-inset-top) + 44px);
  /* 固定头部高度，不参与flex伸缩 */
  flex-shrink: 0;
}

/* 3. 内容区域：核心！填充header和footer之间的所有空间 */
.detailContent {
  /* padding-top: 12px; */
  flex: 1;
  position: relative;
  width: 100%;
  overflow: hidden;
  /* Move the scrolling responsibility to msgList */
  box-sizing: border-box;
  display: flex;
  background-color: rgba(0, 0, 0, 0.0);
}

/* 4. 底部：固定高度，不伸缩，适配安全区域 */
.detailFooter {
  position: relative;
  background-color: #F2F1F4;
  height: 88px;
  width: 100%;
  /* 固定底部，不参与flex伸缩 */
  flex-shrink: 0;
  /* 适配底部安全区域（替代你原来的bottom: env(...)） */
  padding-bottom: env(safe-area-inset-bottom);
  /* 修正高度：包含安全区域 */
  height: calc(64px + env(safe-area-inset-bottom));
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding-left: 20px;
  padding-right: 20px;
  gap: 12px;
}

.naviContent {
  position: relative;
  top: env(safe-area-inset-top);
  left: 0px;
  right: 0px;
  bottom: 0px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.backButton {
  position: relative;
  width: 28px;
  height: 28px;
  margin-left: 16px;
}

.naviReport {
  width: 28px;
  height: 28px;
  margin-right: 16px;
}

.naviTitle {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #1A1A1A;
}

.msgList {
  flex: 1;
  background-color: #F2F1F4;
  border-radius: 24px 24px 0px 0px;
  overflow-y: auto;
  /* Enable inner scrolling for messages */
  padding-bottom: 12px;
  padding-top: 20px;
}

.callButton {
  width: 48px;
  height: 48px;
}

.callButton img {
  width: 100%;
  height: 100%;
}

.sendImg {
  width: 40px;
  height: 40px;
}

.sendImg img {
  width: 100%;
  height: 100%;
}

.messageForm {
  flex: 1;
  display: flex;
  min-width: 0;
}

.messageTextView {
  height: 40px;
  border: none;
  background-color: #fff;
  border-radius: 20px;
  padding: 12px;
  flex: 1;
  /* 自动占满剩余空间 */
  width: 100%;
}

:deep(.inputBox::placeholder) {
  color: #c0c0c0;
  /* 浅灰色 */
  font-size: 14px;
  opacity: 1;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  font-weight: 510;
  /* 修复iOS变灰 */
}

.giftButton {
  width: 40px;
  height: 40px;
  background-color: #fff;
  border-radius: 50%;
  display: flex;
  /* 开启弹性布局 */
  justify-content: center;
  /* 水平居中 */
  align-items: center;
  /* 垂直居中 */
}

.giftButton img {
  width: 25px;
  height: 25px;
}

.bottomMissionView {
  position: absolute;
  bottom: calc(100% + 16px);
  left: 0px;
  height: 40px;
}
</style>