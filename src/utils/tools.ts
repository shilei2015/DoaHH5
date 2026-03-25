import { API } from "./net/api";
import { post } from "./net/request";

/**
 * 根据国家代码获取对应的国旗 Emoji
 * 逻辑同步自 Swift 版本 String+Extension.swift -> flageEmoji()
 * @param countryCode 国家代码 (如 "CN", "US")
 * @returns 国旗 Emoji 字符串，失败返回空字符串
 */
export function getFlagEmoji(countryCode: string | undefined | null): string {
    if (!countryCode) return "";

    const invalidCodes = ["YU"];
    const upperCode = countryCode.toUpperCase();

    if (invalidCodes.includes(upperCode)) {
        return "";
    }

    // 取前两位
    let actualCode = upperCode.substring(0, 2);

    // 特向映射逻辑同步自 Swift
    if (actualCode === "TW") {
        actualCode = "CN";
    }
    if (actualCode === "ZR") {
        actualCode = "CD";
    }

    if (actualCode.length !== 2) {
        return "";
    }

    // 计算 Regional Indicator Symbol
    // 'A' 的 Unicode 码点是 65
    // Regional Indicator Symbol Letter A 是 127462 (0x1F1E6)
    try {
        const codePoints = actualCode
            .split("")
            .map(char => char.charCodeAt(0) - 65 + 127462);

        return String.fromCodePoint(...codePoints);
    } catch (e) {
        return "";
    }
}

/**
 * 格式化时间戳 (秒或毫秒)
 * @param timestamp 时间戳 (10位或13位)
 * @param format 格式 YYYY-MM-DD HH:mm:ss
 */
export function formatTimestamp(timestamp: string | number | undefined | null, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
    if (!timestamp) return "";

    let ts = Number(timestamp);
    if (isNaN(ts)) return String(timestamp);

    // 如果是 10 位数，认为是秒，转为毫秒
    if (String(Math.floor(ts)).length === 10) {
        ts *= 1000;
    }

    const date = new Date(ts);
    const map: Record<string, any> = {
        'YYYY': date.getFullYear(),
        'MM': String(date.getMonth() + 1).padStart(2, '0'),
        'DD': String(date.getDate()).padStart(2, '0'),
        'HH': String(date.getHours()).padStart(2, '0'),
        'mm': String(date.getMinutes()).padStart(2, '0'),
        'ss': String(date.getSeconds()).padStart(2, '0')
    };

    return format.replace(/YYYY|MM|DD|HH|mm|ss/g, (matched) => map[matched]);
}

/**
 * 根据时间戳获取年龄
 * @param timestamp 生日时间戳 (秒或毫秒)
 */
export function getAge(timestamp: string | number | undefined | null): number {
    if (!timestamp) return 0;

    let ts = Number(timestamp);
    if (isNaN(ts) || ts <= 0) return 0;

    // 如果是 10 位数，认为是秒，转为毫秒
    if (String(Math.floor(ts)).length === 10) {
        ts *= 1000;
    }

    const birthDate = new Date(ts);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();

    // 如果还没到今年的生日，则年龄 -1
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age < 0 ? 0 : age;
}

/**
 * 获取翻译的目标语言代码，将浏览器语言映射为后端需要的格式
 * @returns 语言代码 (如 "zh_Hant_TW", "zh_Hans_CN", "en")
 */
export function getTranslateTargetLanguage(): string {
    const lang = (navigator.language || 'en').toLowerCase();
    // if (lang.includes('tw') || lang.includes('hk')) return 'zh_Hant_TW';
    // if (lang.includes('zh')) return 'zh_Hans_CN';
    return lang
}

export async function translateText(text: string, to?: string): Promise<string | null> {
    const targetLang = to || getTranslateTargetLanguage();
    let res = await post(API.translate_text, { Text: text, To: targetLang })
    if (res.code == "0") {
        return res.data.TransResult
    }
    return null
}
