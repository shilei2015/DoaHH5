<script setup lang="ts">
import { ref } from 'vue';
import { Popup as VanPopup, Loading as VanLoading, Icon as VanIcon } from 'vant';

/**
 * PaymentOverlay.vue
 * 全局支付容器组件，供 PaymentService 通过 render 函数动态挂载。
 * 包含支付渠道选择列表和全屏支付网页 (Iframe)。
 */

export interface PMItem {
  GTP: string;
  Image: string;
  PM: string;
}

const props = defineProps<{
  paymentMethods: PMItem[];
  onSelect: (method: PMItem) => void;
  onClose: () => void;
}>();

// 内嵌支付网页的相关状态
const showPayWebview = ref(false);
const payWebviewUrl = ref('');
const isPayLoading = ref(true);

/**
 * 显示支付内嵌页
 */
const openWebview = (url: string) => {
  payWebviewUrl.value = url;
  isPayLoading.value = true;
  showPayWebview.value = true;
};

/**
 * 关闭支付页并清理
 */
const handleCloseWebview = () => {
  showPayWebview.value = false;
  payWebviewUrl.value = '';
  props.onClose(); // 通知外部容器清理 DOM
};

const handleIframeLoad = () => {
  isPayLoading.value = false;
};

// 暴露方法给 Service 控制
defineExpose({
  openWebview,
  handleCloseWebview
});

</script>

<template>
  <div class="payment-overlay">
    <!-- 支付方式列表弹窗 (底部门板) -->
    <VanPopup :show="!showPayWebview" position="bottom" round :overlay-style="{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }"
      @update:show="(val) => !val && props.onClose()">
      <div class="pay-picker">
        <div class="pay-picker-header">
          <span class="pay-picker-title">Select Payment</span>
          <button class="pay-picker-close" @click="props.onClose()">&times;</button>
        </div>
        <div class="pay-picker-list">
          <div v-for="(method, index) in paymentMethods" :key="index" class="pay-method-item"
            @click="props.onSelect(method)">
            <img v-if="method.Image" :src="method.Image" alt="" class="pay-method-icon" />
            <span class="pay-method-name">{{ method.PM }}</span>
            <span class="pay-method-arrow">&rsaquo;</span>
          </div>
        </div>
      </div>
    </VanPopup>

    <!-- 支付 Webview (全屏门板) -->
    <VanPopup v-model:show="showPayWebview" position="bottom" round :style="{ height: '90vh' }" :z-index="9999"
      :overlay-style="{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }" @closed="handleCloseWebview">
      <div class="pay-webview-container">
        <div class="pay-webview-header">
          <span class="pay-webview-title">Payment</span>
          <button class="pay-webview-close" @click="handleCloseWebview">&times;</button>
        </div>
        <div class="pay-webview-body">
          <!-- <div v-if="isPayLoading" class="pay-webview-loading">
            <VanLoading color="#FF1AD0" vertical>Loading...</VanLoading>
          </div> -->
          <iframe v-if="payWebviewUrl" :src="payWebviewUrl" class="pay-iframe" frameborder="0" allow="payment"
            @load="handleIframeLoad"></iframe>
        </div>
      </div>
    </VanPopup>
  </div>
</template>

<style scoped>
/* 核心样式抽取自 CoinShopPage.vue */
.pay-picker {
  padding: 24px 20px;
  padding-bottom: calc(24px + env(safe-area-inset-bottom));
  background-color: #fff;
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
  font-size: 24px;
  color: #999;
  background: none;
  border: none;
}

.pay-method-item {
  display: flex;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #F2F1F4;
  cursor: pointer;
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

/* Webview Container */
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
  border-bottom: 1px solid #F2F1F4;
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
  background: #fff;
  z-index: 2;
}

.pay-iframe {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
