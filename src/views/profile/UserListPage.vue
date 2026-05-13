<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AnchorCard from '@/components/AnchorCard.vue';
import ScrollList from '@/components/ScrollList.vue';
import { API } from '@/utils/net/api';
import { post } from '@/utils/net/request';
import HUD from '@/components/HUD';
import { AnchorInfoModel } from '@/components/appModels/AnchorInfoModel';

// Assets
import backIcon from '@/assets/comm-back.png';

const router = useRouter();
const props = defineProps<{
  title: string;
  apiType: keyof typeof API;
}>();

const anchors = ref<AnchorInfoModel[]>([]);
const currentPage = ref(1);
const limit = 20;

// Refresh and Load More states
const isRefreshing = ref(false);
const isLoadingMore = ref(false);
const isFinished = ref(false);

/**
 * Fetch common user list from API
 */
const fetchUserList = async (isRefresh: boolean = false) => {
  try {
    if (isRefresh) {
      currentPage.value = 1;
      isFinished.value = false;
    }

    const params = {
      Page: currentPage.value.toString(),
      Limit: limit.toString()
    };

    // Use dynamic API endpoint from props
    const endpoint = API[props.apiType] as string;
    const response = await post(endpoint, params);

    if (response.code === "0") {
      const newList = response.data?.List || [];

      if (isRefresh) {
        anchors.value = newList;
      } else {
        anchors.value.push(...newList);
      }

      // Check if all data is loaded
      if (newList.length < limit) {
        isFinished.value = true;
      }
    } else {
      HUD.showToast(response.data?.toast || 'Failed to load data');
    }
  } catch (error) {
    HUD.showToast('Network Error');
  } finally {
    isRefreshing.value = false;
    isLoadingMore.value = false;
  }
};

/**
 * Handle pull-to-refresh
 */
const handleRefresh = async () => {
  await fetchUserList(true);
};

/**
 * Handle load more (pagination)
 */
const handleLoadMore = async () => {
  currentPage.value += 1;
  await fetchUserList();
};

onMounted(() => {
  fetchUserList(true);
});

</script>

<template>
  <div class="user-list-page">
    <!-- Header -->
    <header class="header">
      <button class="back-btn" @click="router.back()">
        <img :src="backIcon" alt="Back" />
      </button>
      <h1 class="title">{{ title }}</h1>
      <div class="header-right"></div>
    </header>

    <!-- Content with Infinite Scroll -->
    <div class="content">
      <ScrollList v-model:refreshing="isRefreshing" v-model:loading="isLoadingMore" :finished="isFinished"
        :isEmpty="anchors.length === 0 && !isRefreshing" @refresh="handleRefresh" @load-more="handleLoadMore">
        <!-- Grid of User Cards -->
        <div class="anchor-grid" v-if="anchors.length > 0">
          <AnchorCard v-for="anchor in anchors" :key="anchor.UserId" :anchor="anchor" />
        </div>
      </ScrollList>
    </div>
  </div>
</template>

<style scoped>
.user-list-page {
  width: 100%;
  height: 100vh;
  background-color: #1a1a1a;
  display: flex;
  flex-direction: column;
  color: #fff;
  font-family: "Avenir Next", "Trebuchet MS", sans-serif;
}

/* Header */
.header {
  height: 96px;
  background-color: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(52px + env(safe-area-inset-top)) 20px 12px;
  flex-shrink: 0;
  margin-top: 0;
  border-bottom: none;
}

.back-btn {
  width: 28px;
  height: 28px;
  background: none;
  border: none;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-btn img {
  width: 100%;
  height: 100%;
  filter: brightness(0) invert(1);
}

.title {
  font-size: 18px;
  font-weight: 800;
  color: #fff;
  margin: 0;
}

.header-right {
  width: 28px;
}

/* Content */
.content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

/* Grid Layout */
.anchor-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
