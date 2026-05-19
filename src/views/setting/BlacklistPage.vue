<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

// Utils
import backIcon from '@/assets/comm-back.png';
import { type UserInfoModel } from '@/components/appModels/UserInfoModel';
import ScrollList from '@/components/ScrollList.vue';
import { post } from '@/utils/net/request';
import { API } from '@/utils/net/api';
import HUD from '@/components/HUD';
import { getFlagEmoji } from '@/utils/tools';

const router = useRouter();

// List State
const blacklist = ref<UserInfoModel[]>([]);
const refreshing = ref(false);
const loading = ref(false);
const finished = ref(false);
const isEmpty = ref(false);
const page = ref(1);

const goBack = () => {
  router.back();
};

// 获取黑名单数据
const fetchData = async (isRefresh = false) => {
  if (isRefresh) {
    page.value = 1;
    finished.value = false;
    isEmpty.value = false;
  }
  const res = await post(API.user_block_list, { Page: page.value.toString() });
  if (res.code === "0") {
    const list = (res.data.List || []) as UserInfoModel[];

    if (isRefresh) {
      blacklist.value = list;
    } else {
      blacklist.value = [...blacklist.value, ...list];
    }

    // 判断是否加载完毕
    if (list.length < 10) {
      finished.value = true;
    }

    // 判断是否为空
    isEmpty.value = blacklist.value.length === 0;

    page.value++;

    loading.value = false;
    refreshing.value = false;
  }
}


const onRefresh = () => {
  fetchData(true);
};

const onLoadMore = () => {
  fetchData(false);
};

// 移出黑名单
const removeFromBlacklist = async (user: UserInfoModel) => {
  HUD.showLoading()
  const res = await post(API.block_user_remove, { UserId: user.UserId });
  HUD.hideLoading()
  if (res.code === "0") {
    HUD.showToast("Unblocked successfully");
    // 成功后直接在本地列表中移除，避免全量刷新
    blacklist.value = blacklist.value.filter(u => u.UserId !== user.UserId);
    if (blacklist.value.length === 0) {
      isEmpty.value = true;
    }
  }
};

onMounted(() => {
  onRefresh();
});

</script>

<template>
  <div class="blacklist-page">
    <!-- Header -->
    <header class="header">
      <div class="header-left">
        <img :src="backIcon" alt="Back" class="back-btn" @click="goBack" />
      </div>
      <h1 class="header-title">Blacklist</h1>
      <div class="header-right"></div>
    </header>

    <!-- Use ScrollList component -->
    <ScrollList class="content" v-model:refreshing="refreshing" v-model:loading="loading" :finished="finished"
      :isEmpty="isEmpty" @refresh="onRefresh" @load-more="onLoadMore">
      <div class="list-container">
        <div v-for="user in blacklist" :key="user.UserId" class="blacklist-item">
          <img :src="user.HeadImage" class="user-avatar" />
          <div class="user-info">
            <span class="user-nickname">{{ user.Nickname }}</span>
            <span v-if="user.Country || user.CountryCode" class="country-line">
              <span class="flag">{{ getFlagEmoji(user.CountryCode) }}</span>
              <span class="country-name">{{ user.Country }}</span>
            </span>
          </div>
          <button class="remove-btn" @click="removeFromBlacklist(user)">Remove</button>
        </div>
      </div>
    </ScrollList>
  </div>
</template>

<style scoped>
.blacklist-page {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #1A1A1A;
  color: #FFFFFF;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", sans-serif;
}

.header {
  margin-top: env(safe-area-inset-top);
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  flex-shrink: 0;
}

.header-left,
.header-right {
  width: 28px;
  height: 28px;
}

.back-btn {
  width: 28px;
  height: 28px;
  cursor: pointer;
  filter: invert(1);
}

.header-title {
  font-size: 17px;
  line-height: 26px;
  font-weight: 700;
  color: #FFFFFF;
}

.content {
  flex: 1;
  overflow: hidden;
  /* ScrollList will handle the scrolling internally */
}

.list-container {
  padding: 8px 20px var(--app-content-safe-bottom, 34px);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.blacklist-item {
  display: flex;
  align-items: center;
  min-height: 60px;
}

.user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 12px;
  background: #292929;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 6px;
}

.user-nickname {
  font-size: 16px;
  font-weight: 600;
  line-height: 19px;
  color: #FFFFFF;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.country-line {
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 17px;
}

.flag {
  font-size: 16px;
  line-height: 17px;
}

.country-name {
  font-size: 14px;
  font-weight: 500;
  line-height: 17px;
  color: rgba(255, 255, 255, 0.5);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remove-btn {
  width: 86px;
  height: 36px;
  padding: 0;
  background: #292929;
  border: none;
  border-radius: 26px;
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: background-color 0.2s;
}

.remove-btn:active {
  background-color: #333333;
}
</style>
