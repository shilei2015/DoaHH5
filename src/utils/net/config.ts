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

  ppUrl: "https://www.momofu.store/a1/pp.html?bg=1",
  tsUrl: "https://www.momofu.store/a1/tos.html?bg=1",

  KEY: '',

  SWID: '',

  ID: '',
  VERSION: '1.0.0', // TODO: 可替换为项目的动态版本号

  LocalCCode: "",
  Language: "",
  UIV:"",
  AdId:"",
  FromDevice: "",
  DeviceVersion: "",
  DeviceLanguage: "",
}

// 本地设备缓存常量
export const STORAGE_KEYS = {
  UDID: 'APP_UDID',
  TOKEN: 'APP_TOKEN',
  APP_CONFIG: 'APP_DYNAMIC_CONFIG' // 新增用于持久化动态配置的键
}

const normalizeApiHost = (host: string) => host.trim().replace(/\/+$/, '')

const readString = (source: Record<string, any>, keys: string[]) => {
  for (const key of keys) {
    const value = source[key]
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim()
    }
  }
  return ''
}

const decodeBase64Json = (value: string): Record<string, any> => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bytes))
}

const decodeLaunchConfig = (urlParams: URLSearchParams): Record<string, any> | null => {
  const tokenStr = urlParams.get('t')
  if (tokenStr) {
    return decodeBase64Json(tokenStr)
  }

  const vt = urlParams.get('VT') || urlParams.get('vt')
  if (!vt) return null

  const [, payload] = vt.split('.')
  if (!payload) return null
  const decoded = decodeBase64Json(payload)
  return decoded.sub && typeof decoded.sub === 'object' ? decoded.sub : decoded
}

const pickApiHost = (host: unknown) => {
  if (typeof host !== 'string') return ''
  const normalized = normalizeApiHost(host)
  if (!normalized) return ''
  return normalized
}

const hasLaunchConfig = (source: Record<string, any>) =>
  Boolean(
    readString(source, [
      'AppId',
      'appId',
      'AppKey',
      'appKey',
      'Key',
      'key',
      'ApiDomain',
      'APIHOST',
      'ApiHost',
      'apiDomain',
      'apiHost',
      'Domain',
      'domain',
    ])
  )

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
    if (cachedConfig.APIHOST) NET_CONFIG.APIHOST = pickApiHost(cachedConfig.APIHOST);
    if (cachedConfig.LocalCCode) NET_CONFIG.LocalCCode = cachedConfig.LocalCCode;
    if (cachedConfig.Language) NET_CONFIG.Language = cachedConfig.Language;
    if (cachedConfig.UIV) NET_CONFIG.UIV = cachedConfig.UIV;
    if (cachedConfig.AdId) NET_CONFIG.AdId = cachedConfig.AdId;
    if (cachedConfig.FromDevice) NET_CONFIG.FromDevice = cachedConfig.FromDevice;
    if (cachedConfig.DeviceVersion) NET_CONFIG.DeviceVersion = cachedConfig.DeviceVersion;
    if (cachedConfig.DeviceLanguage) NET_CONFIG.DeviceLanguage = cachedConfig.DeviceLanguage;
    if (cachedConfig.Bundle) {
      (window as unknown as { __NATIVE_BRIDGE_NAME__?: string }).__NATIVE_BRIDGE_NAME__ = String(
        cachedConfig.Bundle
      ).trim();
    }
  }
} catch (e) {
  console.warn("Failed to load cached config");
}

