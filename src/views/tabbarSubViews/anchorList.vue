<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import AnchorCard from '../../components/AnchorCard.vue';
import ScrollList from '../../components/ScrollList.vue';
import { API } from '@/utils/net/api';
import { post } from '@/utils/net/request';
import { onMounted, onActivated } from 'vue';
import HUD from '@/components/HUD';
import { AnchorInfoModel } from '@/components/appModels/AnchorInfoModel';
import { showCoinShop } from '@/utils/tools/shopService';
import { useUserStore } from '@/stores/userStore';
import { useDiscoverRefreshStore } from '@/stores/discoverRefreshStore';

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
/** 列表接口进行中：避免在结果返回前把「未加载」当成「真的空」 */
const isAnchorListPending = ref(true);

const userStore = useUserStore();
const currentCoins = computed(() => userStore.userInfo?.Coins ?? 0);

const selectCategory = (NavId: string) => {
    categories.value.forEach(c => c.active = false);
    const cat = categories.value.find(c => c.NavId === NavId);
    if (cat) cat.active = true;
    currentPage.value = 1;
    anchors.value = [];

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
                return
            }
            const newList = rawList.map((c, i) => ({
                ...c,
                active: i === 0,
            }))
            categories.value = newList
            const firstNavId = newList[0]?.NavId || ''
            if (firstNavId) {
                selectCategory(firstNavId)
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
        if (newFirstNavId && newFirstNavId === prevFirstNavId) {
            return
        }
        if (newFirstNavId) {
            selectCategory(newFirstNavId)
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
    }
}

const getAnchorListByNaviId = async (naviId: string) => {
    if (!naviId.trim()) {
        isAnchorListPending.value = false
        return
    }
    isAnchorListPending.value = true
    try {
        const params = {
            "Page": currentPage.value.toString(),
            "Limit": "30",
            "NavId": naviId
        }
        const response = await post(API.list_user_byId, params)
        if (response.code == "0") {
            anchors.value.push(...response.data?.List || [])
        } else {
            HUD.showToast(response.data?.toast)
        }
    } catch (error: unknown) {
        console.error("getAnchorListByNaviId error:", error)
        HUD.showToast("Unable to load content. Please try again.")
    } finally {
        isAnchorListPending.value = false
    }
}


// ======== 下拉刷新与上拉加载控制 ========
const isRefreshing = ref(false);
const isLoadingMore = ref(false);
const isFinished = ref(false);

const handleRefresh = async () => {
    try {
        currentPage.value = 1
        anchors.value = []
        await getAnchorListByNaviId(currentActiveCateId.value)
        isRefreshing.value = false;
    } finally {
    }
}

