import { ref } from 'vue'
import { defineStore } from 'pinia'

/**
 * 金币购买等操作完成后，通知 Discover 主播列表刷新（anchorList 监听 tick）。
 */
export const useDiscoverRefreshStore = defineStore('discoverRefresh', () => {
    const anchorListTick = ref(0)

    function requestAnchorListReloadAfterCoinPurchase() {
        anchorListTick.value++
    }

    return { anchorListTick, requestAnchorListReloadAfterCoinPurchase }
})
