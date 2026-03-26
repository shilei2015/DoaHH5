import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  assetsInclude: [
    'svga',
    'zz'
  ],
  plugins: [
    vue(),
    vueDevTools(),
    basicSsl(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    host: true, // 允许局域网访问
    proxy: {
      // 本地开发代理，避免浏览器跨域（OPTIONS预检报错 404或 Network Error）
      '/api': {
        target: 'http://vclub23.cookiegeeks.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
