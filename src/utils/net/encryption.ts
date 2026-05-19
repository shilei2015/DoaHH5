/**
 * encryption.ts
 * 包含 AES 加解密，MD5 签名，以及设备 ID 生成逻辑
 */
import CryptoJS from 'crypto-js'
import { NET_CONFIG, STORAGE_KEYS } from './config'

// 当需要AES加解密时，动态从源配置获取最新的 KEY
function getAesKey() {
  return CryptoJS.enc.Utf8.parse(NET_CONFIG.KEY)
}

/**
 * AES 加密
 * @param word 需要加密的字符串
 * @returns 加密后的 base64/hex 字符串
 */
export function encryptAES(word: string): string {
  if (!word) return ''
  // 根据 Swift 源码：明确会在明文后拼接一个 _ID 后缀再进行加密
  const awaitAesText = word + '_' + NET_CONFIG.ID
  const srcs = CryptoJS.enc.Utf8.parse(awaitAesText)

  const encrypted = CryptoJS.AES.encrypt(srcs, getAesKey(), {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  })

  let base64Text = encrypted.toString()
  // Swift 中对 base64 结果进行了特殊字符替换
  base64Text = base64Text.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '$')

  return base64Text
}

/**
 * AES 解密
 * @param word 加密过的字符串
 * @returns 解密出的原始字符串
 */
export function decryptAES(word: string): string {
  if (!word) return ''
  // 还原真实的 base64 字符，并去除可能存在的转义符和引号
  let base64Text = word.replace(/-/g, '+').replace(/_/g, '/').replace(/\$/g, '=').replace(/\\/g, '').replace(/"/g, '')

  try {
    const decrypt = CryptoJS.AES.decrypt(base64Text, getAesKey(), {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7
    })

    let result = decrypt.toString(CryptoJS.enc.Utf8).trim()

    // 如果存在后端固定拼接的 ID 后缀，则去除
    const suffix = '_' + NET_CONFIG.ID
    if (result.endsWith(suffix)) {
      result = result.substring(0, result.length - suffix.length)
    }

    return result
  } catch (error) {
    console.error('AES Decrypt Error', error)
    return ''
  }
}

/**
 * 生成 32 位 MD5
 * @param word 字符串
 */
export function getMD5(word: string): string {
  // 原生 Swift 的 %02X 是输出大写字母
  return CryptoJS.MD5(word).toString().toUpperCase()
}

/**
 * 获取设备 UDID
 * 优先从 iOS 原生注入的内存中获取，非原生环境则从 localStorage 读取或生成随机值
 */
export function getUdid(externalUdid?: string): string {
  if (externalUdid) {
    localStorage.setItem(STORAGE_KEYS.UDID, externalUdid)
    return externalUdid
  }

  // 优先从原生内存中获取（iapBridge.ts 收到后会挂在 window 上）
  const nativeId = (window as any).__nativeUdid
  if (nativeId) return nativeId

  // 非原生环境：从 localStorage 读取或生成随机值
  let udid = localStorage.getItem(STORAGE_KEYS.UDID)
  if (!udid) {
    udid = 'web-' + URL.createObjectURL(new Blob()).slice(-36).replace(/-/g, '') + Date.now().toString(36)
    localStorage.setItem(STORAGE_KEYS.UDID, udid)
  }
  return udid
}

/**
 * 生成签名 Signature 字符串。
 * 逻辑参考 Swift: 
 * 1. 追加 Nonce
 * 2. 忽略 "File" 和 "s"
 * 3. 排序 keys
 * 4. `${Base64(key)}=${Base64(value)}` -> join("&") + "&" + KEY
 * 5. md5
 */
export function createSiginString(
  params: Record<string, any> = {},
  nonce: string,
  isEncrypt: boolean = true
): string {
  const mutParams: Record<string, any> = { ...params, Nonce: nonce }

  // 按照升序排序 key
  const sortedKeys = Object.keys(mutParams).sort()

  const ignoreKeyFile = 'File'
  const ignoreKeyS = 's'

  const encodedPairs: string[] = []

  sortedKeys.forEach(key => {
    if (key !== ignoreKeyFile && key !== ignoreKeyS) {
      const value = String(mutParams[key])
      const keyBase64 = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(key))
      const valueBase64 = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(value))

      encodedPairs.push(`${keyBase64}=${valueBase64}`)
    }
  })

  const encodedPairsString = encodedPairs.join('&')
  const signString = encodedPairsString + '&' + NET_CONFIG.KEY

  const md5 = getMD5(signString)
  return md5
}
