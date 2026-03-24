<script setup lang="ts">

import msgReport from '@/assets/message/msg-report.svg'
import msgTranslateOff from '@/assets/message/msg-translate-off.svg'
import msgTranslateOn from '@/assets/message/msg-translate-on.svg'
import back from "@/assets/comm/comm-back.png"
import { MessageModel, MessageType, mockData } from '@/utils/msg/MessageModel';
import ChatTextMessageView from './messageCells/ChatTextMessageView.vue';
import ChatImageMessageView from './messageCells/ChatImageMessageView.vue';
import ChatTimeMessageView from './messageCells/ChatTimeMessageView.vue';
import ChatBottomMissionView, { type MissionData } from './messageOtherViews/ChatBottomMissionView.vue';
import videoGift from '@/assets/call/video-gift.png';
import { MissionType } from '@/utils/Enums/Enums';
import { reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();

const msgList: MessageModel[] = mockData

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
    completed: false,
  },
  giftMission: {
    completed: false,
    giftIcon: videoGift,
    giftPrice: '20',
  },
  clickMission: clickedMission
})

const goBack = () => {
  router.back()
}

</script>

<template>
  <!-- 核心：用外层容器包裹所有元素，通过flex布局分配空间 -->
  <div class="detailPage">
    <header class="detailHeader">
      <div class="naviContent">
        <img class="backButton" :src="back" alt="" @click="goBack">
        <div class="naviTitle">Alice & Bob</div>
        <img class="naviReport" :src="msgReport" alt="">
      </div>
    </header>
    <div class="detailContent">
      <div class="msgList">
        <template v-for="msg in msgList" :key="msg.id + msg.timeMessage?.getTime()">
          <ChatTextMessageView v-if="msg.msgType === MessageType.Text" :msg="msg" />
          <ChatImageMessageView v-else-if="msg.msgType === MessageType.Image" :msg="msg" />
          <ChatTimeMessageView v-else-if="msg.msgType === MessageType.Time" :msg="msg" />
        </template>
      </div>
    </div>

    <footer class="detailFooter">

      <div class="sendImg">
        <img src="@/assets/message/msg-send-img.svg" alt="">
      </div>
      <input type="text" placeholder="message..." class="messageTextView">
      <div class="giftButton">
        <img src="@/assets/call/video-gift.png" alt="">
      </div>
      <div class="callButton">
        <img src="@/assets/call/callButton.png" alt="">
      </div>
      <ChatBottomMissionView class="bottomMissionView" :missionData="missionData">
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

.messageTextView {
  height: 40px;
  border: none;
  background-color: #fff;
  border-radius: 20px;
  padding: 12px;
  flex: 1;
  /* 自动占满剩余空间 */
  width: 0;
  /* 关键！解决挤压问题 */
  min-width: 0;
  /* 关键！禁止超出父容器 */
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