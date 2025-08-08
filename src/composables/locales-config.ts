/**
 * 自动生成的语言配置文件
 * 请勿手动编辑此文件，运行 npm run generate-locales 重新生成
 * 生成时间: 2025-08-07T11:50:04.333Z
 */

// 支持的语言类型定义
export type SupportedLocale = "en" | "ja" | "nl" | "zh-Hans" | "zh-Hant"

// 语言显示名称映射
export const localeNames: Record<SupportedLocale, string> = {
  "en": "English",
  "ja": "日本語",
  "nl": "Nederlands",
  "zh-Hans": "简体中文",
  "zh-Hant": "繁體中文"
}

// 日期格式化语言代码映射
export const dateLocaleMapping: Record<SupportedLocale, string> = {
  "en": "en-US",
  "ja": "ja-JP",
  "nl": "nl-NL",
  "zh-Hans": "zh-CN",
  "zh-Hant": "zh-TW"
}

// 默认语言
export const defaultLocale: SupportedLocale = "en"

// 支持的语言列表（从显示名称映射中提取）
export const supportedLocales = Object.keys(localeNames) as SupportedLocale[]

// 内部映射表（用于语言匹配）
const LOCALE_MAPPINGS_INTERNAL = new Map([
    ["zh-CN", { display: "简体中文", fileName: "zh-Hans" }],
    ["zh-TW", { display: "繁體中文", fileName: "zh-Hant" }],
    ["en-US", { display: "English", fileName: "en" }],
    ["ja-JP", { display: "日本語", fileName: "ja" }],
    ["nl-NL", { display: "Nederlands", fileName: "nl" }]
])

// 将系统语言代码映射到支持的语言
export function mapSystemLanguageToSupported(systemLanguage: string): SupportedLocale {
  // 1. 精确匹配
  for (const locale of supportedLocales) {
    if (systemLanguage === locale) {
      // console.log(`[useI18n] 系统语言直接匹配: ${locale}`)
      return locale
    }
  }

  // 2. 通过内部映射表直接查找
  const mappingEntry = LOCALE_MAPPINGS_INTERNAL.get(systemLanguage)
  if (mappingEntry) {
    // console.log(`[useI18n] 映射匹配: ${systemLanguage} -> ${mappingEntry.fileName}`)
    return mappingEntry.fileName as SupportedLocale
  }

  // 3. 语言主代码匹配（如 en-US -> en）
  const languageMain = systemLanguage.split('-')[0]
  for (const locale of supportedLocales) {
    if (locale === languageMain || locale.startsWith(languageMain + '-')) {
      // console.log(`[useI18n] 语言主代码匹配: ${systemLanguage} -> ${locale}`)
      return locale
    }
  }

  console.log(`[useI18n] 未找到匹配语言: ${systemLanguage}，使用默认语言: ${defaultLocale}`)
  console.log(`[useI18n] 支持的语言列表: ${supportedLocales.join(', ')}`)
  return defaultLocale
}

// 获取适合日期格式化的语言代码
export function getDateLocale(locale: SupportedLocale): string {
  return dateLocaleMapping[locale]
}

