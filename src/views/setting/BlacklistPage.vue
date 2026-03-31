<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  NavBar as VanNavBar,
  Dialog
} from 'vant';

// Utils
import backIcon from '@/assets/comm/comm-back.png';
import { type UserInfoModel } from '@/components/appModels/UserInfoModel';
import ScrollList from '@/components/ScrollList.vue';
import { post } from '@/utils/net/request';
import { API } from '@/utils/net/api';
import HUD from '@/components/HUD';

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
            <!-- <span class="block-time">{{ user.BlockTime }}</span> -->
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
  background-color: #FFFFFF;
}

.header {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid #f5f5f5;
  flex-shrink: 0;
}

.header-left,
.header-right {
  width: 40px;
}

.back-btn {
  width: 24px;
  height: 24px;
  cursor: pointer;
}

.header-title {
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

.content {
  flex: 1;
  overflow: hidden;
  /* ScrollList will handle the scrolling internally */
}

.list-container {
  padding: 0 16px;
}

.blacklist-item {
  display: flex;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #f9f9f9;
}

.user-avatar {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 12px;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.user-nickname {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.block-time {
  font-size: 12px;
  color: #999;
}

.remove-btn {
  padding: 6px 16px;
  background: #f5f5f5;
  border: none;
  border-radius: 17px;
  font-size: 14px;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  transition: background-color 0.2s;
}

.remove-btn:active {
  background-color: #eeeeee;
}
</style>
