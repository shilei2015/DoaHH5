<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
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
  paymentMethods?: PMItem[];
  initialWebviewUrl?: string;
  applePayContainerId?: string;
  applePayPrice?: string;
  applePayMock?: boolean;
  applePayMockPrice?: string;
  onSelect?: (method: PMItem) => void;
  onApplePayUnavailable?: () => void;
  onClose: () => void;
}>();

// 内嵌支付网页的相关状态
const showPayWebview = ref(Boolean(props.initialWebviewUrl));
const payWebviewUrl = ref(props.initialWebviewUrl || '');
const isPayLoading = ref(true);
const isApplePayMode = computed(() => Boolean(props.applePayContainerId || props.applePayMock));
const applePayDisplayPrice = computed(() => props.applePayMockPrice || props.applePayPrice || '');
const isApplePayLoading = ref(false);
const isApplePayReady = ref(false);
const applePayContainerRef = ref<HTMLElement | null>(null);
let applePayObserver: MutationObserver | null = null;
let applePayFailureTimer: number | null = null;
let applePayRevealTimer: number | null = null;
let watchedApplePayIframe: HTMLIFrameElement | null = null;
const transparentOverlayStyle = { backgroundColor: 'transparent' };
const overlayStyle = { backgroundColor: 'var(--app-overlay-background)' };
const strongOverlayStyle = { backgroundColor: 'var(--app-overlay-background-strong)' };
const applePayPanelBackground = '#2F2B34';

const stopApplePayLoading = () => {
  isApplePayLoading.value = false;
};

const hideApplePayIframe = (iframe: HTMLIFrameElement) => {
  iframe.style.backgroundColor = applePayPanelBackground;
  iframe.style.opacity = '0';
  iframe.style.visibility = 'hidden';
};

const showApplePayIframe = () => {
  const iframe = applePayContainerRef.value?.querySelector('iframe');
  if (iframe instanceof HTMLIFrameElement) {
    iframe.style.opacity = '1';
    iframe.style.visibility = 'visible';
  }

  requestAnimationFrame(() => {
    isApplePayReady.value = true;
    stopApplePayLoading();
  });
};

const clearApplePayFailureTimer = () => {
  if (applePayFailureTimer !== null) {
    window.clearTimeout(applePayFailureTimer);
    applePayFailureTimer = null;
  }
};

const clearApplePayRevealTimer = () => {
  if (applePayRevealTimer !== null) {
    window.clearTimeout(applePayRevealTimer);
    applePayRevealTimer = null;
  }
};

const isApplePayRuntimeAvailable = () => {
  const ApplePaySessionCtor = (window as unknown as {
    ApplePaySession?: {
      canMakePayments?: () => boolean;
      supportsVersion?: (version: number) => boolean;
    };
  }).ApplePaySession;

  return Boolean(
    window.isSecureContext &&
    ApplePaySessionCtor &&
    ApplePaySessionCtor.supportsVersion?.(3) &&
    ApplePaySessionCtor.canMakePayments?.()
  );
};

const failApplePay = () => {
  stopApplePayLoading();
  clearApplePayFailureTimer();
  clearApplePayRevealTimer();
  watchedApplePayIframe = null;
  if (props.onApplePayUnavailable) {
    props.onApplePayUnavailable();
  } else {
    props.onClose();
  }
};

const watchApplePayIframe = () => {
  const container = applePayContainerRef.value;
  if (!container) return;

  const iframe = container.querySelector('iframe');
  if (iframe instanceof HTMLIFrameElement && iframe !== watchedApplePayIframe) {
    watchedApplePayIframe = iframe;
    hideApplePayIframe(iframe);
    iframe.addEventListener('load', () => {
      if (!isApplePayRuntimeAvailable()) {
        failApplePay();
        return;
      }
      clearApplePayFailureTimer();
      clearApplePayRevealTimer();
      applePayRevealTimer = window.setTimeout(showApplePayIframe, 450);
    }, { once: true });
    clearApplePayFailureTimer();
    applePayFailureTimer = window.setTimeout(failApplePay, 8000);
  }
};

onMounted(() => {
  if (!isApplePayMode.value) return;
  if (props.applePayMock) {
    isApplePayReady.value = true;
    stopApplePayLoading();
    return;
  }

  if (!isApplePayRuntimeAvailable()) {
    failApplePay();
    return;
  }

  isApplePayLoading.value = true;
  isApplePayReady.value = false;
  nextTick(() => {
    const container = applePayContainerRef.value;
    if (!container) return;

    applePayObserver = new MutationObserver(watchApplePayIframe);
    applePayObserver.observe(container, { childList: true, subtree: true });
    watchApplePayIframe();
  });
});

