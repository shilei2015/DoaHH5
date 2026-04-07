<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import AnchorCard from '../../components/AnchorCard.vue';
import ScrollList from '../../components/ScrollList.vue';
import { API } from '@/utils/net/api';
import { post } from '@/utils/net/request';
import { onMounted } from 'vue';
import HUD from '@/components/HUD';
import { AnchorInfoModel } from '@/components/appModels/AnchorInfoModel';
import { showCheckIn } from '@/utils/tools/missionService';
import { showEvaluateCallModal } from '@/utils/tools/modalService';

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

const anchors = ref<AnchorInfoModel[]>([]);
const isSwitchingCate = ref(false);

const handleOpenCheckIn = () => {
    showCheckIn();
};

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

const initPageData = async () => {
    await getCateList()
    // selectCategory is called inside getCateList, which handles fetching anchors.
}
var currentPage = ref(1)
const getCateList = async () => {
    try {
        const response = await post(API.list_nav)
        if (response.code == "0") {
            categories.value = response.data.List
            selectCategory(categories.value[0]?.NavId || "")
        } else {
            HUD.showToast(response.data?.toast)
        }
    } catch (error: any) {
        HUD.showToast(error?.message || String(error) || "Network Error")
        console.error("getCateList error:", error)
    }
}

const getAnchorListByNaviId = async (naviId: string) => {
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
    } catch (error: any) {
        HUD.showToast(error?.message || String(error) || "Network Error")
        console.error("getAnchorListByNaviId error:", error)
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


onMounted(() => {
    initPageData()
})


</script>

<template>
    <div class="anchor-list-page">
        <!-- 通用的下达拉刷新组件 -->
        <ScrollList v-model:refreshing="isRefreshing" v-model:loading="isLoadingMore" :finished="isFinished"
            :isEmpty="anchors.length === 0 && !isRefreshing" @refresh="handleRefresh" @load-more="handleLoadMore">
            <!-- 顶部标题栏 -->
            <div class="header">
                <h1 class="title">Discover</h1>
                <!-- <button class="daily-bonus-btn" @click="handleOpenCheckIn">
                    <span class="bonus-icon">🎁</span>
                    <span class="bonus-text">Daily Bonus</span>
                </button> -->
            </div>

            <!-- 水平滑动的标签栏 -->
            <div class="category-tabs">
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

.daily-bonus-btn {
    display: flex;
    align-items: center;
    background: linear-gradient(90deg, #fed224 0%, #ffae00 100%);
    border: none;
    border-radius: 20px;
    padding: 4px 12px 4px 8px;
    box-shadow: 0 2px 8px rgba(254, 210, 36, 0.4);
    cursor: pointer;
}

.bonus-icon {
    font-size: 16px;
    margin-right: 4px;
}

.bonus-text {
    font-size: 12px;
    font-weight: 800;
    font-style: italic;
    color: #1f2124;
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

/* 主播列表网格 */
.anchor-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 2px;
    padding: 0 2px;
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