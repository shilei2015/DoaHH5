<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import AnchorCard from '../../components/AnchorCard.vue';
import CoinBalanceBadge from '@/components/common/CoinBalanceBadge.vue';
import ScrollList from '../../components/ScrollList.vue';
import { API } from '@/utils/net/api';
import { post } from '@/utils/net/request';
import { onMounted, onActivated, onDeactivated } from 'vue';
import HUD from '@/components/HUD';
import { AnchorInfoModel } from '@/components/appModels/AnchorInfoModel';
import { showCoinShop } from '@/utils/tools/shopService';
import { useDiscoverRefreshStore } from '@/stores/discoverRefreshStore';
import { useUserStore } from '@/stores/userStore';
import { onBeforeRouteLeave, useRoute } from 'vue-router';

const anchorListScrollState = {
    top: 0,
    anchorId: '',
    anchorOffset: 0,
};

class AnchorCate {
    NavId: string = ""
    NavName: string = ""
    Image: string = ""
    HaveNum: string = ""
    HaveOnline: string = ""
    Type: string = ""
    ListValue: string = ""
    active: boolean = false
}

const categories = ref<AnchorCate[]>([]);
/** list_nav 返回 UP=="1" 时展示分类 Tab，否则隐藏（主播仍用列表第一项 NavId 请求） */
const showCategoryTabs = ref(true);

const anchors = ref<AnchorInfoModel[]>([]);
const isSwitchingCate = ref(false);
const isCategoryListPending = ref(true);
/** 列表接口进行中：避免在结果返回前把「未加载」当成「真的空」 */
const isAnchorListPending = ref(true);
const userStore = useUserStore();
const route = useRoute();
const currentCoins = computed(() => userStore.userInfo?.Coins || '0');

const selectCategory = (NavId: string, shouldResetScroll = true) => {
    categories.value.forEach(c => c.active = false);
    const cat = categories.value.find(c => c.NavId === NavId);
    if (cat) cat.active = true;
    currentPage.value = 1;
    anchors.value = [];
    isFinished.value = false;
    if (shouldResetScroll) {
        resetScrollTop();
    }

    isSwitchingCate.value = true;
    getAnchorListByNaviId(NavId).finally(() => {
        isSwitchingCate.value = false;
    });
};

const scrollToCate = (NavId: string, event: Event) => {
    const element = event.currentTarget as HTMLElement
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
};

const getCategoryImage = (cat: AnchorCate): string => {
    const image = cat.Image?.trim()
    return image || ''
}

const PAGE_LIMIT = 18
var currentPage = ref(1)

let cateRefreshInFlight = false

/**
 * 进入 Discover 时拉最新分类。
 * - UP=="1"：展示分类；若本次刷新前已有选中项且仍在新列表中，只更新分类数据，不重新拉主播。
 * - 否则：隐藏分类；主播始终用「当前分类列表第一项」的 NavId；若第一项 NavId 相对上次未变，不重新拉主播。
 */
const refreshCateList = async () => {
    if (cateRefreshInFlight) return
    cateRefreshInFlight = true
    isCategoryListPending.value = true

    const previousNavId = categories.value.find((c) => c.active)?.NavId ?? ''
    const hadActiveSelection = Boolean(previousNavId.trim())
    const prevFirstNavId = categories.value[0]?.NavId ?? ''

    try {
        const response = await post(API.list_nav)
        if (response.code != "0") {
            HUD.showToast(response.data?.toast)
            isAnchorListPending.value = false
            return
        }

        const rawList: AnchorCate[] = response.data?.List ?? []
        const upFlag = response.data?.UP
        showCategoryTabs.value = String(upFlag) === '1'

        if (showCategoryTabs.value) {
            if (hadActiveSelection && rawList.some((c) => c.NavId === previousNavId)) {
                categories.value = rawList.map((c) => ({
                    ...c,
                    active: c.NavId === previousNavId,
                }))
                if (anchors.value.length === 0) {
                    selectCategory(previousNavId, false)
                }
                return
            }
            const newList = rawList.map((c, i) => ({
                ...c,
                active: i === 0,
            }))
            categories.value = newList
            const firstNavId = newList[0]?.NavId || ''
            if (firstNavId) {
                selectCategory(firstNavId, false)
            } else {
                anchors.value = []
                isAnchorListPending.value = false
            }
            return
        }

        const newList = rawList.map((c, i) => ({
            ...c,
            active: i === 0,
        }))
        categories.value = newList
        const newFirstNavId = newList[0]?.NavId || ''
        if (newFirstNavId && newFirstNavId === prevFirstNavId && anchors.value.length > 0) {
            return
        }
        if (newFirstNavId) {
            selectCategory(newFirstNavId, false)
        } else {
            anchors.value = []
            isAnchorListPending.value = false
        }
    } catch (error: unknown) {
        console.error('refreshCateList error:', error)
        HUD.showToast('Unable to load content. Please try again.')
        isAnchorListPending.value = false
    } finally {
        cateRefreshInFlight = false
        isCategoryListPending.value = false
    }
}