// ---------------------------
// 2. 在这里执行URL参数解析覆盖逻辑
// ---------------------------
try {
  const urlParams = new URLSearchParams(window.location.search);
  const bundleFromQuery = urlParams.get('Bundle');
  if (bundleFromQuery?.trim()) {
    (window as unknown as { __NATIVE_BRIDGE_NAME__?: string }).__NATIVE_BRIDGE_NAME__ =
      bundleFromQuery.trim();
  }

  const decoded = decodeLaunchConfig(urlParams);
  const queryConfig = Object.fromEntries(urlParams.entries());
  const launchConfig = {
    ...(decoded ?? {}),
    ...queryConfig,
  };

  if (decoded || hasLaunchConfig(queryConfig)) {
    const previousApiHost = NET_CONFIG.APIHOST
    const nextApiHost = pickApiHost(
      readString(launchConfig, [
        'ApiDomain',
        'APIHOST',
        'ApiHost',
        'apiDomain',
        'apiHost',
        'Domain',
        'domain',
      ])
    )

    if (
      previousApiHost &&
      nextApiHost &&
      normalizeApiHost(previousApiHost) !== normalizeApiHost(nextApiHost)
    ) {
      // 环境切换时，避免把测试服 token 带到正式服，或把正式服 token 带回测试服。
      localStorage.removeItem(STORAGE_KEYS.TOKEN)
      localStorage.removeItem('useUserStore')
      console.log(
        `[App Init] API host changed, cleared persisted login state: ${previousApiHost} -> ${nextApiHost}`
      )
    }

    const appId = readString(launchConfig, ['AppId', 'appId'])
    const appKey = readString(launchConfig, ['AppKey', 'appKey', 'Key', 'key'])
    const agoraAppId = readString(launchConfig, ['AgoraAppId', 'agoraAppId'])
    const localCCode = readString(launchConfig, ['LocalCCode', 'localCCode'])
    const language = readString(launchConfig, ['Language', 'language'])
    const uiVersion = readString(launchConfig, ['UIV', 'UrlVersion', 'urlVersion'])
    const adId = readString(launchConfig, ['AdId', 'adId'])
    const version = readString(launchConfig, ['Version', 'version'])
    const udid = readString(launchConfig, ['UdId', 'UDID', 'udid'])
    const fromDevice = readString(launchConfig, ['FromDevice', 'fromDevice'])
    const deviceVersion = readString(launchConfig, ['DeviceVersion', 'deviceVersion'])
    const deviceLanguage = readString(launchConfig, ['DeviceLanguage', 'deviceLanguage'])
    const bundle = readString(launchConfig, ['Bundle', 'bundle'])

    if (appId) NET_CONFIG.ID = appId;
    if (appKey) NET_CONFIG.KEY = appKey;
    if (agoraAppId) NET_CONFIG.SWID = agoraAppId;
    if (nextApiHost) NET_CONFIG.APIHOST = nextApiHost;
    if (localCCode) NET_CONFIG.LocalCCode = localCCode;
    if (language) NET_CONFIG.Language = language;
    if (uiVersion) NET_CONFIG.UIV = uiVersion;
    if (adId) NET_CONFIG.AdId = adId;
    if (version) NET_CONFIG.VERSION = version;
    if (fromDevice) NET_CONFIG.FromDevice = fromDevice;
    if (deviceVersion) NET_CONFIG.DeviceVersion = deviceVersion;
    if (deviceLanguage) NET_CONFIG.DeviceLanguage = deviceLanguage;
    if (bundle) {
      (window as unknown as { __NATIVE_BRIDGE_NAME__?: string }).__NATIVE_BRIDGE_NAME__ = String(
        bundle
      ).trim();
    }
    console.log(launchConfig);

    if (udid) {
      localStorage.setItem(STORAGE_KEYS.UDID, udid);
      (window as any).__nativeUdid = udid;
    }

    // 将解析出来的动态配置持久化，防止刷新后丢失
    localStorage.setItem(STORAGE_KEYS.APP_CONFIG, JSON.stringify({
      ID: NET_CONFIG.ID,
      KEY: NET_CONFIG.KEY,
      SWID: NET_CONFIG.SWID,
      APIHOST: NET_CONFIG.APIHOST,
      LocalCCode: NET_CONFIG.LocalCCode,
      Language: NET_CONFIG.Language,
      UIV: NET_CONFIG.UIV,
      AdId: NET_CONFIG.AdId,
      Version: NET_CONFIG.VERSION,
      FromDevice: NET_CONFIG.FromDevice,
      DeviceVersion: NET_CONFIG.DeviceVersion,
      DeviceLanguage: NET_CONFIG.DeviceLanguage,
      Bundle: (window as unknown as { __NATIVE_BRIDGE_NAME__?: string }).__NATIVE_BRIDGE_NAME__ ?? '',
    }));

    // 打印出来供调试
    console.log("[App Init] Successfully parsed URL token:", {
      AppId: NET_CONFIG.ID,
      AppKey: NET_CONFIG.KEY,
      AgoraAppId: NET_CONFIG.SWID,
      UdId: udid,
      APIHOST: NET_CONFIG.APIHOST,
      LocalCCode: NET_CONFIG.LocalCCode,
      Language: NET_CONFIG.Language,
      UIV: NET_CONFIG.UIV,
      AdId: NET_CONFIG.AdId,
      Version: NET_CONFIG.VERSION,
      FromDevice: NET_CONFIG.FromDevice,
      DeviceVersion: NET_CONFIG.DeviceVersion,
      DeviceLanguage: NET_CONFIG.DeviceLanguage,
      Bundle: (window as unknown as { __NATIVE_BRIDGE_NAME__?: string }).__NATIVE_BRIDGE_NAME__,
    });

    // 生产环境清理 URL 参数；本地开发保留 t，便于刷新和人工确认当前测试环境。
    const shouldKeepLaunchToken =
      typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV
    if (!shouldKeepLaunchToken) {
      urlParams.delete('t');
      urlParams.delete('VT');
      urlParams.delete('vt');
      urlParams.delete('AppId');
      urlParams.delete('appId');
      urlParams.delete('AppKey');
      urlParams.delete('appKey');
      urlParams.delete('Key');
      urlParams.delete('key');
      urlParams.delete('ApiDomain');
      urlParams.delete('apiDomain');
      urlParams.delete('ApiHost');
      urlParams.delete('apiHost');
      urlParams.delete('APIHOST');
      urlParams.delete('Domain');
      urlParams.delete('domain');
    }
    urlParams.delete('Bundle');
    const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '') + window.location.hash;
    window.history.replaceState({}, '', newUrl);
  } else if (bundleFromQuery?.trim()) {
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.APP_CONFIG) || '{}');
      localStorage.setItem(
        STORAGE_KEYS.APP_CONFIG,
        JSON.stringify({
          ...existing,
          Bundle: (window as unknown as { __NATIVE_BRIDGE_NAME__?: string }).__NATIVE_BRIDGE_NAME__,
        })
      );
    } catch {
      /* ignore */
    }
    urlParams.delete('Bundle');
    const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '') + window.location.hash;
    window.history.replaceState({}, '', newUrl);
  }
} catch (error) {
  console.error("Failed to parse config from URL:", error);
}

