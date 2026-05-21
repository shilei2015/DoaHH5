import { h, render, markRaw } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { API } from '@/utils/net/api';
import { post } from '@/utils/net/request';
import HUD from '@/components/HUD';
import PaymentOverlay, { type PMItem } from '@/components/common/PaymentOverlay.vue';
import { hideGlobalLoading, isA0019Native } from '@/utils/native/A0019Bridge';
import type { ProductModel } from '@/components/appModels/ProductModel';
import { NET_CONFIG } from '@/utils/net/config';

/** 服务端苹果验单（需 OrderId + TranscationId，与 api.ts 中 pay_apple_verify 一致） */
const ENABLE_APPLE_IAP_VERIFY_V2 = true;

/**
 * Global Payment Service (paymentService.ts)
 * 命令式支付服务。封装从商品下单到 Onerway Apple Pay SDK 渲染的全过程。
 */

const ONERWAY_SDK_URL = 'https://checkout-sdk.onerway.com/v3/';
const ONERWAY_ORIGIN = 'https://checkout-sdk.onerway.com';
const APPLE_PAY_CONTAINER_ID = 'pacypay_checkout';

type OnerwayEnvironment = 'sandbox' | 'production';

function getOnerwayEnvironmentOverride(): OnerwayEnvironment | null {
  const raw = String(import.meta.env.VITE_ONERWAY_ENV || '').trim().toLowerCase();
  if (raw === 'sandbox' || raw === 'production') return raw;
  return null;
}

interface BjCashierPreOrderData {
  TradeNo?: string;
  PayUrl?: string;
  MethodId?: string;
  OrderId?: string;
  transactionId?: string;
  redirectUrl?: string;
}

interface PacypayResult {
  respCode?: string;
  respMsg?: string;
  data?: {
    status?: string;
    [key: string]: unknown;
  };
}

interface PacypayOptions {
  container: string;
  locale: string;
  environment: OnerwayEnvironment;
  mode: 'ApplePay';
  redirectUrl: string;
  config: {
    applePayButtonType: string;
    applePayButtonColor: string;
    buttonWidth: string;
    buttonHeight: string;
    buttonRadius: string;
  };
  onPaymentCompleted: (res: PacypayResult) => void;
  onError: (err: unknown) => void;
}

type PacypayConstructor = new (transactionId: string, options: PacypayOptions) => unknown;

let container: HTMLElement | null = null;
let componentInstance: any = null;
let onFinishedCallback: (() => void) | null = null;
let pacypayInstance: unknown = null;
let onerwaySdkPromise: Promise<PacypayConstructor> | null = null;
let isOnerwayNetworkWarmed = false;

function hidePaymentLoading(): void {
  HUD.hideLoading();
  if (isA0019Native()) {
    hideGlobalLoading();
  }
}

function readNonEmptyString(data: Record<string, unknown> | undefined, keys: string[]): string | null {
  if (!data) return null;
  for (const key of keys) {
    const value = data[key];
    if (value === undefined || value === null) continue;
    const normalized = String(value).trim();
    if (normalized) return normalized;
  }
  return null;
}

function getPacypayConstructor(): PacypayConstructor | null {
  const maybeWindow = window as unknown as { Pacypay?: PacypayConstructor };
  return typeof maybeWindow.Pacypay === 'function' ? maybeWindow.Pacypay : null;
}

