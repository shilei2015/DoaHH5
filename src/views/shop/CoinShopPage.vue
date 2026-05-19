<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { storeToRefs } from 'pinia';
import { post } from '@/utils/net/request';
import { API } from '@/utils/net/api';
import type { ProductModel } from '@/components/appModels/ProductModel';
import { paymentService } from '@/utils/tools/paymentService';
import { useDiscoverRefreshStore } from '@/stores/discoverRefreshStore';
import CoinBalanceBadge from '@/components/common/CoinBalanceBadge.vue';

// Assets
import backIcon from '@/assets/back_arrow.png';
import coinIcon from '@/assets/coin_icon.png';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const userStore = useUserStore();
const discoverRefreshStore = useDiscoverRefreshStore();
const { userInfo } = storeToRefs(userStore);
const currentCoins = computed(() => userInfo.value?.Coins ?? 0);

const products = ref<ProductModel[]>([]);
const currentFeaturedProduct = ref<ProductModel | null>(null)
const featuredCoins = computed(() => {
  const product = currentFeaturedProduct.value;
  return product?.PurposeObj?.NumberBase || product?.Coins || product?.ProductName || '';
});
const featuredPrice = computed(() => currentFeaturedProduct.value?.ShowPrice || currentFeaturedProduct.value?.ApplePrice || '');
const productCoins = (product: ProductModel) => product.PurposeObj?.NumberBase || product.Coins || product.ProductName;
const productBonus = (product: ProductModel) => product.PurposeObj?.NumberEx || product.ExtraCoins || '';
const productImage = (product?: ProductModel | null) => product?.ProductCover || coinIcon;

/**
 * Handle direct purchase using the global payment service
 */
const onPurchase = async (product: ProductModel) => {
  if (product) {
    await paymentService.startPayment(product, () => {
      discoverRefreshStore.requestAnchorListReloadAfterCoinPurchase();
    });
  }
};

const getCoinProducts = async () => {
  const res = await post(API.coin_products, { PType: "1" })
  if (res.code == "0") {
    let list: [ProductModel] = res.data.List
    products.value = list.filter((item) => item.ProductId != "542379191102817392")
    // products.value = list
  }
}

const gerCurrentFeaturedProduct = async () => {
  const res = await post(API.coin_recommend)
  if (res.code == "0" && res.data.Product) {
    currentFeaturedProduct.value = res.data.Product
  }
}

onMounted(async () => {
  paymentService.preloadApplePaySdk()
  await getCoinProducts()
  await gerCurrentFeaturedProduct()
})
</script>

<template>
  <div class="shop-page">
    <!-- Navigation Bar -->
    <header class="shop-header">
      <div class="shop-header-left">
        <button class="back-btn" @click="emit('close')">
          <img :src="backIcon" alt="Back" />
        </button>
      </div>
      <span class="shop-title">Shop</span>
      <div class="shop-header-right">
        <CoinBalanceBadge :coins="currentCoins" :config="{ showAdd: false }" />
      </div>
    </header>

    <!-- Scrollable Content -->
    <div class="shop-content">
      <!-- Featured Banner -->
      <div v-if="currentFeaturedProduct" class="featured-banner" @click="onPurchase(currentFeaturedProduct)">
        <img :src="coinIcon" alt="" class="featured-image">
        <div class="featured-copy">
          <div class="featured-main">
            <span class="featured-coins">{{ featuredCoins }}</span>
            <span class="featured-tag">Only Once</span>
          </div>
          <div class="featured-subtitle">New user only</div>
        </div>
        <div v-if="featuredPrice" class="featured-price">{{ featuredPrice }}</div>
      </div>

      <!-- Products Grid -->
      <div class="products-grid">
        <div v-for="product in products" :key="product.ProductId" class="product-card"
          @click="onPurchase(product)">
          <div class="card-image-wrap">
            <img :src="productImage(product)" alt="" class="card-image" />
          </div>
          <div class="card-coins-row">
            <span class="card-coins">{{ productCoins(product) }}</span>
            <span v-if="Number(productBonus(product)) > 0" class="card-bonus">+{{ productBonus(product) }}</span>
          </div>
          <div class="card-price-btn">
            <span>{{ product.ShowPrice }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shop-page {
  width: 100%;
  height: 100vh;
  background-color: #1a1a1a;
  display: flex;
  flex-direction: column;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro', sans-serif;
}

/* === Header === */
.shop-header {
  display: flex;
  align-items: center;
  height: 56px;
  flex-shrink: 0;
  margin-top: calc(0px + env(safe-area-inset-top));
  min-width: 0;
  background: #1a1a1a;
}

.shop-header-left,
.shop-header-right {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}

.shop-header-left {
  justify-content: flex-start;
  padding-left: 20px;
}

.shop-header-right {
  justify-content: flex-end;
  padding-right: 20px;
}

.back-btn {
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
}

.back-btn img {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.shop-title {
  flex: 0 1 auto;
  max-width: min(56%, 240px);
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}

/* === Scrollable Content === */
.shop-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 20px;
  padding-bottom: calc(24px + env(safe-area-inset-bottom));
  background: #1a1a1a;
}

.featured-banner {
  width: 100%;
  min-height: 80px;
  margin-bottom: 11px;
  cursor: pointer;
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(100deg, #c8f24e 0%, #78eb3f 100%);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 10px 13px 16px;
  position: relative;
  color: #111;
}

.featured-banner::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 88% -20%, rgba(255, 255, 255, 0.38), transparent 45%);
  pointer-events: none;
}

.featured-image {
  width: 42px;
  height: 42px;
  object-fit: contain;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.featured-copy {
  min-width: 0;
  flex: 1;
  position: relative;
  z-index: 1;
}

.featured-main {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.featured-coins {
  font-size: 25px;
  line-height: 1;
  font-weight: 800;
  color: #111;
}

.featured-tag {
  min-width: 74px;
  height: 22px;
  border-radius: 11px;
  background: #ffffff;
  color: #222;
  font-size: 12px;
  font-weight: 700;
  line-height: 22px;
  text-align: center;
}

.featured-subtitle {
  margin-top: 6px;
  color: rgba(0, 0, 0, 0.5);
  font-size: 12px;
  font-weight: 600;
}

.featured-price {
  min-width: 72px;
  height: 32px;
  padding: 0 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.6);
  color: #2a6b18;
  font-size: 14px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
  white-space: nowrap;
}

/* === Products Grid === */
.products-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 11px;
}

.product-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: 178px;
  background-color: #212121;
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 16px;
  padding: 18px 16px 14px;
  cursor: pointer;
}

.card-image-wrap {
  width: 100%;
  height: 74px;
  margin-bottom: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.card-coins-row {
  display: flex;
  align-items: baseline;
  gap: 2px;
  margin-bottom: 14px;
  min-height: 24px;
}

.card-coins {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}

.card-bonus {
  font-size: 13px;
  font-weight: 700;
  color: #ffde09;
}

.card-price-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 36px;
  background: #292929;
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 18px;
}

.card-price-btn span {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.45);
}
</style>
