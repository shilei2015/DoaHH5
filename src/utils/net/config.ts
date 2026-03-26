/**
 * config.ts
 * 网络请求全局配置
 */

// 测试环境与正式环境控制开关
export const NET_CONFIG = {
  releaseVersion: false,

  // HOST 基础配置
  get HOSTROOT() {
    // Vite 开发环境下走本地代理解决浏览器 CORS 跨域问题
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) {
      return '/api/client/'
    }

    const head = this.releaseVersion ? 'https' : 'http'
    // 若不同环境域名不同，可在此修改
    const name = this.releaseVersion ? 'api.momofu' : 'vclub23.cookiegeeks'
    const end = this.releaseVersion ? '.store' : '.com'
    const customPath = 'client'
    return `${head}://${name}${end}/${customPath}/`
  },

  get KEY() {
    return this.releaseVersion
      ? 'DFF904182066F07FE9ABA02294D82E4C'
      : 'BCDCF2E69B7894B08879C14B564DA0E4'
  },

  get SWID() {
    return this.releaseVersion
      ? '8479326d5cd8417eb0c81175ebebe43f'
      : 'a80d13923822432cad427f4ce5d186e5'
  },

  ID: '1034',
  VERSION: '1.0.0', // TODO: 可替换为项目的动态版本号
}

// 本地设备缓存常量
export const STORAGE_KEYS = {
  UDID: 'APP_UDID',
  TOKEN: 'APP_TOKEN'
}
