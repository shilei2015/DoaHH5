/**
 * A0019Bridge.ts
 * 新版北京 App-H5 WebView Bridge 交互规范 (A0019)
 * 允许与原先的 iapBridge 并存
 */

import { paymentService } from "../tools/paymentService"
import { getNativeBridgeName } from "./nativeBridgeConfig"

export { getNativeBridgeName }

// ===================== 类型定义 =====================

/** App->Web 调试：弹窗展示字符串（与业务 type 0–11 区分） */
export const A0019_APP_DEBUG_ALERT_TYPE = 99

/** 发送消息到 App */
/** 统一的基础消息发送与接收泛型 */
export interface BridgeMessage<T = any> {
  type: number
  data?: T
}

/** 支付结果回到数据结构 */
export interface A0019PaymentResult {
  code: number // 0=成功；非0=失败错误码
  transactionId: string // Apple 交易 ID（成功时有值）
  uuid: string // 业务识别码（与 Web 发起时的 uuid 对应）
  /** 若 App 回传业务订单号，优先使用；否则用 Web 侧按 uuid 缓存的 orderNum */
  orderNum?: string
}

/** 定位结果回调数据结构 */
export interface A0019LocationResult {
  country: string
  ISOcountryCode: string
  administrativeArea: string
  subAdministrativeArea: string
  locality: string
  subLocality: string
  thoroughfare: string
  subThoroughfare: string
  postalCode: string
  name: string
  latitude: number
  longitude: number
  inlandWater: string
  ocean: string
  areasOfInterest: string[]
}

/** 权限检查结果 */
export interface A0019PermissionResult {
  isOpen: boolean
  getType: number // 0=通知, 1=相机, 2=相册, 3=麦克风
}

/**
 * Web->App type 8 请求体中的 `getType`（与 App->Web type 8 回调中的 `getType` 对应）
 * @see `.agents/doc/北京-App-H5 Bridge交互规范.md` §「Web->App type: 8 — 权限检查」
 */
export const A0019PermissionGetType = {
  Notification: 0,
  Camera: 1,
  PhotoLibrary: 2,
  Microphone: 3,
} as const

// ===================== 内部 Promise 管理器 =====================

type Resolver<T> = {
  resolve: (value: T) => void
  reject: (reason?: any) => void
}

/** Web 发起 type2 时缓存 uuid -> 业务订单号，供回调与验单接口对齐 */
const pendingA0019OrderByUuid = new Map<string, string>()
let locationResolver: Resolver<A0019LocationResult> | null = null
const permissionResolvers = new Map<number, Resolver<A0019PermissionResult>>()

// ===================== 核心通信机制 =====================

function getNativeMessageHandler(): { postMessage(message: unknown): void } | undefined {
  try {
    const name = getNativeBridgeName()
    const handlers = (window as unknown as { webkit?: { messageHandlers?: Record<string, { postMessage?: unknown }> } })
      .webkit?.messageHandlers
    const handler = handlers?.[name]
    if (handler && typeof handler.postMessage === 'function') {
      return handler as { postMessage(message: unknown): void }
    }
    return undefined
  } catch {
    return undefined
  }
}

/**
 * 判断当前 WebView 是否已注入桥（messageHandlers 名由 {@link getNativeBridgeName} 决定）
 */
export function isA0019Native(): boolean {
  return getNativeMessageHandler() !== undefined
}

/**
 * 底层发信核心方法
 * @param type 事件类型
 * @param data 附带的数据对象或字面量
 */
function sendToApp<T = any>(type: number, data?: T): void {
  const message: BridgeMessage<T> = { type, data }
  const name = getNativeBridgeName()
  // 必须在 handler 上调用 postMessage，不能拆成裸函数（否则 Safari 报 UserMessageHandler 绑定错误）
  const handler = getNativeMessageHandler()
  if (handler) {
    handler.postMessage(message)
    console.log(`[NativeBridge ${name}] -> 发送 type: ${type}`, data)
  } else {
    console.warn(`[NativeBridge ${name}] 未注入 messageHandlers.${name}，已忽略 type: ${type}`, data)
  }
}