const getAnchorListByNaviId = async (
    naviId: string,
    options: { shouldRestoreScroll?: boolean; replaceList?: boolean } = {}
) => {
    const { shouldRestoreScroll = true, replaceList = false } = options
    if (!naviId.trim()) {
        isAnchorListPending.value = false
        return 0
    }
    let addedCount = 0
    isAnchorListPending.value = true
    try {
        const params = {
            "Page": currentPage.value.toString(),
            "Limit": String(PAGE_LIMIT),
            "NavId": naviId
        }
        const response = await post(API.list_user_byId, params)
        if (response.code == "0") {
            const nextList: AnchorInfoModel[] = response.data?.List || []
            addedCount = nextList.length
            if (replaceList) {
                anchors.value = nextList
            } else {
                anchors.value.push(...nextList)
            }
        } else {
            HUD.showToast(response.data?.toast)
        }
    } catch (error: unknown) {
        console.error("getAnchorListByNaviId error:", error)
        HUD.showToast("Unable to load content. Please try again.")
    } finally {
        isAnchorListPending.value = false
        if (shouldRestoreScroll && anchorListScrollState.top > 0 && route.name === 'anchorList') {
            restoreScrollTop()
        }
    }
    return addedCount
}


// ======== 下拉刷新与上拉加载控制 ========
const isRefreshing = ref(false);
const isLoadingMore = ref(false);
const isFinished = ref(false);
const scrollListRef = ref<InstanceType<typeof ScrollList> | null>(null);
const anchorListPageRef = ref<HTMLElement | null>(null);
const savedScrollTop = ref(anchorListScrollState.top);
const shouldTrackScroll = ref(true);

const syncScrollTop = (top: number, force = false) => {
    if (!force && !shouldTrackScroll.value) return;
    const nextTop = Math.max(0, top);
    savedScrollTop.value = nextTop;
    anchorListScrollState.top = nextTop;
}

const getScrollContainer = () =>
    anchorListPageRef.value?.querySelector<HTMLElement>('.scroll-list-container') ?? null

const captureVisibleAnchorId = () => {
    const container = getScrollContainer()
    if (!container || !anchorListPageRef.value) return
    const containerRect = container.getBoundingClientRect()
    const visibleCards = Array.from(
        anchorListPageRef.value.querySelectorAll<HTMLElement>('[data-anchor-id]')
    )
        .map((el) => ({ el, rect: el.getBoundingClientRect() }))
        .filter(({ rect }) => rect.bottom > containerRect.top + 8 && rect.top < containerRect.bottom - 8)
        .sort((a, b) => Math.abs(a.rect.top - containerRect.top) - Math.abs(b.rect.top - containerRect.top))

    const firstVisible = visibleCards[0]
    const anchorId = firstVisible?.el.dataset.anchorId
    if (anchorId && firstVisible) {
        anchorListScrollState.anchorId = anchorId
        anchorListScrollState.anchorOffset = firstVisible.rect.top - containerRect.top
    }
}

const resetScrollTop = () => {
    anchorListScrollState.anchorId = '';
    syncScrollTop(0, true);
    nextTick(() => {
        scrollListRef.value?.setScrollTop(0);
    });
}

const saveScrollTop = (captureAnchor = true) => {
    if (captureAnchor) {
        captureVisibleAnchorId()
    }
    syncScrollTop(scrollListRef.value?.getScrollTop() ?? savedScrollTop.value, true)
}

