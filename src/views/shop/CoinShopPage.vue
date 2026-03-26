<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { Popup as VanPopup, Loading as VanLoading } from 'vant';
import { useUserStore } from '@/stores/userStore';
import { storeToRefs } from 'pinia';

// Assets
import backIcon from '@/assets/comm/comm-back.png';
import diamondIcon from '@/assets/profile/diamond_icon.svg';
import { post } from '@/utils/net/request';
import { API } from '@/utils/net/api';
import type { ProductModel } from '@/components/appModels/ProductModel';
import HUD from '@/components/HUD';

interface PMItem {
  GTP: string
  Image: string
  PM: string
}

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const userStore = useUserStore();
const { userInfo } = storeToRefs(userStore);
const currentCoins = computed(() => userInfo.value?.Coins ?? 0);

const products = ref<ProductModel[]>([]);
const currentFeaturedProduct = ref<ProductModel | null>(null)

// Payment method picker state
const showPayPicker = ref(false);
const paymentMethods = ref<PMItem[]>([]);
const pendingProductId = ref<string>('');

const requestPay = async (productId: string) => {
  HUD.showLoading()
  const res = await post(API.pay, { ProductId: productId })
  HUD.hideLoading()
  if (res.code == "0" && res.data.PM?.MList) {
    paymentMethods.value = res.data.PM.MList
    pendingProductId.value = productId
    showPayPicker.value = true
  }
}

const onPurchaseFeatured = async () => {
  if (!currentFeaturedProduct.value) return
  await requestPay(currentFeaturedProduct.value.ProductId)
};

const onPurchase = async (product: ProductModel) => {
  await requestPay(product.ProductId)
};

// Payment webview state
const showPayWebview = ref(false);
const payWebviewUrl = ref('');
const isPayLoading = ref(true);

const onSelectPayMethod = (method: PMItem) => {
  showPayPicker.value = false
  console.log(method);

  if (method.GTP) {
    setTimeout(() => {
      payWebviewUrl.value = method.GTP
      isPayLoading.value = true
      showPayWebview.value = true
      console.log('[Shop] opening pay webview:', method.GTP, 'showPayWebview:', showPayWebview.value)
    }, 350)
  }
};

const onPayIframeLoad = () => {
  isPayLoading.value = false
};

const closePayWebview = () => {
  showPayWebview.value = false
  payWebviewUrl.value = ''
  // Refresh user coins after payment
  userStore.updateLoginUserInfo()
  gerCurrentFeaturedProduct()
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
      <div v-if="currentFeaturedProduct" class="featured-banner" @click="onPurchaseFeatured">
        <img :src="currentFeaturedProduct.ProductCover" alt="">
      </div>

      <!-- Products Grid -->
      <div class="products-grid">
        <div v-for="product in products" :key="product.ProductId" class="product-card" @click="onPurchase(product)">
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

    <!-- Payment Method Picker -->
    <VanPopup v-model:show="showPayPicker" position="bottom" round
      :overlay-style="{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }">
      <div class="pay-picker">
        <div class="pay-picker-header">
          <span class="pay-picker-title">Select Payment</span>
          <button class="pay-picker-close" @click="showPayPicker = false">&times;</button>
        </div>
        <div class="pay-picker-list">
          <div v-for="(method, index) in paymentMethods" :key="index" class="pay-method-item"
            @click="onSelectPayMethod(method)">
            <img v-if="method.Image" :src="method.Image" alt="" class="pay-method-icon" />
            <span class="pay-method-name">{{ method.PM }}</span>
            <span class="pay-method-arrow">&rsaquo;</span>
          </div>
        </div>
      </div>
    </VanPopup>

    <!-- Payment Webview (half-screen iframe) -->
    <VanPopup v-model:show="showPayWebview" position="bottom" round :style="{ height: '90vh' }" :z-index="9999"
      :overlay-style="{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }">
      <div class="pay-webview-container">
        <div class="pay-webview-header">
          <span class="pay-webview-title">Payment</span>
          <button class="pay-webview-close" @click="closePayWebview">&times;</button>
        </div>
        <div class="pay-webview-body">
          <iframe v-if="payWebviewUrl" :src="payWebviewUrl" class="pay-iframe" frameborder="0" allow="payment"
            @load="onPayIframeLoad"></iframe>
        </div>
      </div>
    </VanPopup>
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
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-btn img {
  width: 100%;
  height: 100%;
  object-fit: contain;
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
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  padding: 12px 20px;
  padding-bottom: calc(20px + env(safe-area-inset-bottom));
}

/* === Featured Banner === */
.featured-banner {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* padding: 16px; */
  box-sizing: border-box;
  cursor: pointer;
  transition: transform 0.15s ease;
  margin-bottom: 13px;
}

.featured-banner:active {
  transform: scale(0.98);
}

.featured-banner img {
  width: 100%;
}

.banner-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.banner-diamond-wrap {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.banner-diamond-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.banner-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.banner-top-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.banner-coins {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
}

.banner-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.35);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 11px;
  white-space: nowrap;
}

.banner-subtitle {
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
}

.banner-price-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  padding: 8px 16px;
  white-space: nowrap;
}

.banner-price-btn span {
  font-size: 12px;
  font-weight: 500;
  color: #fff;
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
  padding: 16px 0 16px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.2s ease;
}

.product-card:active {
  transform: scale(0.97);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.card-image-wrap {
  width: 100px;
  aspect-ratio: 100 / 70;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.card-coins-row {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-bottom: 12px;
}

.card-coins {
  font-size: 18px;
  font-weight: 700;
  color: #000;
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
  background-color: transparent;
}

.card-price-btn span {
  font-size: 14px;
  font-weight: 500;
  color: #999;
}

/* === Payment Method Picker === */
.pay-picker {
  padding: 20px;
  padding-bottom: calc(20px + env(safe-area-inset-bottom));
}

.pay-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.pay-picker-title {
  font-size: 18px;
  font-weight: 700;
  color: #1A1A1A;
}

.pay-picker-close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #999;
  background: none;
  border: none;
  cursor: pointer;
  line-height: 1;
}

.pay-picker-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.pay-method-item {
  display: flex;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #F2F1F4;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.pay-method-item:last-child {
  border-bottom: none;
}

.pay-method-item:active {
  background-color: #F8F8F8;
}

.pay-method-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
  margin-right: 12px;
  border-radius: 6px;
}

.pay-method-name {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: #1A1A1A;
}

.pay-method-arrow {
  font-size: 20px;
  color: #CCC;
  font-weight: 300;
}

/* === Payment Webview === */
.pay-webview-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.pay-webview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  flex-shrink: 0;
  border-bottom: 1px solid #F2F1F4;
}

.pay-webview-title {
  font-size: 18px;
  font-weight: 700;
  color: #1A1A1A;
}

.pay-webview-close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #999;
  background: none;
  border: none;
  cursor: pointer;
  line-height: 1;
}

.pay-webview-body {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.pay-webview-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  z-index: 2;
}

.pay-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}
</style>