// ---------------------------
// 3. 本地 dev 兜底：只读取本机 .env.development.local 的 VITE_DEV_*。
//    本地测试链接由原生壳追加 AppKey / ApiDomain 后，仍会优先走 URL 配置。
// ---------------------------
try {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) {
    const env = import.meta.env as ImportMetaEnv
    const pick = (cur: string, next?: string) => (cur && cur.length > 0 ? cur : (next ?? ''))
    NET_CONFIG.ID = pick(NET_CONFIG.ID, env.VITE_DEV_APP_ID)
    NET_CONFIG.KEY = pick(NET_CONFIG.KEY, env.VITE_DEV_APP_KEY)
    NET_CONFIG.APIHOST = pick(NET_CONFIG.APIHOST, env.VITE_DEV_API_HOST)
    NET_CONFIG.SWID = pick(NET_CONFIG.SWID, env.VITE_DEV_AGORA_APP_ID)
    NET_CONFIG.LocalCCode = pick(NET_CONFIG.LocalCCode, env.VITE_DEV_LOCAL_CCODE)
    NET_CONFIG.Language = pick(NET_CONFIG.Language, env.VITE_DEV_LANGUAGE)
    NET_CONFIG.UIV = pick(NET_CONFIG.UIV, env.VITE_DEV_UIV)
    NET_CONFIG.AdId = pick(NET_CONFIG.AdId, env.VITE_DEV_AD_ID)
    NET_CONFIG.FromDevice = pick(NET_CONFIG.FromDevice, env.VITE_DEV_FROM_DEVICE)
    NET_CONFIG.DeviceVersion = pick(NET_CONFIG.DeviceVersion, env.VITE_DEV_DEVICE_VERSION)
    NET_CONFIG.DeviceLanguage = pick(NET_CONFIG.DeviceLanguage, env.VITE_DEV_DEVICE_LANGUAGE)

    if (NET_CONFIG.ID || NET_CONFIG.KEY || NET_CONFIG.APIHOST) {
      console.log('[App Init] DEV env fallback config applied:', {
        AppId: NET_CONFIG.ID,
        AppKey: NET_CONFIG.KEY ? '***' : '',
        APIHOST: NET_CONFIG.APIHOST,
        AgoraAppId: NET_CONFIG.SWID,
        LocalCCode: NET_CONFIG.LocalCCode,
        Language: NET_CONFIG.Language,
        UIV: NET_CONFIG.UIV,
        AdId: NET_CONFIG.AdId,
        FromDevice: NET_CONFIG.FromDevice,
        DeviceVersion: NET_CONFIG.DeviceVersion,
        DeviceLanguage: NET_CONFIG.DeviceLanguage,
      })
    }
  }
} catch (e) {
  console.warn('[App Init] DEV env fallback failed:', e)
}

/**
 * VConsole 异步挂载后补打一遍当前生效的启动配置（与 URL 解析结果一致，URL 已清理后仍可读内存态）
 */
export function logAppInitConfigForVConsole(): void {
  try {
    const bridge = (window as unknown as { __NATIVE_BRIDGE_NAME__?: string }).__NATIVE_BRIDGE_NAME__
    let udid = ''
    try {
      udid = localStorage.getItem(STORAGE_KEYS.UDID) || ''
    } catch {
      /* ignore */
    }

    console.log('[App Init Replay] 当前生效配置（VConsole 挂载后补打）', {
      AppId: NET_CONFIG.ID,
      AppKey: NET_CONFIG.KEY,
      AgoraAppId: NET_CONFIG.SWID,
      UdId: udid,
      APIHOST: NET_CONFIG.APIHOST,
      LocalCCode: NET_CONFIG.LocalCCode,
      Language: NET_CONFIG.Language,
      UIV: NET_CONFIG.UIV,
      AdId: NET_CONFIG.AdId,
      Version: NET_CONFIG.VERSION,
      FromDevice: NET_CONFIG.FromDevice,
      DeviceVersion: NET_CONFIG.DeviceVersion,
      DeviceLanguage: NET_CONFIG.DeviceLanguage,
      Bundle: bridge ?? '',
      HOSTROOT: NET_CONFIG.HOSTROOT,
    })
  } catch (e) {
    console.warn('[App Init Replay] 打印失败', e)
  }
}