const saveProfileEntryPosition = (userId: string) => {
    anchorListScrollState.anchorId = userId;
    const container = getScrollContainer()
    const target = anchorListPageRef.value?.querySelector<HTMLElement>(`[data-anchor-id="${userId}"]`)
    if (container && target) {
        anchorListScrollState.anchorOffset = target.getBoundingClientRect().top - container.getBoundingClientRect().top
    }
    saveScrollTop(false);
}

const restoreAnchorElement = () => {
    const anchorId = anchorListScrollState.anchorId;
    if (!anchorId || !anchorListPageRef.value) return false;
    const target = Array.from(
        anchorListPageRef.value.querySelectorAll<HTMLElement>('[data-anchor-id]')
    ).find((el) => el.dataset.anchorId === anchorId);
    if (!target) return false;
    scrollListRef.value?.scrollElementIntoView(target, anchorListScrollState.anchorOffset);
    return true;
}

const restoreScrollTop = () => {
    const top = anchorListScrollState.top
    shouldTrackScroll.value = false
    const restore = () => {
        if (!restoreAnchorElement()) {
            scrollListRef.value?.setScrollTop(top)
        }
    }
    nextTick(() => {
        restore()
        requestAnimationFrame(() => {
            restore()
        })
        window.setTimeout(restore, 80)
        window.setTimeout(restore, 180)
        window.setTimeout(() => {
            restore()
            shouldTrackScroll.value = true
        }, 360)
    })
}

const handleRefresh = async () => {
    try {
        currentPage.value = 1
        isFinished.value = false
        await getAnchorListByNaviId(currentActiveCateId.value, { replaceList: true })
    } finally {
        isRefreshing.value = false;
    }
}

const handleLoadMore = async () => {
    const previousPage = currentPage.value
    try {
        currentPage.value = previousPage + 1
        const addedCount = await getAnchorListByNaviId(currentActiveCateId.value, { shouldRestoreScroll: false })
        if (addedCount === 0) {
            currentPage.value = previousPage
        }
    } finally {
        isLoadingMore.value = false;
    }
}

const currentActiveCateId = computed(() => {
    return categories.value.find(item => item.active)?.NavId || ""
})

/** 购买金币成功后由 CoinShop 递增 tick，此处仅重拉当前分类下第一页主播 */
const discoverRefreshStore = useDiscoverRefreshStore()
const reloadCurrentAnchorList = async () => {
    const navId = currentActiveCateId.value
    if (!navId.trim()) return
    currentPage.value = 1
    isFinished.value = false
    isSwitchingCate.value = true
    await getAnchorListByNaviId(navId, { replaceList: true }).finally(() => {
        isSwitchingCate.value = false
    })
}
watch(
    () => discoverRefreshStore.anchorListTick,
    (tick) => {
        if (tick < 1) return
        void reloadCurrentAnchorList()
    }
)

watch(
    () => route.name,
    (name) => {
        if (name === 'anchorList') {
            restoreScrollTop()
        }
    },
    { flush: 'post' }
)

/** 仅在确认「加载结束且仍无数据」时显示空状态（含分类切换中的保护已由 isSwitchingCate 覆盖） */
const showListEmptyState = computed(
    () =>
        anchors.value.length === 0 &&
        !isRefreshing.value &&
        !isSwitchingCate.value &&
        !isCategoryListPending.value &&
        !isAnchorListPending.value
)

const showInitialAnchorLoading = computed(
    () =>
        anchors.value.length === 0 &&
        !showListEmptyState.value &&
        !isRefreshing.value &&
        (isCategoryListPending.value || isAnchorListPending.value || isSwitchingCate.value)
)

onMounted(() => {
    refreshCateList()
})

onActivated(() => {
    if (categories.value.length === 0 && anchors.value.length === 0) {
        refreshCateList()
    }
    restoreScrollTop()
})

onDeactivated(() => {
    saveScrollTop(true)
    shouldTrackScroll.value = false
})

onBeforeRouteLeave(() => {
    saveScrollTop(true)
    shouldTrackScroll.value = false
})


</script>

