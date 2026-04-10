/**
 * 正式服 / App 内嵌 WebView 无 DevTools 时，用页面内控制台查看 log。
 * 默认开启；正式上线前在 .env.production 设置 VITE_DEBUG_CONSOLE=false 并重新打包即可关闭。
 */

import { logAppInitConfigForVConsole } from '@/utils/net/config'

let inited = false

function shouldEnableVConsole(): boolean {
  if (typeof window === 'undefined') return false
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