/**
 * 生成简单的唯一识别码 UUID，用于回调匹配
 */
function generateUUID(): string {
  return 'uuid_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9)
}

/**
 * 全局挂载：接收 App 回传消息（属性名与 {@link getNativeBridgeName} 一致）
 */
;(function mountNativeBridgeCallback() {
  const name = getNativeBridgeName()
  ;(window as unknown as Record<string, unknown>)[name] = function (jsonString: string) {
  try {
    const msg: BridgeMessage = JSON.parse(jsonString)
    console.log(`[NativeBridge ${name}] <- 收到 App 回调 type: ${msg.type}`, msg.data)

    switch (msg.type) {
      case 2: // 支付回调
        {
          const data = msg.data as A0019PaymentResult
          if (!data?.uuid) {
            console.warn(`[NativeBridge ${name}] payment callback missing uuid`, data)
            paymentService.handleA0019NativePurchaseFailed()
            break
          }
          const orderFromNative =
            data.orderNum?.trim() ||
            (data as { OrderId?: string }).OrderId?.trim() ||
            (data as { orderId?: string }).orderId?.trim()
          const cachedOrder = pendingA0019OrderByUuid.get(data.uuid)
          pendingA0019OrderByUuid.delete(data.uuid)
          const orderId = orderFromNative || cachedOrder || ''

          if (data.code !== 0) {
            console.warn(`[NativeBridge ${name}] payment failed`, { code: data.code, uuid: data.uuid })
            paymentService.handleA0019NativePurchaseFailed()
            break
          }
          const transactionId = String(data.transactionId ?? '').trim()
          if (!orderId || !transactionId) {
            console.warn(`[NativeBridge ${name}] payment success but missing orderId or transactionId`, {
              orderId,
              transactionId,
              uuid: data.uuid,
            })
            paymentService.handleA0019NativePurchaseFailed()
            break
          }
          paymentService.runNativeA0019Purchase(orderId, transactionId)
          break
        }
      case 6: // 定位回调
        {
          const data = msg.data as A0019LocationResult
          if (locationResolver) {
            locationResolver.resolve(data)
            locationResolver = null
          }
        }
        break

      case 8: // 权限检查回调
        {
          const data = msg.data as A0019PermissionResult
          if (data && typeof data.getType === 'number') {
            if (permissionResolvers.has(data.getType)) {
              permissionResolvers.get(data.getType)!.resolve(data)
              permissionResolvers.delete(data.getType)
            }
          }
        }
        break

      case A0019_APP_DEBUG_ALERT_TYPE: {
        // App 调试：仅展示文本；用原生 alert，避免 WKWebView 内 Vant 函数式弹层不触发
        const raw = msg.data
        let text = ''
        if (typeof raw === 'string') {
          text = raw
        } else if (raw && typeof raw === 'object') {
          const o = raw as Record<string, unknown>
          text = String(o.text ?? o.message ?? JSON.stringify(raw))
        } else if (raw != null) {
          text = String(raw)
        }
        const line = text || '(empty)'
        if (typeof window !== 'undefined' && typeof window.alert === 'function') {
          window.alert(`Native Bridge ${name}\n\n${line}`)
        }
        break
      }
    }
  } catch (e) {
    console.error(`[NativeBridge ${name}] 解析 App 回调消息出错:`, e, '原字符串:', jsonString)
  }
  }
})()

// ===================== 业务能力导出 =====================

/**
 * type 0 - 关闭当前 Web 容器
 */
export function closeWebView(): void {
  sendToApp(0, {})
}

/**
 * type 1 - 打开新 Web 容器
 * @param url 要加载的链接，不传则加载默认首页
 * @param showNav 是否显示原生标题栏 1=显示 0=不显示
 */