onBeforeUnmount(() => {
  applePayObserver?.disconnect();
  applePayObserver = null;
  watchedApplePayIframe = null;
  clearApplePayFailureTimer();
  clearApplePayRevealTimer();
});

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
    <VanPopup v-if="isApplePayMode" :show="true" position="bottom" round :z-index="9999"
      :close-on-click-overlay="false"
      :overlay-style="transparentOverlayStyle" @update:show="(val) => !val && props.onClose()">
      <div class="apple-pay-sheet">
        <div class="apple-pay-header">
          <span class="apple-pay-title">Apple Pay</span>
          <button class="apple-pay-close" type="button" @click="props.onClose()">&times;</button>
        </div>
        <div v-if="applePayDisplayPrice" class="apple-pay-price">{{ applePayDisplayPrice }}</div>
        <div class="apple-pay-body">
          <div v-if="isApplePayLoading" class="apple-pay-loading">
            <VanLoading color="#FFFFFF" size="22px" />
          </div>
          <div v-if="props.applePayMock" class="apple-pay-mock">
            <button class="apple-pay-mock-button" type="button">
              <span class="apple-pay-mock-brand">Pay</span>
            </button>
          </div>
          <div v-else :id="props.applePayContainerId" ref="applePayContainerRef" class="apple-pay-sdk-container"
            :class="{ 'is-ready': isApplePayReady }"></div>
        </div>
      </div>
    </VanPopup>

    <!-- 支付方式列表弹窗 (底部门板) -->
    <VanPopup v-if="!isApplePayMode" :show="!showPayWebview" position="bottom" round :overlay-style="overlayStyle"
      @update:show="(val) => !val && props.onClose()">
      <div class="pay-picker">
        <div class="pay-picker-header">
          <span class="pay-picker-title">Select Payment</span>
          <button class="pay-picker-close" @click="props.onClose()">&times;</button>
        </div>
        <div class="pay-picker-list">
          <div v-for="(method, index) in props.paymentMethods" :key="index" class="pay-method-item"
            @click="props.onSelect?.(method)">
            <img v-if="method.Image" :src="method.Image" alt="" class="pay-method-icon" />
            <span class="pay-method-name">{{ method.PM }}</span>
            <span class="pay-method-arrow">&rsaquo;</span>
          </div>
        </div>
      </div>
    </VanPopup>

    <!-- 支付 Webview (全屏门板) -->
    <VanPopup v-if="!isApplePayMode" v-model:show="showPayWebview" position="bottom" round :style="{ height: '90vh' }" :z-index="9999"
      :overlay-style="strongOverlayStyle" @closed="handleCloseWebview">
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

.apple-pay-sheet {
  padding: 12px 18px 20px;
  padding-bottom: calc(24px + env(safe-area-inset-bottom));
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0)),
    #2F2B34;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 -18px 44px rgba(0, 0, 0, 0.42),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  max-height: 70vh;
  overflow-y: auto;
  color: #fff;
  animation: apple-pay-sheet-enter 220ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.apple-pay-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0;
  min-height: 24px;
}

.apple-pay-title {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.56);
}

.apple-pay-close {
  position: absolute;
  top: 0;
  right: 0;
  width: 24px;
  height: 24px;
  font-size: 26px;
  font-weight: 900;
  line-height: 22px;
  color: rgba(255, 255, 255, 0.78);
  background: transparent;
  border: none;
}

.apple-pay-price {
  margin: 10px 0 25px 0;
  color: #ffffff;
  font-size: 28px;
  font-weight: 800;
  line-height: 34px;
  text-align: center;
}

.apple-pay-body {
  position: relative;
  height: 44px;
  min-height: 44px;
  padding: 0;
  overflow: hidden;
}

.apple-pay-loading {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  border-radius: 8px;
  background: #000000;
  pointer-events: none;
}

.apple-pay-sdk-container {
  width: 100%;
  height: 44px;
  min-height: 44px;
  line-height: 0;
  overflow: hidden;
  border-radius: 8px;
  background: #000000;
  visibility: hidden;
}

.apple-pay-sdk-container.is-ready {
  visibility: visible;
}

.apple-pay-sdk-container :deep(iframe) {
  display: block;
  width: 100% !important;
  height: 44px !important;
  background: #2F2B34 !important;
  color-scheme: dark;
  opacity: 0 !important;
  visibility: hidden !important;
}

.apple-pay-sdk-container.is-ready :deep(iframe) {
  opacity: 1 !important;
  visibility: visible !important;
}

.apple-pay-mock {
  display: grid;
  width: 100%;
}

.apple-pay-mock-button {
  width: 100%;
  height: 44px;
  border: none;
  border-radius: 8px;
  background: #000000;
  color: #ffffff;
  font: inherit;
  cursor: pointer;
}

.apple-pay-mock-button:active {
  transform: scale(0.99);
}

.apple-pay-mock-brand {
  font-size: 17px;
  font-weight: 700;
  line-height: 44px;
}

@keyframes apple-pay-sheet-enter {
  from {
    opacity: 0;
    transform: translateY(24px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
