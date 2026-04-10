/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 设为 `false` 时关闭 VConsole；不设或其它值则默认开启 */
  readonly VITE_DEBUG_CONSOLE?: string
  /** 原生 WebView 桥标识（iOS messageHandlers 名、window 回调名），默认 A0019 */
  readonly VITE_NATIVE_BRIDGE_NAME?: string
  /** 可选：Android 与 iOS 使用不同桥名时设置；未设则与 VITE_NATIVE_BRIDGE_NAME 相同 */
  readonly VITE_NATIVE_BRIDGE_ANDROID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
