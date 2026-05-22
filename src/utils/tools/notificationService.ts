import { reactive } from 'vue';
import type { LHMessage } from '@/utils/msg/MessageModel';
import { normalizeImageCdnUrl } from '@/utils/imageFallback';

interface NotificationData {
  userId: string;
  nickname: string;
  avatar: string;
  message: string;
  time: string;
}

const state = reactive({
  data: null as NotificationData | null,
  visible: false,
});

/**
 * Global Notification Service
 */
export const notificationService = {
  state,

  /**
   * Show a temporary notification banner
   */
  show(message: LHMessage) {
    if (this.state.visible) return; // Basic rate limiting

    this.state.data = {
      userId: message.fromUid || '',
      nickname: message.fromUser?.Nickname || 'Someone',
      avatar: normalizeImageCdnUrl(message.fromUser?.HeadImage),
      message: message.textMessage || '[New Message]',
      time: 'Just Now',
    };
    this.state.visible = true;
  },

  /**
   * Force close the notification
   */
  hide() {
    this.state.visible = false;
    this.state.data = null;
  }
};
