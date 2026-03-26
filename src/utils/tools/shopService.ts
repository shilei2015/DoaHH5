import { markRaw } from 'vue';
import { showModal } from '@/utils/tools/modalService';
import CoinShopPage from '@/views/shop/CoinShopPage.vue';

/**
 * shopService.ts
 * Global Coin Shop Service
 * Provides a one-liner to open the full-screen coin shop from anywhere in the app.
 */

export function showCoinShop() {
    return showModal(markRaw(CoinShopPage), {}, {
        position: 'bottom',
        round: false,
        customStyle: { height: '100vh' },
    });
}
