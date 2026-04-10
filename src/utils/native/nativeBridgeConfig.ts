/**
 * 原生 WebView 桥「标识名」配置（iOS WK messageHandlers 名称、window 回调属性名需与 App 一致）
 *
 * 优先级：
 * 1. window.__NATIVE_BRIDGE_NAME__（由 config.ts 从 URL 的 Bundle / t 解码里的 Bundle 写入，或缓存）
 * 2. Android：VITE_NATIVE_BRIDGE_ANDROID（可选，与 iOS 不同名时）
 * 3. VITE_NATIVE_BRIDGE_NAME
 * 4. 默认 B0008
 */

function readWindowOverride(): string | undefined {
  try {
    if (typeof window === 'undefined') return undefined
    const w = (window as unknown as { __NATIVE_BRIDGE_NAME__?: unknown }).__NATIVE_BRIDGE_NAME__
    if (typeof w === 'string' && w.trim()) return w.trim()
  } catch {
    /* ignore */
  }
  return undefined
}

function isAndroidUa(): boolean {
  return typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)
}

/**
 * 当前应使用的桥标识（与 App 注入的 messageHandlers 名、evaluateJavascript 调用的 window 属性名一致）
 */
export function getNativeBridgeName(): string {
  const fromWindow = readWindowOverride()
  if (fromWindow) return fromWindow

  const androidName = import.meta.env.VITE_NATIVE_BRIDGE_ANDROID
  if (isAndroidUa() && typeof androidName === 'string' && androidName.trim()) {
    return androidName.trim()
  }

  const name = import.meta.env.VITE_NATIVE_BRIDGE_NAME
  if (typeof name === 'string' && name.trim()) return name.trim()

  return 'B0008'
}
