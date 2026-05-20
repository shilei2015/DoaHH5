import { fileURLToPath, URL } from 'node:url'

import { defineConfig, type PluginOption } from 'vite'
import vue from '@vitejs/plugin-vue'
// import vueDevTools from 'vite-plugin-vue-devtools'

// 本地调试时，当 URL / 缓存里拿不到真实 ApiDomain 时使用的兜底后端
// 注意：这个域名一旦下线或被迁移，本地开发就会 404，
// 请以 Swift/Android 端传过来的 t= 参数解出的 ApiDomain 为准。
const FALLBACK_API_TARGET = 'http://vclub23.cookiegeeks.com'

/**
 * 动态 API 代理：根据请求头 x-dynamic-target 把 /api/** 转发到真实后端。
 *
 * 为什么要自己实现（不使用 server.proxy / http-proxy-middleware）：
 * 1. Vite 7 底层切换到 http-proxy-3，不再识别 `router` 选项，
 *    导致 request.ts 里塞的 `x-dynamic-target` 头被完全忽略，
 *    所有请求都会打到 fallback 目标上，造成"本地调试连不上服务器"。
 * 2. 真实 HTTPS 测试由外层可信域名/网关/Tunnel 负责 TLS 终止，Vite 本身保持 HTTP。
 *    这里用 Node 原生 fetch 简单做一层转发，既支持 router 语义，也避免代理库细节影响调试。
 */
function dynamicApiProxyPlugin(): PluginOption {
  return {
    name: 'dynamic-api-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.url || ''
        if (!rawUrl.startsWith('/api/') && rawUrl !== '/api') {
          return next()
        }

        try {
          const dyn = req.headers['x-dynamic-target']
          const targetBase =
            typeof dyn === 'string' && dyn.startsWith('http')
              ? dyn.replace(/\/+$/, '')
              : FALLBACK_API_TARGET

          // 剥掉 /api 前缀后拼到目标后端
          const forwardPath = rawUrl.replace(/^\/api/, '') || '/'
          const targetUrl = targetBase + forwardPath

          // 过滤 HTTP/2 伪头、hop-by-hop 头、host 头
          const headers: Record<string, string> = {}
          for (const [k, v] of Object.entries(req.headers)) {
            if (!v) continue
            const lower = k.toLowerCase()
            if (lower.startsWith(':')) continue
            if (lower === 'host') continue
            if (lower === 'connection') continue
            if (lower === 'content-length') continue // fetch 会自动补
            if (lower === 'x-dynamic-target') continue
            headers[k] = Array.isArray(v) ? v.join(',') : String(v)
          }

          const method = (req.method || 'GET').toUpperCase()
          const hasBody = method !== 'GET' && method !== 'HEAD'
          let body: Buffer | undefined
          if (hasBody) {
            const chunks: Buffer[] = []
            for await (const c of req) chunks.push(c as Buffer)
            body = Buffer.concat(chunks)
          }

          const upstream = await fetch(targetUrl, {
            method,
            headers,
            body,
            redirect: 'manual',
          })

          res.statusCode = upstream.status
          upstream.headers.forEach((value, key) => {
            const lower = key.toLowerCase()
            // 避免二次压缩 / 分块传输头污染
            if (lower === 'content-encoding') return
            if (lower === 'transfer-encoding') return
            if (lower === 'content-length') return
            try {
              res.setHeader(key, value)
            } catch {
              /* 忽略无法设置的非法头 */
            }
          })
          const buf = Buffer.from(await upstream.arrayBuffer())
          res.end(buf)
        } catch (err) {
          console.error('[dynamic-api-proxy] forward failed:', err)
          if (!res.headersSent) {
            res.statusCode = 502
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
          }
          res.end(
            JSON.stringify({
              code: -1,
              message: 'Bad Gateway (dev proxy)',
              detail: (err as Error)?.message,
            })
          )
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  assetsInclude: [
    'svga',
    'zz'
  ],
  plugins: [
    vue(),
    // vueDevTools(),
    dynamicApiProxyPlugin(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    host: '0.0.0.0', // 对齐 iOS 本地调试环境，允许局域网访问
    port: 5174,
    strictPort: true,
    // 注意：不要再配 server.proxy['/api']，
    // 动态路由已经在上面的 dynamicApiProxyPlugin 里处理。
  },
})
