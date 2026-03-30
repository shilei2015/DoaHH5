<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { 
  NavBar as VanNavBar, 
  Button as VanButton,
  Empty as VanEmpty,
  Dialog
} from 'vant';
import HUD from '@/components/HUD';

// Assets
import backIcon from '@/assets/comm/comm-back.png';

const router = useRouter();

// Mock Blacklist Data
const blacklist = ref([
  { id: 1, nickname: 'Annabelle', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&h=100&fit=crop', time: 'Blocked 2 days ago' },
  { id: 2, nickname: 'Jasmine', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=100&h=100&fit=crop', time: 'Blocked 1 week ago' },
  { id: 3, nickname: 'Sophie', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=100&h=100&fit=crop', time: 'Blocked 1 month ago' },
]);

const removeFromBlacklist = (item: any) => {
  Dialog.confirm({
    title: 'Unblock User',
    message: `Are you sure you want to unblock ${item.nickname}?`,
    confirmButtonColor: '#FF5290',
  })
  .then(() => {
    HUD.showLoading();
    setTimeout(() => {
      HUD.hideLoading();
      blacklist.value = blacklist.value.filter(u => u.id !== item.id);
      HUD.showToast(`${item.nickname} unblocked Successfully`);
    }, 1000);
  })
  .catch(() => {
    // on cancel
  });
};

</script>

<template>
  <div class="blacklist-page">
    <!-- Header -->
    <header class="header">
      <button class="back-btn" @click="router.back()">
        <img :src="backIcon" alt="Back" />
      </button>
      <h1 class="title">Blacklist</h1>
      <div class="header-right"></div>
    </header>

    <div class="content">
      <div v-if="blacklist.length > 0" class="list-container">
        <div v-for="user in blacklist" :key="user.id" class="blacklist-item">
          <img :src="user.avatar" alt="Avatar" class="user-avatar" />
          <div class="user-info">
            <span class="user-nickname">{{ user.nickname }}</span>
            <span class="block-time">{{ user.time }}</span>
          </div>
          <button class="remove-btn" @click="removeFromBlacklist(user)">Remove</button>
        </div>
      </div>
      <van-empty v-else description="No blocked users" image="search" />
    </div>
  </div>
</template>

<style scoped>
.blacklist-page {
  width: 100%;
  height: 100vh;
  background-color: #fff;
  display: flex;
  flex-direction: column;
}

/* Header */
.header {
  height: 44px;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  flex-shrink: 0;
  margin-top: env(safe-area-inset-top);
  border-bottom: 1px solid #F5F6F7;
}

.back-btn {
  width: 24px;
  background: none;
  border: none;
  padding: 0;
}

.back-btn img {
  width: 100%;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #1A1A1A;
}

.header-right {
  width: 24px;
}

/* Content */
.content {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
}

.blacklist-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #F5F6F7;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 12px;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-nickname {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A1A;
}

.block-time {
  font-size: 12px;
  color: #999;
}

.remove-btn {
  background-color: #F5F6F7;
  color: #666;
  border: none;
  border-radius: 16px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
}

.remove-btn:active {
  background-color: #EBECED;
  transform: scale(0.95);
}
</style>
