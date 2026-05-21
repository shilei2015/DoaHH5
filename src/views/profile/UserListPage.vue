<script lang="ts">
const userListPageStateCache = new Map<string, {
  anchors: unknown[];
  currentPage: number;
  isFinished: boolean;
  scrollTop: number;
  initialized: boolean;
}>();

export default {
  name: 'UserListPage',
}
</script>

<script setup lang="ts">
import { computed, nextTick, onActivated, onBeforeUnmount, onMounted, ref } from 'vue';
import { onBeforeRouteLeave, useRouter } from 'vue-router';
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
const cacheKey = String(props.apiType);
const cachedState = userListPageStateCache.get(cacheKey);

const anchors = ref<AnchorInfoModel[]>((cachedState?.anchors as AnchorInfoModel[] | undefined) ?? []);
const currentPage = ref(cachedState?.currentPage ?? 1);
const limit = 20;

// Refresh and Load More states
const isRefreshing = ref(false);
const isLoadingMore = ref(false);
const isFinished = ref(cachedState?.isFinished ?? false);
const isInitialLoading = ref(!(cachedState?.initialized && anchors.value.length > 0));
const scrollListRef = ref<InstanceType<typeof ScrollList> | null>(null);
let shouldRefreshOnNextActivate = false;
let shouldKeepStateOnUnmount = false;

const saveState = () => {
  userListPageStateCache.set(cacheKey, {
    anchors: [...anchors.value],
    currentPage: currentPage.value,
    isFinished: isFinished.value,
    scrollTop: scrollListRef.value?.getScrollTop() ?? userListPageStateCache.get(cacheKey)?.scrollTop ?? 0,
    initialized: true,
  });
};

const clearState = () => {
  userListPageStateCache.delete(cacheKey);
  shouldRefreshOnNextActivate = true;
};

const resetState = () => {
  anchors.value = [];
  currentPage.value = 1;
  isFinished.value = false;
  isRefreshing.value = false;
  isLoadingMore.value = false;
  isInitialLoading.value = true;
  scrollListRef.value?.setScrollTop(0);
};

const restoreScrollTop = () => {
  const top = userListPageStateCache.get(cacheKey)?.scrollTop ?? 0;
  if (top <= 0) return;
  nextTick(() => {
    scrollListRef.value?.setScrollTop(top);
    requestAnimationFrame(() => scrollListRef.value?.setScrollTop(top));
    window.setTimeout(() => scrollListRef.value?.setScrollTop(top), 120);
  });
};

/**
 * Fetch common user list from API
 */
const fetchUserList = async (isRefresh: boolean = false) => {
  try {
    if (isRefresh) {
      if (anchors.value.length === 0) {
        isInitialLoading.value = true;
      }
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
      saveState();
    } else {
      HUD.showToast(response.data?.toast || 'Failed to load data');
    }
  } catch (error) {
    HUD.showToast('Network Error');
  } finally {
    isInitialLoading.value = false;
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

const showListEmptyState = computed(() => anchors.value.length === 0 && !isInitialLoading.value && !isRefreshing.value);

onMounted(() => {
  if (cachedState?.initialized && anchors.value.length > 0) {
    restoreScrollTop();
    return;
  }
  fetchUserList(true);
});

onActivated(() => {
  if (shouldRefreshOnNextActivate) {
    shouldRefreshOnNextActivate = false;
    resetState();
    void fetchUserList(true);
    return;
  }
  restoreScrollTop();
});

onBeforeRouteLeave((to) => {
  shouldKeepStateOnUnmount = to.name === 'AnchorProfile';
  if (shouldKeepStateOnUnmount) {
    saveState();
  } else {
    clearState();
  }
});

onBeforeUnmount(() => {
  if (shouldKeepStateOnUnmount) {
    saveState();
  } else {
    userListPageStateCache.delete(cacheKey);
  }
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
      <ScrollList ref="scrollListRef" v-model:refreshing="isRefreshing" v-model:loading="isLoadingMore" :finished="isFinished"
        :isEmpty="showListEmptyState" @refresh="handleRefresh" @load-more="handleLoadMore">
        <!-- Grid of User Cards -->
        <div class="anchor-grid" v-if="anchors.length > 0">
          <AnchorCard v-for="anchor in anchors" :key="anchor.UserId" :anchor="anchor" />
        </div>
        <div class="initial-loading" v-if="isInitialLoading">
          <div class="list-spinner"></div>
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
  min-height: 56px;
  background-color: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(12px + env(safe-area-inset-top, 0px)) 20px 12px;
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
  padding-bottom: var(--app-safe-bottom, 0px);
}

.initial-loading {
  width: 100%;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.list-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.12);
  border-top-color: #65d941;
  border-radius: 50%;
  animation: list-spin 0.8s linear infinite;
}

@keyframes list-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