const handleLoadMore = async () => {
    try {
        currentPage.value += 1
        await getAnchorListByNaviId(currentActiveCateId.value)
        isLoadingMore.value = false;
    } finally {

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
    anchors.value = []
    isSwitchingCate.value = true
    await getAnchorListByNaviId(navId).finally(() => {
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

/** 仅在确认「加载结束且仍无数据」时显示空状态（含分类切换中的保护已由 isSwitchingCate 覆盖） */
const showListEmptyState = computed(
    () =>
        anchors.value.length === 0 &&
        !isRefreshing.value &&
        !isSwitchingCate.value &&
        !isAnchorListPending.value
)

onMounted(() => {
    refreshCateList()
})

onActivated(() => {
    refreshCateList()
})


</script>

<template>
    <div class="anchor-list-page">
        <!-- 通用的下达拉刷新组件 -->
        <ScrollList v-model:refreshing="isRefreshing" v-model:loading="isLoadingMore" :finished="isFinished"
            :isEmpty="showListEmptyState" @refresh="handleRefresh" @load-more="handleLoadMore">
            <!-- 顶部标题栏 -->
            <div class="header">
                <h1 class="title">Discover</h1>
                <div class="balance-container" @click="showCoinShop()">
                    <img src="@/assets/profile/diamond_icon.svg" class="diamond-icon" alt="diamond" />
                    <span class="coins-total">{{ currentCoins }}</span>
                    <div class="add-btn">+</div>
                </div>
            </div>

            <!-- 水平滑动的标签栏：UP=="1" 时展示 -->
            <div v-show="showCategoryTabs" class="category-tabs">
                <button v-for="cat in categories" :key="cat.NavId" :id="'category-tab-' + cat.NavId" class="tab-btn"
                    :class="{ active: cat.active }" @click="selectCategory(cat.NavId); scrollToCate(cat.NavId, $event)">
                    {{ cat.NavName }}
                </button>
            </div>

            <!-- 主播卡片网格 -->
            <div class="anchor-grid" v-show="anchors.length > 0">
                <AnchorCard v-for="anchor in anchors" :key="anchor.UserId" :anchor="anchor" />
            </div>

            <!-- 分类切换时的中间加载过渡动画 -->
            <div class="cate-loading" v-if="isSwitchingCate">
                <div class="cate-spinner"></div>
            </div>

            <!-- 底部预留 Tabbar 空间，作为内容的一部分以优化滚动感受 -->
            <div class="bottom-placeholder"></div>

        </ScrollList>
    </div>
</template>

<style scoped>
.anchor-list-page {
    width: 100%;
    height: 100vh;
    background-image: url('@/assets/discover/discoverBackground.png');
    background-size: cover;
    background-position: top center;
    background-repeat: no-repeat;
    background-attachment: fixed;
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
    padding-top: calc(20px + env(safe-area-inset-top));
    padding-left: 20px;
    padding-right: 20px;
    /* modified to include status bar top empty space */
    margin-bottom: 24px;
}

.title {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    font-size: 28px;
    font-weight: 800;
    font-style: italic;
    color: #1a1a1a;
    margin: 0;
}

/* Discover 顶栏金币：白底半透明（适配渐变背景） */
.balance-container {
    display: flex;
    align-items: center;
    background-color: rgba(255, 255, 255, 0.72);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    padding: 4px 8px;
    padding-right: 4px;
    border-radius: 100px;
    gap: 4px;
    flex-shrink: 0;
    cursor: pointer;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.balance-container .diamond-icon {
    width: 16px;
    height: 16px;
}

.coins-total {
    font-size: 14px;
    font-weight: 600;
    color: #FF5290;
    margin-right: 4px;
}

.balance-container .add-btn {
    width: 20px;
    height: 20px;
    background: #FF5290;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 600;
    line-height: 1;
}

/* 分类标签栏 */
.category-tabs {
    display: flex;
    gap: 12px;
    padding: 0 20px;
    overflow-x: auto;
    scrollbar-width: none;
    margin-bottom: 20px;
}

.category-tabs::-webkit-scrollbar {
    display: none;
}

.tab-btn {
    white-space: nowrap;
    padding: 8px 20px;
    border-radius: 20px;
    border: none;
    background-color: rgba(255, 255, 255, 0.7);
    font-size: 16px;
    font-weight: 700;
    color: #333;
    cursor: pointer;
    transition: all 0.2s ease;
}

.tab-btn.active {
    background: linear-gradient(90deg, #fed627 0%, #ff1ad0 100%);
    color: white;
}

/* 主播列表网格：align-items 避免子项被拉伸成异常行高（部分 WebView 下与 aspect-ratio 组合会塌缩） */
.anchor-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
    gap: 2px;
    padding: 0 2px;
}

/* 单列 flex 布局下让滚动区占满剩余高度，保证内部百分比高度可计算 */
.anchor-list-page :deep(.scroll-list-container) {
    flex: 1;
    min-height: 0;
}

/* 底部防遮挡占位 */
.bottom-placeholder {
    height: 100px;
    width: 100%;
    flex-shrink: 0;
}

/* 分类切换过渡 Spinner */
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
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-top-color: #ff1ad0;
    border-radius: 50%;
    animation: cate-spin 0.8s linear infinite;
}

@keyframes cate-spin {
    to {
        transform: rotate(360deg);
    }
}
</style>