export function openNewWebView(url?: string, showNav: 1 | 0 = 1): void {
  sendToApp(1, { url, isNeededNav: showNav })
}

/**
 * type 2 - 发起内购支付 (A0019版)
 * @param code 苹果内购商品 ID Identifier
 * @param orderNum 业务自有订单号
 */
export function requestA0019Purchase(code: string, orderNum?: string) {
  const uuid = generateUUID()
  if (orderNum?.trim()) {
    pendingA0019OrderByUuid.set(uuid, orderNum.trim())
  }
  sendToApp(2, { code:code, orderNum:orderNum, uuid:uuid })
}
/**
 * type 3 - 登出
 */
export function logoutApp(): void {
  sendToApp(3, {})
}

/**
 * type 4 - 设置角标
 * @param num 数字，0 表示清除
 */
export function setBadge(num: number): void {
  sendToApp(4, num) // 注意规范中 type4 数据直接传数字
}

/**
 * 将 H5 侧消息未读总数同步到原生（桌面/图标角标，与 {@link setBadge} 相同为 type 4）
 * 仅在已注入 WebView 桥时发送，浏览器调试环境静默跳过。
 */
export function syncMessageUnreadToNative(totalUnread: number): void {
  if (!isA0019Native()) return
  const n = Math.max(0, Math.floor(Number(totalUnread)) || 0)
  setBadge(n)
}

/**
 * type 5 - 触觉反馈 (震动)
 * @param level 震感: 0=系统默认, 1=轻, 2=中, 3=重
 * @param number 次数，默认 1
 */
export function triggerHaptic(level: 0 | 1 | 2 | 3 = 1, number: number = 1): void {
  sendToApp(5, { level, number })
}

/**
 * type 6 - 获取定位
 */
export function getLocation(): Promise<A0019LocationResult> {
  return new Promise((resolve, reject) => {
    if (!isA0019Native()) {
      return reject(new Error('This feature is unavailable.'))
    }
    if (locationResolver) {
      console.warn(`[NativeBridge ${getNativeBridgeName()}] getLocation called while a request is already in progress`)
      return reject(new Error('Please wait and try again.'))
    }
    locationResolver = { resolve, reject }
    sendToApp(6, {})
  })
}

/**
 * type 7 - 同步用户 Profile
 * @param profileUrl 字符串参数
 */
export function syncUserProfile(profileUrl: string): void {
  sendToApp(7, profileUrl) // 注意规范中 type7 数据直接传 string
}

/**
 * type 8 — 权限检查（Web->App），App 通过 App->Web type 8 回调 `{ isOpen, getType }`
 * 若未授权，App 可弹出系统授权；若已被拒绝，可配合 {@link openSystemSettings}（type 9）引导用户到设置
 * @param getType 见 {@link A0019PermissionGetType}
 * @see `.agents/doc/北京-App-H5 Bridge交互规范.md` §3 type 8 / §5 type 8
 */
export function checkPermission(
  getType: (typeof A0019PermissionGetType)[keyof typeof A0019PermissionGetType]
): Promise<A0019PermissionResult> {
  return new Promise((resolve, reject) => {
    if (!isA0019Native()) {
      return reject(new Error('This feature is unavailable.'))
    }
    permissionResolvers.set(getType, { resolve, reject })
    sendToApp(8, { getType })
  })
}

/**
 * type 9 - 打开系统设置引导用户赋权
 */
export function openSystemSettings(): void {
  sendToApp(9, {})
}

/**
 * type 10 - 请求 App Store 评价弹窗 (一次性)
 */
export function requestAppStoreReview(): void {
  sendToApp(10, {})
}

/**
 * type 11 - 隐藏全局加载指示器 (Loading)
 */
export function hideGlobalLoading(): void {
  sendToApp(11, {})
}
