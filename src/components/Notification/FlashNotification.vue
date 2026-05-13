<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getFlagEmoji } from '@/utils/tools';

interface NotificationData {
  userId: string;
  nickname: string;
  avatar: string;
  message: string;
  time: string;
}

const props = defineProps<{
  data: NotificationData;
  duration?: number;
}>();

const emit = defineEmits(['close']);
const visible = ref(false);
const router = useRouter();

const handleTap = () => {
  console.log("[FlashNotification] Tapped. Target:", props.data.userId);
  visible.value = false;

  // 1. 立即触发路由跳转
  router.push({
    name: 'messageDetail',
    query: { userId: String(props.data.userId), nickname: props.data.nickname }
  }).then(() => {
    console.log("[FlashNotification] Navigation Success");
  }).catch(err => {
    console.error("[FlashNotification] Navigation Failed:", err);
  });

  // 2. 延时通知父组件清理状态（等待动画结束）
  setTimeout(() => {
    emit('close');
  }, 300);
};

import notificationSound from '@/assets/msgNoti.mp3';

onMounted(() => {
  // 提示音加载
  const audio = new Audio(notificationSound);
  audio.play().catch(err => console.warn("[Audio] Notification sound blocked:", err));

  setTimeout(() => {
    visible.value = true;
  }, 50);

  if (props.duration !== 0) {
    setTimeout(() => {
      visible.value = false;
      setTimeout(() => emit('close'), 300);
    }, props.duration || 3000);
  }
});
</script>

<template>
  <Transition name="slide-down">
    <div v-if="visible" class="flash-notification-container" @click.stop="handleTap">
      <div class="banner-content">
        <div class="avatar-wrapper">
          <img :src="data.avatar" alt="avatar" class="avatar-img" />
          <div class="status-dot"></div>
        </div>
        <div class="text-content">
          <div class="header-row">
            <span class="sender-name">{{ data.nickname }}</span>
            <span class="time-text">{{ data.time }}</span>
          </div>
          <p class="message-snippet">{{ data.message }}</p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.flash-notification-container {
  position: fixed;
  top: env(safe-area-inset-top, 20px);
  left: 20px;
  right: 20px;
  /* width 由 left/right 自适应 */
  height: 82px;
  background: linear-gradient(90deg, #fed627 0%, #ff1ad0 100%);
  border-radius: 16px;
  box-shadow: 0px 8px 30px 0px rgba(179, 179, 179, 0.3);
  z-index: 9999;
  padding: 16px;
  box-sizing: border-box;
  cursor: pointer;
  overflow: hidden;
}

.banner-content {
  display: flex;
  align-items: center;
  height: 100%;
  gap: 12px;
}

.avatar-wrapper {
  position: relative;
  width: 50px;
  height: 50px;
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  background: #f0f0f0;
}

.status-dot {
  position: absolute;
  top: 0;
  right: 0;
  width: 12px;
  height: 12px;
  background-color: #4cd964;
  border: 2px solid white;
  border-radius: 50%;
}

.text-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  min-width: 0;
  /* 确保文字溢出生效 */
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sender-name {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-weight: 600;
}

.time-text {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
}

.message-snippet {
  color: white;
  font-size: 14px;
  font-weight: 600;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

/* Transition Animations */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-120%);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-120%);
}
</style>
