/**
 * 正式服 / App 内嵌 WebView 无 DevTools 时，用页面内控制台查看 log。
 * - 生产包（npm run build）默认不加载 VConsole，不打日志面板。
 * - 生产环境若需临时调试，构建前设 VITE_DEBUG_CONSOLE=true。
 * - 开发环境默认开启；本地可设 VITE_DEBUG_CONSOLE=false 关闭。
 */

import { logAppInitConfigForVConsole } from '@/utils/net/config'

let inited = false

function shouldEnableVConsole(): boolean {
  if (typeof window === 'undefined') return false
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_DEBUG_CONSOLE === 'true'
  }
  return import.meta.env.VITE_DEBUG_CONSOLE !== 'false'
}

export function initOptionalVConsole(): void {
  if (inited) return
  if (!shouldEnableVConsole()) return
  inited = true

  void import('vconsole').then(({ default: VConsole }) => {
    new VConsole({ theme: 'dark' })
    logAppInitConfigForVConsole()
  })
}
