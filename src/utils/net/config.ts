/**
 * config.ts
 * 网络请求全局配置
 */

// 测试环境与正式环境控制开关
const isReleaseVersion = true;

export const NET_CONFIG = {
  releaseVersion: isReleaseVersion,

  // HOST 基础配置
  get HOSTROOT() {
    // 强制走本地代理解决浏览器跨域，不管有没有配置，我们在 request 里通过 header 通知代理真实的去处
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) {
      return '/api/client/'
    }

    let host = this.APIHOST;
    if (host) {
      // 确保从后端拿到的 ApiDomain 下面拼接了 '/client/'
      if (!host.endsWith('/')) {
        host += '/';
      }
      if (!host.endsWith('/client/')) {
        host += 'client/';
      }
      return host;
    }
    
    return '';
  },

  // 

  APIHOST: "",

  ppUrl: "https://www.momofu.store/a1/pp.html?bg=2",
  tsUrl: "https://www.momofu.store/a1/tos.html?bg=2",

  KEY: '',

  SWID: '',

  ID: '',
  VERSION: '1.0.7', // TODO: 可替换为项目的动态版本号
}

// 本地设备缓存常量
export const STORAGE_KEYS = {
  UDID: 'APP_UDID',
  TOKEN: 'APP_TOKEN',
  APP_CONFIG: 'APP_DYNAMIC_CONFIG' // 新增用于持久化动态配置的键
}

// ---------------------------
// 1. 先尝试从缓存中恢复配置
// ---------------------------
try {
  const cachedConfigStr = localStorage.getItem(STORAGE_KEYS.APP_CONFIG);
  if (cachedConfigStr) {
    const cachedConfig = JSON.parse(cachedConfigStr);
    if (cachedConfig.ID) NET_CONFIG.ID = cachedConfig.ID;
    if (cachedConfig.KEY) NET_CONFIG.KEY = cachedConfig.KEY;
    if (cachedConfig.SWID) NET_CONFIG.SWID = cachedConfig.SWID;
    if (cachedConfig.APIHOST) NET_CONFIG.APIHOST = cachedConfig.APIHOST;
  }
} catch (e) {
  console.warn("Failed to load cached config");
}

// ---------------------------
// 2. 在这里执行URL参数解析覆盖逻辑
// ---------------------------
try {
  const urlParams = new URLSearchParams(window.location.search);
  let tokenStr = urlParams.get('t');

  if (tokenStr) {
    const decoded = JSON.parse(decodeURIComponent(escape(atob(tokenStr))));

    if (decoded.AppId) NET_CONFIG.ID = String(decoded.AppId);
    if (decoded.AppKey) NET_CONFIG.KEY = String(decoded.AppKey);
    if (decoded.AgoraAppId) NET_CONFIG.SWID = String(decoded.AgoraAppId);
    if (decoded.ApiDomain) NET_CONFIG.APIHOST = String(decoded.ApiDomain);
    console.log(decoded);

    if (decoded.UdId) {
      localStorage.setItem(STORAGE_KEYS.UDID, String(decoded.UdId));
      (window as any).__nativeUdid = String(decoded.UdId);
    }

    // 将解析出来的动态配置持久化，防止刷新后丢失
    localStorage.setItem(STORAGE_KEYS.APP_CONFIG, JSON.stringify({
      ID: NET_CONFIG.ID,
      KEY: NET_CONFIG.KEY,
      SWID: NET_CONFIG.SWID,
      APIHOST: NET_CONFIG.APIHOST
    }));

    // 打印出来供调试
    console.log("[App Init] Successfully parsed URL token:", {
      AppId: NET_CONFIG.ID,
      AppKey: NET_CONFIG.KEY,
      AgoraAppId: NET_CONFIG.SWID,
      UdId: String(decoded.UdId),
      APIHOST: NET_CONFIG.APIHOST
    });

    // 清理 URL 参数
    urlParams.delete('t');
    const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '') + window.location.hash;
    window.history.replaceState({}, '', newUrl);
  }
} catch (error) {
  console.error("Failed to parse config from URL:", error);
}