function appendResourceHint(rel: string, href: string, as?: string): void {
  const selector = as
    ? `link[rel="${rel}"][href="${href}"][as="${as}"]`
    : `link[rel="${rel}"][href="${href}"]`;

  if (document.querySelector(selector)) return;

  const link = document.createElement('link');
  link.rel = rel;
  link.href = href;
  if (as) link.as = as;
  if (rel === 'preconnect') link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

function warmOnerwayNetwork(): void {
  if (isOnerwayNetworkWarmed) return;
  isOnerwayNetworkWarmed = true;

  appendResourceHint('dns-prefetch', ONERWAY_ORIGIN);
  appendResourceHint('preconnect', ONERWAY_ORIGIN);
  appendResourceHint('preload', ONERWAY_SDK_URL, 'script');
}

function loadOnerwaySdk(): Promise<PacypayConstructor> {
  const existing = getPacypayConstructor();
  if (existing) return Promise.resolve(existing);

  warmOnerwayNetwork();

  if (!onerwaySdkPromise) {
    onerwaySdkPromise = new Promise<PacypayConstructor>((resolve, reject) => {
      const currentScript = document.querySelector<HTMLScriptElement>(`script[src="${ONERWAY_SDK_URL}"]`);
      const script = currentScript || document.createElement('script');

      script.onload = () => {
        const Pacypay = getPacypayConstructor();
        if (Pacypay) {
          resolve(Pacypay);
          return;
        }
        reject(new Error('Onerway SDK loaded without Pacypay'));
      };
      script.onerror = () => reject(new Error('Unable to load Onerway SDK'));

      if (!currentScript) {
        script.src = ONERWAY_SDK_URL;
        script.async = true;
        document.head.appendChild(script);
      }
    }).catch((error) => {
      onerwaySdkPromise = null;
      throw error;
    });
  }

  return onerwaySdkPromise as Promise<PacypayConstructor>;
}

function getOnerwayLocale(): string {
  const language = (NET_CONFIG.DeviceLanguage || navigator.language || 'en').trim();
  if (/^zh[-_]?tw/i.test(language)) return 'zh-TW';
  if (/^zh/i.test(language)) return 'zh';
  return language.split(/[-_]/)[0] || 'en';
}

function getOnerwayEnvironment(redirectUrl: string): OnerwayEnvironment {
  const ONERWAY_ENVIRONMENT_OVERRIDE = getOnerwayEnvironmentOverride();
  if (ONERWAY_ENVIRONMENT_OVERRIDE) return ONERWAY_ENVIRONMENT_OVERRIDE;
  if (/sandbox|test/i.test(redirectUrl) || !NET_CONFIG.releaseVersion) return 'sandbox';
  return 'production';
}

function normalizeApplePayOrder(data: BjCashierPreOrderData | undefined) {
  const record = data as Record<string, unknown> | undefined;
  const transactionId = readNonEmptyString(record, ['TradeNo', 'tradeNo', 'transactionId']);
  const redirectUrl = readNonEmptyString(record, ['PayUrl', 'payUrl', 'redirectUrl']);
  const orderId = readNonEmptyString(record, ['OrderId', 'orderId']);
  const methodId = readNonEmptyString(record, ['MethodId', 'methodId']);

  if (!transactionId || !redirectUrl) return null;

  return {
    transactionId,
    redirectUrl,
    orderId,
    methodId,
  };
}

function formatApplePayPrice(product: ProductModel): string {
  const showPrice = String(product.ShowPrice || '').trim();
  if (showPrice) return showPrice;

  const applePrice = String(product.ApplePrice || '').trim();
  if (!applePrice) return '';
  return applePrice.startsWith('$') ? applePrice : `$${applePrice}`;
}

function normalizeErrorForLog(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  if (error && typeof error === 'object') {
    try {
      return JSON.parse(JSON.stringify(error));
    } catch {
      return String(error);
    }
  }

  return error;
}

function getApplePayRuntimeStatus() {
  const ApplePaySessionCtor = (window as unknown as {
    ApplePaySession?: {
      canMakePayments?: () => boolean;
      supportsVersion?: (version: number) => boolean;
    };
  }).ApplePaySession;

  return {
    hasApplePaySession: Boolean(ApplePaySessionCtor),
    canMakePayments: Boolean(ApplePaySessionCtor?.canMakePayments?.()),
    supportsVersion3: Boolean(ApplePaySessionCtor?.supportsVersion?.(3)),
    protocol: window.location.protocol,
    host: window.location.host,
    userAgent: navigator.userAgent,
  };
}

function canUseApplePayRuntime() {
  const status = getApplePayRuntimeStatus();
  return status.hasApplePaySession && status.supportsVersion3 && status.canMakePayments;
}

export const paymentService = {
  /**
   * 提前加载 Onerway SDK，减少用户点购买后等待 Apple Pay 按钮的时间。
   */
  preloadApplePaySdk() {
    loadOnerwaySdk()
      .then(() => console.log('[Payment] Onerway Apple Pay SDK preloaded', { sdkUrl: ONERWAY_SDK_URL }))
      .catch((error) => console.warn('[Payment] Onerway Apple Pay SDK preload failed', normalizeErrorForLog(error)));
  },

  /**
   * 启动支付流程
   * @param productId
   * @param onFinished 支付流程结束（关闭弹窗或原生流程结束）后的回调
   */
  async startPayment(product: ProductModel, onFinished?: () => void) {
    onFinishedCallback = onFinished || null;
    const productId = product.ProductId;

    if (!canUseApplePayRuntime()) {
      hidePaymentLoading();
      console.warn('[Payment] Apple Pay runtime unavailable', getApplePayRuntimeStatus());
      HUD.showToast('Apple Pay is unavailable. Please try again later.');
      this.clearCallback();
      return;
    }

    const sdkPromise = loadOnerwaySdk().catch((error) => {
      console.warn('[Payment] Onerway Apple Pay SDK warmup failed', normalizeErrorForLog(error));
      return null;
    });

    this.mountApplePayOverlay(formatApplePayPrice(product));

    try {
      const res = await post(API.bj_cashier_pre_order, { ProductId: productId });

      if (String(res.code) !== '0' || !res.data) {
        hidePaymentLoading();
        this.close(false);
        console.warn('[Payment] bjCashierPreOrder rejected', res.code, res.data);
        HUD.showToast('Unable to start payment. Please try again.');
        this.clearCallback();
        return;
      }

      const applePayOrder = normalizeApplePayOrder(res.data as BjCashierPreOrderData);
      if (!applePayOrder) {
        hidePaymentLoading();
        this.close(false);
        console.warn('[Payment] bjCashierPreOrder missing TradeNo or PayUrl', res.data);
        HUD.showToast('Something went wrong. Please try again.');
        this.clearCallback();
        return;
      }

      console.log('[Payment] bjCashierPreOrder Apple Pay payload', {
        productId,
        transactionId: applePayOrder.transactionId,
        redirectUrl: applePayOrder.redirectUrl,
        orderId: applePayOrder.orderId,
        methodId: applePayOrder.methodId,
        sdkUrl: ONERWAY_SDK_URL,
        applePayRuntime: getApplePayRuntimeStatus(),
      });

      hidePaymentLoading();
      await this.renderApplePaySdk(applePayOrder, sdkPromise);
    } catch (error) {
      hidePaymentLoading();
      this.close(false);
      console.error('[Payment] startPayment', error);
      HUD.showToast('Unable to connect. Please try again.');
      this.clearCallback();
    }
  },

  /**
   * A0019 原生支付失败或参数不全时由 Bridge 调用，清理 onFinished 等状态
   */
  handleA0019NativePurchaseFailed(message = 'Payment could not be completed. Please try again.') {
    hidePaymentLoading();
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
        hidePaymentLoading();

        if (String(verifyRes.code) === '0') {
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

      hidePaymentLoading();
      const userStore = useUserStore();
      await userStore.updateLoginUserInfo();
      HUD.showToast('Payment successful');
      this.triggerCallback();
    } catch (e: unknown) {
      hidePaymentLoading();
      console.error('[Payment] native purchase', e);
      HUD.showToast('Payment could not be completed. Please try again.');
      this.clearCallback();
    }
  },

  /**
   * 打开支付面板 (命令式挂载)
   */
  openOverlay(methods: PMItem[], productId: string, initialMethod?: PMItem) {
    hidePaymentLoading();
    // 1. Cleanup previous instance
    this.close(false);

    if (initialMethod && !initialMethod.GTP) {
      HUD.showToast('This payment option is unavailable.');
      return;
    }

    // 2. Build Container
    container = document.createElement('div');
    document.body.appendChild(container);

    // 3. Render the Component
    const vnode = h(markRaw(PaymentOverlay), {
      paymentMethods: methods,
      initialWebviewUrl: initialMethod?.GTP || '',
      onSelect: (method: PMItem) => this.handleSelectMethod(method, productId),
      onClose: () => this.close(),
    });

    render(vnode, container);
    // Capture the instance (to call exposed methods like openWebview later)
    componentInstance = vnode.component?.exposed;
  },

  /**
   * 先打开 Apple Pay 面板，让预下单和 SDK 加载期间也有明确的 loading 态。
   */
  mountApplePayOverlay(price = '') {
    this.close(false);

    container = document.createElement('div');
    document.body.appendChild(container);

    const vnode = h(markRaw(PaymentOverlay), {
      applePayContainerId: APPLE_PAY_CONTAINER_ID,
      applePayPrice: price,
      onApplePayUnavailable: () => {
        this.close(false);
        HUD.showToast('Apple Pay is unavailable. Please try again later.');
        this.clearCallback();
      },
      onClose: () => this.close(),
    });

    render(vnode, container);
    componentInstance = vnode.component?.exposed;
  },

  /**
   * 打开 Onerway Apple Pay SDK 容器并渲染 Apple Pay 按钮
   */
  async openApplePayOverlay(order: {
    transactionId: string;
    redirectUrl: string;
    orderId: string | null;
    methodId: string | null;
    price?: string;
  }) {
    this.mountApplePayOverlay(order.price || '');
    await this.renderApplePaySdk(order);
  },

  async renderApplePaySdk(order: {
    transactionId: string;
    redirectUrl: string;
    orderId: string | null;
    methodId: string | null;
    price?: string;
  }, sdkPromise?: Promise<PacypayConstructor | null>) {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    if (!document.getElementById(APPLE_PAY_CONTAINER_ID)) return;

    try {
      console.log('[Payment] loading Onerway Apple Pay SDK', {
        sdkUrl: ONERWAY_SDK_URL,
        redirectUrl: order.redirectUrl,
        transactionId: order.transactionId,
      });

      const Pacypay = (await sdkPromise) || await loadOnerwaySdk();
      if (!document.getElementById(APPLE_PAY_CONTAINER_ID)) return;

      console.log('[Payment] initializing Onerway Apple Pay popup', {
        container: APPLE_PAY_CONTAINER_ID,
        environment: getOnerwayEnvironment(order.redirectUrl),
        locale: getOnerwayLocale(),
        redirectUrl: order.redirectUrl,
        transactionId: order.transactionId,
      });

      pacypayInstance = new Pacypay(order.transactionId, {
        container: APPLE_PAY_CONTAINER_ID,
        locale: getOnerwayLocale(),
        environment: getOnerwayEnvironment(order.redirectUrl),
        mode: 'ApplePay',
        redirectUrl: order.redirectUrl,
        config: {
          applePayButtonType: 'plain',
          applePayButtonColor: 'black',
          buttonWidth: '100%',
          buttonHeight: '44px',
          buttonRadius: '8px',
        },
        onPaymentCompleted: async (result: PacypayResult) => {
          console.log('[Payment] Onerway Apple Pay completed', {
            orderId: order.orderId,
            methodId: order.methodId,
            result,
          });

          if (result.respCode === '20000' && result.data?.status === 'S') {
            const userStore = useUserStore();
            await userStore.updateLoginUserInfo();
            HUD.showToast('Payment successful');
            this.close();
            return;
          }

          if (result.respCode === '20000') {
            HUD.showToast('Payment is processing. Please check again later.');
            return;
          }

          HUD.showToast(result.respMsg || 'Payment could not be completed. Please try again.');
        },
        onError: (error: unknown) => {
          console.warn('[Payment] Onerway Apple Pay error', {
            error: normalizeErrorForLog(error),
            redirectUrl: order.redirectUrl,
            transactionId: order.transactionId,
            applePayRuntime: getApplePayRuntimeStatus(),
          });
          this.close(false);
          HUD.showToast('Payment could not be completed. Please try again.');
          this.clearCallback();
        },
      });
    } catch (error) {
      console.error('[Payment] Onerway SDK init failed', error);
      this.close(false);
      HUD.showToast('Unable to start Apple Pay. Please try again.');
      this.clearCallback();
    }
  },

  /**
   * 处理支付渠道选择
   */
  handleSelectMethod(method: PMItem, productId: string) {
    hidePaymentLoading();
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
  close(shouldTriggerCallback = true) {
    if (container) {
      render(null, container);
      document.body.removeChild(container);
      container = null;
      componentInstance = null;
      pacypayInstance = null;

      if (shouldTriggerCallback) {
        // 支付流结束，自动刷新用户信息（余额）
        const userStore = useUserStore();
        userStore.updateLoginUserInfo();

        // 执行外部传入的回调
        this.triggerCallback();
      }
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
