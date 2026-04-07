/**
 * iapBridge.ts
 * Web 与 iOS 原生之间的通信桥梁
 *
 * 功能 1: requestPurchase(productId)    -> 把内购商品 ID 传给 iOS 原生
 * 功能 2: iOS 调用 window.onIAPResult   -> 接收原生传回的支付结果和票据
 * 功能 3: finishTransaction(tid)        -> 通知原生应用验单成功
 * 功能 4: iOS 调用 window.onNativeUdid  -> 接收原生传过来的设备 UDID
 */

// ===================== 类型定义 =====================

/** 支付成功的结果 */
export interface IAPSuccessResult {
  success: true
  transactionId: string    // 苹果交易 ID
  receipt: string          // Base64 编码的票据数据
  productId: string        // 苹果内购商品 ID
}

/** 支付失败的结果 */
export interface IAPFailureResult {
  success: false
  error: string            // "cancelled" = 用户取消, 其他 = 失败原因
}

/** 支付结果（成功或失败） */
export type IAPResult = IAPSuccessResult | IAPFailureResult

// ===================== 内部状态 =====================

type PendingResolver = {
  resolve: (result: IAPSuccessResult) => void
  reject: (error: Error) => void
}

// 当前正在进行的购买 Promise（同一时间只允许一笔）
let pendingPurchase: PendingResolver | null = null

// ===================== 对外接口 =====================

/**
 * 判断当前是否运行在 iOS WKWebView 环境中
 */
export function isIOSNative(): boolean {
  return !!(window as any).webkit?.messageHandlers?.requestIAPPurchase
}

/**
 * 功能 1：发起内购请求
 * 将苹果内购商品 ID 传递给 iOS 原生，由原生发起 StoreKit 支付流程。
 * 返回一个 Promise：
 *   - 支付成功 → resolve，携带 transactionId + receipt 票据
 *   - 用户取消或失败 → reject
 *
 * @param productId  苹果内购商品 ID（例如 "com.momofu.coins.100"）
 */
export function requestPurchase(productId: string): Promise<IAPSuccessResult> {
  return new Promise((resolve, reject) => {
    if (!isIOSNative()) {
      reject(new Error('当前不在 iOS WebView 环境中'))
      return
    }

    // 同一时间只允许一笔购买
    if (pendingPurchase) {
      reject(new Error('已有一笔购买正在进行中'))
      return
    }

    pendingPurchase = { resolve, reject }

    // Web -> iOS：把商品 ID 发给原生
    ;(window as any).webkit.messageHandlers.requestIAPPurchase.postMessage(productId)
    console.log('[IAPBridge] -> iOS: 发起购买', productId)
  })
}

/**
 * 功能 3：通知原生验单成功
 * 后端验证票据成功后，调用此方法通知 iOS 原生可以安全地调用 transaction.finish()
 *
 * @param transactionId  从购买结果中拿到的苹果交易 ID
 */
export function finishTransaction(transactionId: string): void {
  if (!isIOSNative()) return

  // Web -> iOS：通知原生完成交易
  ;(window as any).webkit.messageHandlers.finishIAPTransaction.postMessage(transactionId)
  console.log('[IAPBridge] -> iOS: 验单成功，完成交易', transactionId)
}

// ===================== 功能 2：接收原生回调 =====================

/**
 * iOS 原生在 StoreKit 支付流程结束后，调用 window.onIAPResult(jsonString)
 * 将支付结果回传给 Web 端。
 *
 * iOS 端需要传入的 JSON 格式：
 *
 * 支付成功：
 * {
 *   "success": true,
 *   "transactionId": "123456",
 *   "receipt": "MIIT...base64编码的票据...",
 *   "productId": "com.momofu.coins.100"
 * }
 *
 * 支付失败/取消：
 * {
 *   "success": false,
 *   "error": "cancelled"
 * }
 */
;(window as any).onIAPResult = (jsonString: string) => {
  console.log('[IAPBridge] <- iOS: 收到支付结果', jsonString)

  let result: IAPResult

  // 解析 iOS 传过来的数据（兼容字符串和对象两种形式）
  try {
    result = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString
  } catch {
    pendingPurchase?.reject(new Error('iOS 返回的支付结果格式错误'))
    pendingPurchase = null
    return
  }

  // 没有正在等待的购买流程，忽略
  if (!pendingPurchase) {
    console.warn('[IAPBridge] 收到支付结果但没有正在等待的购买请求，已忽略')
    return
  }

  const { resolve, reject } = pendingPurchase
  pendingPurchase = null

  if (result.success) {
    // 支付成功，返回票据信息
    resolve(result as IAPSuccessResult)
  } else {
    // 用户取消或支付失败
    reject(new Error((result as IAPFailureResult).error || '支付失败'))
  }
}

// ===================== 功能 4：接收原生 UDID =====================

// 缓存原生传入的 UDID
let nativeUdid: string | null = null

/**
 * 获取原生传过来的 UDID
 * 如果原生还没传（比如在浏览器环境），返回 null
 */
export function getNativeUdid(): string | null {
  return nativeUdid
}

/**
 * iOS 原生在 WebView 加载完成后，调用 window.onNativeUdid(udid) 传入设备唯一标识。
 * Web 端收到后仅保存在内存中，不存入 localStorage。
 * 后续所有 API 请求会从内存中读取这个值作为 Udid。
 *
 * iOS 端调用示例：
 *   webView.evaluateJavaScript("window.onNativeUdid('xxxx-device-uuid')")
 */
;(window as any).onNativeUdid = (udid: string) => {
  if (!udid || typeof udid !== 'string') {
    console.warn('[IAPBridge] 收到的 UDID 无效，已忽略')
    return
  }

  nativeUdid = udid
  // 同时挂到 window 上，供 encryption.ts 的 getUdid 直接读取
  ;(window as any).__nativeUdid = udid
  console.log('[IAPBridge] <- iOS: 收到 UDID', udid)
}
