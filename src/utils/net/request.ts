/**
 * request.ts
 * 封装 Axios 请求，处理拦截器、统一头部修饰及 AES/MD5 加密解密逻辑
 */

import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios'
import { NET_CONFIG, STORAGE_KEYS } from './config'
import { getApiUrl } from './api'
import { encryptAES, decryptAES, getUdid, createSiginString } from './encryption'
import { useUserStore } from '@/stores/userStore'
import loginedMissions from '../loginedMissions'

// 用于取消所有请求的控制器集合
const pendingRequests = new Set<AbortController>()

// 假设我们默认都是加密请求（Swift 中 isEncrypt 默认为 true）
const DEFAULT_ENCRYPT = true

const service: AxiosInstance = axios.create({
  baseURL: NET_CONFIG.HOSTROOT,
  timeout: 15000 // 15s timeout
})

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 1. 处理请求取消控制器
    const abortController = new AbortController()
    config.signal = abortController.signal
    pendingRequests.add(abortController);
    (config as any)._abortController = abortController

    // 约定 config.meta?.isEncrypt 来控制单次请求是否加密，默认为 true
    const isEncrypt = (config as any).meta?.isEncrypt ?? DEFAULT_ENCRYPT

    // 1. 生成 Nonce
    const nonce = '902' // Swift 中写死了 902，如果有随机需要可换成随机字符串

    // 2. 如果是加密开启，我们要对 params/data 中的每个 value 进行 AES 加密，key 也要加密
    // Swift 中是将 GET params(或POST中) 进行了转化: key.aes = value.aes
    let transParams: Record<string, any> = {}

    // axios 默认 POST 数据在 data 中，GET 数据在 params 中
    // 这里以统一处理 config.data 充当业务请求体为例：
    let originParams = (config.method?.toUpperCase() === 'GET' ? config.params : config.data) || {}

    if (isEncrypt) {
      for (const key in originParams) {
        if (Object.prototype.hasOwnProperty.call(originParams, key)) {
          const val = String(originParams[key]).trim() // delBlank
          transParams[encryptAES(key)] = encryptAES(val)
        }
      }
    } else {
      transParams = { ...originParams }
    }

    if (config.method?.toUpperCase() === 'GET') {
      config.params = transParams
    } else {
      config.data = transParams
    }

    // 保存原始未加密参数用于响应阶段的日志打印
    (config as any)._originParams = originParams

    // 3. 构建 Headers
    const udid = getUdid()
    const signature = createSiginString(transParams, nonce, isEncrypt)
    const systemLanguage = navigator.language || 'en'
    const fromDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'WebMobile' : 'WebPC'
    const deviceVersion = navigator.appVersion || "Unknown"

    // 辅助获取国家代码
    const getCCode = () => {
      try {
        const lang = navigator.language;
        if (lang && lang.includes('-')) {
          const parts = lang.split('-');
          if (parts.length > 1) return (parts[1] as string).toUpperCase();
        }
        return 'US';
      } catch { return 'CN'; }
    }

    try {
      if (config.headers) {
        config.headers.set('DeviceLanguage', systemLanguage)
        config.headers.set('Language', NET_CONFIG.Language)
        config.headers.set('Nonce', nonce)
        config.headers.set('Version', NET_CONFIG.VERSION)
        config.headers.set('Udid', udid)
        config.headers.set('AppId', NET_CONFIG.ID)
        config.headers.set('Signature', signature)
        config.headers.set('VPN', '0')
        config.headers.set('FromDevice', fromDevice)
        config.headers.set('DeviceVersion', deviceVersion)
        config.headers.set('OS', '101')
        config.headers.set('LocalCCode', NET_CONFIG.LocalCCode)
        config.headers.set('UIV', NET_CONFIG.UIV)

        if (isEncrypt) {
          config.headers.set('IV', 'v2')
        }

        const userStore = useUserStore()
        if (userStore.token && userStore.token.length > 0) {
          config.headers.set('Token', userStore.token)
        }

        // 仅在 Vite 本地开发环境下，给本地反向代理服务器动态投喂目标域名，规避 CORS 问题
        if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) {
          if (NET_CONFIG.APIHOST) {
            config.headers.set('x-dynamic-target', NET_CONFIG.APIHOST)
          }
        }
      }
    } catch (headerError) {
      console.error("[RequestInterceptor] Header setup failed:", headerError);
    }

    return config
  },
  (error: any) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    // config 中拿到当时的 isEncrypt
    const isEncrypt = (response.config as any).meta?.isEncrypt ?? DEFAULT_ENCRYPT

    let resData = response.data

    // 尝试进行 AES 解密 （Swift代码中是把整个data用UTF8转String之后AES解密成JSON字符串）
    if (isEncrypt && typeof resData === 'string') {
      try {
        const decryptedStr = decryptAES(resData)
        if (decryptedStr) {
          resData = JSON.parse(decryptedStr)
        }
      } catch (err) {
        console.error('Response decryption failed.', err)
      }
    }

    // 格式化打印日志 (仅相对路径、参数、响应结果)
    const config = response.config

    // 优先读取我们在发起请求时存入的未加密原始真实路径
    let path = (config as any).meta?.originalPath
    if (!path) {
      const fullUrl = config.url || ''
      const baseURL = config.baseURL || ''
      path = fullUrl.startsWith(baseURL) ? fullUrl.substring(baseURL.length) : fullUrl
    }

    // 提取参数 (优先真实传递下去的未加密参数 _originParams)
    let reqData = (config as any)._originParams
    if (!reqData) {
      reqData = config.data
      if (typeof reqData === 'string') {
        try { reqData = JSON.parse(reqData) } catch { }
      }
      if (!reqData) reqData = config.params
    }

    console.log(`🚀 [API Success] ${path}\n ├── Headers:`, config.headers, `\n ├── Params:`, reqData, `\n └── Result:`, resData)

    // 从待处理集合中移除
    if ((config as any)._abortController) {
      pendingRequests.delete((config as any)._abortController)
    }

    if (resData && typeof resData === 'object' && resData.code !== undefined) {
      // 这里的结构是 { code: Int/String, data: Any, toast: String }
      const code = Number(resData.code)

      // 处理登录失效或未登录
      if (code === 1) {
        console.error('[API] Login invalid (code 1), logging out...')

        // 1. 取消所有正在进行的请求
        pendingRequests.forEach(ctrl => ctrl.abort())
        pendingRequests.clear()

        // 2. 清除状态
        const userStore = useUserStore()
        userStore.logout()
        loginedMissions.stop()

        // 3. 关闭 Web 容器，不跳转 H5 路由（避免循环依赖，动态导入桥接）
        void import('@/utils/native/A0019Bridge').then(({ closeWebView }) => closeWebView())

        // 返回一个永远 pending 的 promise，防止后续业务处理继续执行
        return new Promise(() => { })
      }

      // 请求成功
      return resData
    }
  },
  (error: any) => {
    // 处理请求取消的情况
    if (error.name === 'CanceledError' || error.name === 'AbortError') {
      console.warn('[API] Request canceled:', error.config?.url)
      return new Promise(() => { }) // 返回 pending 状态
    }

    // 从集合中移除
    if (error.config && error.config._abortController) {
      pendingRequests.delete(error.config._abortController)
    }

    console.error('Network Error:', error)
    return Promise.reject(error)
  }
)

/**
 * 封装后的核心请求方法
 */

export function post<T = any>(
  apiEndpoint: string,
  data?: any,
  isEncrypt: boolean = DEFAULT_ENCRYPT
): Promise<any> {
  const url = getApiUrl(apiEndpoint, isEncrypt)

  return service.request({
    url,
    method: 'post',
    data,
    meta: { isEncrypt, originalPath: apiEndpoint }
  } as InternalAxiosRequestConfig & { meta: any })
}

export function get<T = any>(
  apiEndpoint: string,
  params?: any,
  isEncrypt: boolean = DEFAULT_ENCRYPT
): Promise<any> {
  const url = getApiUrl(apiEndpoint, isEncrypt)
  return service.request({
    url,
    method: 'get',
    params,
    meta: { isEncrypt, originalPath: apiEndpoint }
  } as InternalAxiosRequestConfig & { meta: any })
}

export default service
