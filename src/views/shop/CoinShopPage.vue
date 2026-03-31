<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { storeToRefs } from 'pinia';
import { post } from '@/utils/net/request';
import { API } from '@/utils/net/api';
import type { ProductModel } from '@/components/appModels/ProductModel';
import { paymentService } from '@/utils/tools/paymentService';

// Assets
import backIcon from '@/assets/comm/comm-back.png';
import diamondIcon from '@/assets/profile/diamond_icon.svg';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const userStore = useUserStore();
const { userInfo } = storeToRefs(userStore);
const currentCoins = computed(() => userInfo.value?.Coins ?? 0);

const products = ref<ProductModel[]>([]);
const currentFeaturedProduct = ref<ProductModel | null>(null)

/**
 * Handle direct purchase using the global payment service
 */
const onPurchase = async (productId: string) => {
  await paymentService.startPayment(productId);
};

const getCoinProducts = async () => {
  const res = await post(API.coin_products, { PType: "1" })
  if (res.code == "0") {
    let list: [ProductModel] = res.data.List
    products.value = list
  }
}

const gerCurrentFeaturedProduct = async () => {
  const res = await post(API.coin_recommend)
  if (res.code == "0" && res.data.Product) {
    currentFeaturedProduct.value = res.data.Product
  }
}

onMounted(async () => {
  await getCoinProducts()
  await gerCurrentFeaturedProduct()
})
</script>

<template>
  <div class="shop-page">
    <!-- Navigation Bar -->
    <header class="shop-header">
      <button class="back-btn" @click="emit('close')">
        <img :src="backIcon" alt="Back" />
      </button>
      <span class="shop-title">Shop</span>
      <div class="balance-badge">
        <img :src="diamondIcon" alt="" class="badge-diamond" />
        <span class="badge-coins">{{ currentCoins }}</span>
      </div>
    </header>

    <!-- Scrollable Content -->
    <div class="shop-content">
      <!-- Featured Banner -->
      <div v-if="currentFeaturedProduct" class="featured-banner" @click="onPurchase(currentFeaturedProduct.ProductId)">
        <img :src="currentFeaturedProduct.ProductCover" alt="">
      </div>

      <!-- Products Grid -->
      <div class="products-grid">
        <div v-for="product in products" :key="product.ProductId" class="product-card"
          @click="onPurchase(product.ProductId)">
          <div class="card-image-wrap">
            <img :src="product.ProductCover" alt="" class="card-image" />
          </div>
          <div class="card-coins-row">
            <span class="card-coins">{{ product.PurposeObj?.NumberBase }}</span>
            <span v-if="Number(product.PurposeObj?.NumberEx) > 0" class="card-bonus">{{
              product.PurposeObj?.NumberEx }}</span>
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
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro', sans-serif;
}

/* === Header === */
.shop-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 20px;
  padding-right: 20px;
  height: 44px;
  flex-shrink: 0;
  margin-top: calc(0px + env(safe-area-inset-top));
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
  width: 100%;
  height: 100%;
}

.shop-title {
  font-size: 18px;
  font-weight: 700;
  color: #000;
}

.balance-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  background-color: #F2F1F4;
  padding: 6px 8px;
  border-radius: 16px;
}

.badge-diamond {
  width: 20px;
  height: 20px;
}

.badge-coins {
  font-size: 16px;
  font-weight: 600;
  color: #FF5290;
}

/* === Scrollable Content === */
.shop-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px 20px;
  padding-bottom: calc(20px + env(safe-area-inset-bottom));
}

.featured-banner {
  width: 100%;
  margin-bottom: 13px;
  cursor: pointer;
}

.featured-banner img {
  width: 100%;
}

/* === Products Grid === */
.products-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 13px;
}

.product-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #fff;
  border: 1px solid #EBECED;
  border-radius: 16px;
  padding: 16px 0;
  cursor: pointer;
}

.card-image-wrap {
  width: 100px;
  aspect-ratio: 100 / 70;
  margin-bottom: 16px;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.card-coins-row {
  display: flex;
  gap: 2px;
  margin-bottom: 12px;
}

.card-coins {
  font-size: 18px;
  font-weight: 700;
}

.card-bonus {
  font-size: 18px;
  font-weight: 700;
  color: #FF1AD0;
}

.card-price-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 36px;
  border: 1.5px solid #EBECED;
  border-radius: 18px;
}

.card-price-btn span {
  font-size: 14px;
  font-weight: 500;
  color: #999;
}
</style>
