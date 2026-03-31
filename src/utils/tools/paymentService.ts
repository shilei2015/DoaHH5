import { h, render, markRaw } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { API } from '@/utils/net/api';
import { post } from '@/utils/net/request';
import HUD from '@/components/HUD';
import PaymentOverlay, { type PMItem } from '@/components/common/PaymentOverlay.vue';

/**
 * Global Payment Service (paymentService.ts)
 * 命令式支付服务。封装了从请求 API 到弹出支付列表、再到 Webview 支付的全过程。
 */

let container: HTMLElement | null = null;
let componentInstance: any = null;
let onFinishedCallback: (() => void) | null = null;

export const paymentService = {
  /**
   * 启动支付流程
   * @param productId 
   * @param onFinished 支付流程结束（关闭弹窗）后的回调
   */
  async startPayment(productId: string, onFinished?: () => void) {
    onFinishedCallback = onFinished || null;
    HUD.showLoading();
    try {
      const res = await post(API.pay, { ProductId: productId });
      HUD.hideLoading();

      if (res.code === '0' && res.data.PM?.MList?.length > 0) {
        this.openOverlay(res.data.PM.MList, productId);
      } else {
        HUD.showToast(res.data?.toast || 'Failed to initialize payment');
        // If API fails, trigger callback immediately if needed
        this.clearCallback();
      }
    } catch (error) {
      HUD.hideLoading();
      HUD.showToast('Network Error');
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
      onClose: () => this.close()
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
      HUD.showToast('Invalid Payment Link');
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
  }
};
