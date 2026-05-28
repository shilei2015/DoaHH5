import { API } from '@/utils/net/api'
import { post } from '@/utils/net/request'
import type { AnchorInfoModel } from '@/components/appModels/AnchorInfoModel'

export interface DiscoverCategory {
    NavId: string
    NavName: string
    Image: string
    HaveNum: string
    HaveOnline: string
    Type: string
    ListValue: string
    active?: boolean
}

export interface DiscoverPrefetchResult {
    categories: DiscoverCategory[]
    showCategoryTabs: boolean
    activeNavId: string
    anchors: AnchorInfoModel[]
}

const PAGE_LIMIT = 18

let prefetchPromise: Promise<DiscoverPrefetchResult | null> | null = null
let prefetchedResult: DiscoverPrefetchResult | null = null
let consumed = false

export function prefetchDiscoverHome(): Promise<DiscoverPrefetchResult | null> {
    if (prefetchedResult) return Promise.resolve(prefetchedResult)
    if (prefetchPromise) return prefetchPromise

    prefetchPromise = (async () => {
        try {
            const navResponse = await post(API.list_nav)
            if (navResponse.code != '0') return null

            const rawCategories: DiscoverCategory[] = navResponse.data?.List ?? []
            const activeNavId = rawCategories[0]?.NavId || ''
            const showCategoryTabs = String(navResponse.data?.UP) === '1'
            let anchors: AnchorInfoModel[] = []

            if (activeNavId) {
                const anchorResponse = await post(API.list_user_byId, {
                    Page: '1',
                    Limit: String(PAGE_LIMIT),
                    NavId: activeNavId,
                })
                if (anchorResponse.code == '0') {
                    anchors = anchorResponse.data?.List || []
                } else {
                    return null
                }
            }

            prefetchedResult = {
                categories: rawCategories,
                showCategoryTabs,
                activeNavId,
                anchors,
            }
            return prefetchedResult
        } catch (error) {
            console.warn('[DiscoverPrefetch] failed:', error)
            return null
        } finally {
            prefetchPromise = null
        }
    })()

    return prefetchPromise
}

export function consumeDiscoverPrefetch(): DiscoverPrefetchResult | null {
    if (consumed || !prefetchedResult) return null
    consumed = true
    const result = prefetchedResult
    prefetchedResult = null
    return result
}

export async function waitForDiscoverPrefetch(): Promise<DiscoverPrefetchResult | null> {
    if (consumed) return null
    if (prefetchedResult) return consumeDiscoverPrefetch()
    if (!prefetchPromise) return null

    await prefetchPromise
    return consumeDiscoverPrefetch()
}
