/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 生产：仅 `true` 时注入 VConsole；开发：未设 `false` 时默认开启 */
  readonly VITE_DEBUG_CONSOLE?: string
  /** 原生 WebView 桥标识（iOS messageHandlers 名、window 回调名），默认 A0019 */
  readonly VITE_NATIVE_BRIDGE_NAME?: string
  /** 可选：Android 与 iOS 使用不同桥名时设置；未设则与 VITE_NATIVE_BRIDGE_NAME 相同 */
  readonly VITE_NATIVE_BRIDGE_ANDROID?: string
  /**
   * 仅本地 dev 使用：在没有通过 URL `?t=...` 或 localStorage 注入配置时，
   * 用这些值填充 NET_CONFIG，使本地浏览器也能联通测试服。
   * 建议写在 `.env.development.local`（默认已 gitignore）。
   */
  readonly VITE_DEV_APP_ID?: string
  readonly VITE_DEV_APP_KEY?: string
  readonly VITE_DEV_API_HOST?: string
  readonly VITE_DEV_AGORA_APP_ID?: string
  readonly VITE_DEV_LOCAL_CCODE?: string
  readonly VITE_DEV_LANGUAGE?: string
  readonly VITE_DEV_UIV?: string
  readonly VITE_DEV_AD_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