<template>
    <div ref="anchorListPageRef" class="anchor-list-page">
        <!-- 顶部标题栏 -->
        <div class="header">
            <h1 class="title">Discover</h1>
            <CoinBalanceBadge
                :coins="currentCoins"
                :config="{ showAdd: true, interactive: true, ariaLabel: 'Open coin shop' }"
                @click="showCoinShop()"
            />
        </div>

        <!-- 水平滑动的标签栏：UP=="1" 时展示 -->
        <div v-show="showCategoryTabs" class="category-tabs">
            <button v-for="cat in categories" :key="cat.NavId" :id="'category-tab-' + cat.NavId" class="tab-btn"
                :class="{ active: cat.active }" @click="selectCategory(cat.NavId, true); scrollToCate(cat.NavId, $event)">
                <img v-if="getCategoryImage(cat)" :src="getCategoryImage(cat)" class="tab-icon" alt="" />
                <span>{{ cat.NavName }}</span>
            </button>
        </div>

        <!-- 通用的下达拉刷新组件 -->
        <div class="list-scroll-region">
            <ScrollList ref="scrollListRef" v-model:refreshing="isRefreshing" v-model:loading="isLoadingMore" :finished="isFinished"
                :isEmpty="showListEmptyState" @refresh="handleRefresh" @load-more="handleLoadMore"
                @scroll-top-change="syncScrollTop">
                <!-- 主播卡片网格 -->
                <div class="anchor-grid" v-show="anchors.length > 0">
                    <AnchorCard v-for="anchor in anchors" :key="anchor.UserId" :anchor="anchor"
                        @open-profile="saveProfileEntryPosition" />
                </div>

                <div class="initial-loading" v-if="showInitialAnchorLoading">
                    <div class="cate-spinner"></div>
                </div>

                <!-- 分类切换时的中间加载过渡动画 -->
                <div class="cate-loading" v-if="isSwitchingCate && anchors.length > 0">
                    <div class="cate-spinner"></div>
                </div>

                <template #footer>
                    <!-- 底部预留 Tabbar 空间放在加载指示器之后，避免 loading 被占位挤到回弹区外 -->
                    <div class="bottom-placeholder"></div>
                </template>

            </ScrollList>
        </div>
    </div>
</template>

<style scoped>
.anchor-list-page {
    width: 100%;
    height: 100%;
    background: #1a1a1a;
    display: flex;
    flex-direction: column;
    scrollbar-width: none;
    overflow: hidden;
}

.anchor-list-page::-webkit-scrollbar {
    display: none;
}

/* 顶部标题栏 */
.header {
    position: relative;
    z-index: 2;
    /* 确保高于下拉刷新的指示器 */
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-height: 56px;
    padding: calc(12px + env(safe-area-inset-top, 0px)) 20px 12px;
    margin-bottom: 16px;
    flex-shrink: 0;
}

.title {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 28px;
    font-weight: 900;
    color: #fff;
    margin: 0;
    line-height: 32px;
}

/* 分类标签栏 */
.category-tabs {
    display: flex;
    gap: 28px;
    padding: 0 20px 13px;
    overflow-x: auto;
    scrollbar-width: none;
    margin-bottom: 12px;
    border-bottom: 3px solid #252525;
    flex-shrink: 0;
}

.category-tabs::-webkit-scrollbar {
    display: none;
}

.tab-btn {
    white-space: nowrap;
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 0;
    border-radius: 0;
    border: none;
    background: transparent;
    font-size: 16px;
    font-weight: 700;
    color: #fff;
    cursor: pointer;
    transition: all 0.2s ease;
}

.tab-icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    object-fit: contain;
}

.tab-btn.active {
    color: #65d941;
}

.tab-btn.active::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: -16px;
    height: 3px;
    border-radius: 2px;
    background: #65d941;
}

/* 主播列表网格：align-items 避免子项被拉伸成异常行高（部分 WebView 下与 aspect-ratio 组合会塌缩） */
.list-scroll-region {
    flex: 1;
    min-height: 0;
    overflow: hidden;
}

.anchor-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
    gap: 1px;
    padding: 0;
}

/* 单列 flex 布局下让滚动区占满剩余高度，保证内部百分比高度可计算 */
.anchor-list-page :deep(.scroll-list-container) {
    flex: 1;
    min-height: 0;
}

/* 底部防遮挡占位 */
.bottom-placeholder {
    height: var(--app-tabbar-content-offset, 88px);
    width: 100%;
    flex-shrink: 0;
}

/* 初始加载与分类切换过渡 Spinner */
.initial-loading,
.cate-loading {
    width: 100%;
    min-height: 300px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.cate-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(255, 255, 255, 0.12);
    border-top-color: #65d941;
    border-radius: 50%;
    animation: cate-spin 0.8s linear infinite;
}

@keyframes cate-spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
