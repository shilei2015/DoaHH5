import { h, render, markRaw } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { API } from '@/utils/net/api';
import { post } from '@/utils/net/request';
import HUD from '@/components/HUD';
import PaymentOverlay, { type PMItem } from '@/components/common/PaymentOverlay.vue';
import { isA0019Native, requestA0019Purchase } from '@/utils/native/A0019Bridge';
import type { ProductModel } from '@/components/appModels/ProductModel';

/** 服务端苹果验单（需 OrderId + TranscationId，与 api.ts 中 pay_apple_verify 一致） */
const ENABLE_APPLE_IAP_VERIFY_V2 = true;

/**
 * Global Payment Service (paymentService.ts)
 * 命令式支付服务。封装了从请求 API 到弹出支付列表、再到 Webview 支付的全过程。
 * 无三方渠道时在 A0019 内走原生内购；另：列表仅一项且 PM 为 origin 时也走原生。
 * 其余「有渠道且非上述 origin 单条」时走 H5 选渠道支付。
 */

let container: HTMLElement | null = null;
let componentInstance: any = null;
let onFinishedCallback: (() => void) | null = null;

function extractOrderIdFromUnified(data: Record<string, any> | undefined): string | null {
  if (!data) return null;
  const v =
    data.OrderId ?? data.OrderID ?? data.orderId ?? data.OrderNo ?? data.OrderNum ?? data.orderNum;
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function extractAppleSkuIdFromUnified(data: Record<string, any> | undefined): string | null {
  if (!data) return null;
  const v =
    data.AppleSkuId ??
    data.AppleSKUId ??
    data.Product?.AppleSkuId ??
    data.product?.AppleSkuId;
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

async function resolveAppleSkuId(
  productId: string,
  unifiedData: Record<string, any> | undefined
): Promise<string | null> {
  const fromOrder = extractAppleSkuIdFromUnified(unifiedData);
  if (fromOrder) return fromOrder;
  try {
    const res = await post(API.coin_products, { PType: '1' });
    if (res.code !== '0' || !res.data?.List) return null;
    const list = res.data.List as ProductModel[];
    const p = list.find((item) => item.ProductId === productId);
    return p?.AppleSkuId?.trim() || null;
  } catch {
    return null;
  }
}

export const paymentService = {
  /**
   * 启动支付流程
   * @param productId
   * @param onFinished 支付流程结束（关闭弹窗或原生流程结束）后的回调
   */
  async startPayment(product: ProductModel, onFinished?: () => void) {
    onFinishedCallback = onFinished || null;
    const productId = product.ProductId;
    HUD.showLoading();
    try {
      const res = await post(API.pay, { ProductId: product.ProductId });
      

      if (res.code !== '0' || !res.data) {
        HUD.hideLoading();
        console.warn('[Payment] unifiedOrder rejected', res.code, res.data);
        HUD.showToast('Unable to start payment. Please try again.');
        this.clearCallback();
        return;
      }

      const data = res.data as Record<string, any>;
      const mList: PMItem[] = Array.isArray(data.PM?.MList) ? data.PM.MList : [];
      const shouldUseNativeIap = mList.length === 1 && String(mList[0]?.PM ?? '').trim() === 'origin';
      if (shouldUseNativeIap) {
        if (!isA0019Native()) {
          HUD.hideLoading();
          console.warn('[Payment] origin IAP requires A0019 WebView');
          HUD.showToast('No payment methods available.');
          this.clearCallback();
          return;
        }

        const orderId = extractOrderIdFromUnified(data);
        if (!orderId) {
          HUD.hideLoading();
          console.warn('[Payment] unifiedOrder missing order id', data);
          HUD.showToast('Something went wrong. Please try again.');
          this.clearCallback();
          return;
        }

        const appleSkuId = product.AppleSkuId
        if (!appleSkuId) {
          HUD.hideLoading();
          console.warn('[Payment] could not resolve Apple SKU', { productId });
          HUD.showToast('Something went wrong. Please try again.');
          this.clearCallback();
          return;
        }

        requestA0019Purchase(appleSkuId, orderId);
        return;
      }

      if (mList.length >= 1) {
        this.openOverlay(mList, productId);
        return;
      }

      console.warn('[Payment] empty payment method list');
      HUD.showToast('No payment methods available.');
      this.clearCallback();
    } catch (error) {
      HUD.hideLoading();
      console.error('[Payment] startPayment', error);
      HUD.showToast('Unable to connect. Please try again.');
      this.clearCallback();
    }
  },

  /**
   * A0019 原生支付失败或参数不全时由 Bridge 调用，清理 onFinished 等状态
   */
  handleA0019NativePurchaseFailed(message = 'Payment could not be completed. Please try again.') {
    HUD.showToast(message);
    this.clearCallback();
  },

  /**
   * A0019 原生内购成功回调：服务端验单需 orderId + transactionId（Apple）
   */
  async runNativeA0019Purchase(orderId: string, transactionId: string) {
    HUD.showLoading();
    try {
      if (ENABLE_APPLE_IAP_VERIFY_V2) {
        const verifyRes = await post(API.pay_apple_verify, {
          OrderId: orderId,
          TranscationId: transactionId
        });
        HUD.hideLoading();

        if (verifyRes.code === '0') {
          const userStore = useUserStore();
          await userStore.updateLoginUserInfo();
          HUD.showToast('Payment successful');
          this.triggerCallback();
        } else {
          console.warn('[Payment] verify rejected', verifyRes.code, verifyRes.data);
          HUD.showToast('Verification could not be completed. Please try again.');
          this.clearCallback();
        }
        return;
      }

      HUD.hideLoading();
      const userStore = useUserStore();
      await userStore.updateLoginUserInfo();
      HUD.showToast('Payment successful');
      this.triggerCallback();
    } catch (e: unknown) {
      HUD.hideLoading();
      console.error('[Payment] native purchase', e);
      HUD.showToast('Payment could not be completed. Please try again.');
      this.clearCallback();
    }
  },

  /**
   * 打开支付面板 (命令式挂载)
   */
  openOverlay(methods: PMItem[], productId: string) {
    // 1. Cleanup previous instance
    this.close();

    // 2. Build Container
    container = document.createElement('div');
    document.body.appendChild(container);

    // 3. Render the Component
    const vnode = h(markRaw(PaymentOverlay), {
      paymentMethods: methods,
      onSelect: (method: PMItem) => this.handleSelectMethod(method, productId),
      onClose: () => this.close(),
    });

    render(vnode, container);
    // Capture the instance (to call exposed methods like openWebview later)
    componentInstance = vnode.component?.exposed;
  },

  /**
   * 处理支付渠道选择
   */
  handleSelectMethod(method: PMItem, productId: string) {
    console.log('[PaymentService] Selecting channel:', method.PM, 'Product:', productId);
    if (method.GTP && componentInstance) {
      componentInstance.openWebview(method.GTP);
    } else {
      HUD.showToast('This payment option is unavailable.');
    }
  },

  /**
   * 关闭整个支付覆盖层并清理 DOM
   */
  close() {
    if (container) {
      render(null, container);
      document.body.removeChild(container);
      container = null;
      componentInstance = null;

      // 支付流结束，自动刷新用户信息（余额）
      const userStore = useUserStore();
      userStore.updateLoginUserInfo();

      // 执行外部传入的回调
      this.triggerCallback();
    }
  },

  triggerCallback() {
    if (onFinishedCallback) {
      onFinishedCallback();
      onFinishedCallback = null;
    }
  },

  clearCallback() {
    onFinishedCallback = null;
  },
};
