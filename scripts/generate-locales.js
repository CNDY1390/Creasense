#!/usr/bin/env node

/**
 * 构建时语言配置生成脚本
 * 自动扫描 public/locales 目录下的语言文件，生成类型定义和配置
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 项目根目录
const rootDir = path.resolve(__dirname, '..')
const localesDir = path.join(rootDir, 'public/locales')
const outputFile = path.join(rootDir, 'src/composables/locales-config.ts')
const iosInfoPlistPath = path.resolve(rootDir, '../ios/App/App/Info.plist')

// 语言显示名称映射 - 需要手动维护这个映射
const LOCALE_MAPPINGS = {
  "zh-CN": { display: "简体中文", fileName: "zh-Hans" },
  "zh-TW": { display: "繁體中文", fileName: "zh-Hant" },
  "en-US": { display: "English", fileName: "en" },
  "ja-JP": { display: "日本語", fileName: "ja" },
  "nl-NL": { display: "Nederlands", fileName: "nl" }
}

// 日期格式化语言代码映射 - 用于 toLocaleDateString 等方法
const DATE_LOCALE_MAPPING = {
  'zh-Hans': 'zh-CN',
  'zh-Hant': 'zh-TW',
  'en': 'en-US',
  'ja': 'ja-JP',
  'nl': 'nl-NL',
}

function generateLocalesConfig() {
  try {
    console.log('[generate-locales] 开始生成语言配置...')

    // 读取语言文件目录
    if (!fs.existsSync(localesDir)) {
      console.error(`[generate-locales] 语言目录不存在: ${localesDir}`)
      process.exit(1)
    }

    // 扫描所有 .json 文件
    const files = fs.readdirSync(localesDir)
    const localeFiles = files.filter(file => file.endsWith('.json'))

    if (localeFiles.length === 0) {
      console.error('[generate-locales] 未找到任何语言文件')
      process.exit(1)
    }

    // 提取语言代码（从文件名）
    const availableLocales = localeFiles.map(file => file.replace('.json', ''))
    console.log(`[generate-locales] 发现语言文件: ${availableLocales.join(', ')}`)

    // 根据文件名查找对应的配置
    const findConfigByFileName = (fileName) => {
      return Object.entries(LOCALE_MAPPINGS).find(([, config]) => config.fileName === fileName)?.[1]
    }

    // 验证所有语言都有显示名称
    const missingDisplayNames = availableLocales.filter(locale => !findConfigByFileName(locale))
    if (missingDisplayNames.length > 0) {
      console.error(`[generate-locales] 以下语言缺少显示名称配置: ${missingDisplayNames.join(', ')}`)
      console.error('[generate-locales] 请在 LOCALE_MAPPINGS 中添加对应的 fileName 映射')
      process.exit(1)
    }

    // 验证所有语言都有日期格式化映射
    const missingDateMappings = availableLocales.filter(locale => !DATE_LOCALE_MAPPING[locale])
    if (missingDateMappings.length > 0) {
      console.error(`[generate-locales] 以下语言缺少日期格式化映射: ${missingDateMappings.join(', ')}`)
      console.error('[generate-locales] 请在 DATE_LOCALE_MAPPING 中添加对应的映射')
      process.exit(1)
    }

    // 生成 TypeScript 配置文件
    const typeDefinition = availableLocales.map(locale => `"${locale}"`).join(' | ')

    // 生成显示名称对象
    const displayNamesObject = availableLocales
      .map(locale => `  "${locale}": "${findConfigByFileName(locale).display}"`)
      .join(',\n')

    // 生成日期格式化映射对象
    const dateMappingObject = availableLocales
      .map(locale => `  "${locale}": "${DATE_LOCALE_MAPPING[locale]}"`)
      .join(',\n')

    // 生成语言映射对象（用于反向查找）
    const localeMappingsObject = Object.entries(LOCALE_MAPPINGS)
      .map(([iosCode, config]) => `    ["${iosCode}", { display: "${config.display}", fileName: "${config.fileName}" }]`)
      .join(',\n')

    const configContent = `/**
 * 自动生成的语言配置文件
 * 请勿手动编辑此文件，运行 npm run generate-locales 重新生成
 * 生成时间: ${new Date().toISOString()}
 */

// 支持的语言类型定义
export type SupportedLocale = ${typeDefinition}

// 语言显示名称映射
export const localeNames: Record<SupportedLocale, string> = {
${displayNamesObject}
}

// 日期格式化语言代码映射
export const dateLocaleMapping: Record<SupportedLocale, string> = {
${dateMappingObject}
}

// 默认语言
export const defaultLocale: SupportedLocale = "${availableLocales.includes('en') ? 'en' : availableLocales[0]}"

// 支持的语言列表（从显示名称映射中提取）
export const supportedLocales = Object.keys(localeNames) as SupportedLocale[]

// 内部映射表（用于语言匹配）
const LOCALE_MAPPINGS_INTERNAL = new Map([
${localeMappingsObject}
])

// 将系统语言代码映射到支持的语言
export function mapSystemLanguageToSupported(systemLanguage: string): SupportedLocale {
  // 1. 精确匹配
  for (const locale of supportedLocales) {
    if (systemLanguage === locale) {
      // console.log(\`[useI18n] 系统语言直接匹配: \${locale}\`)
      return locale
    }
  }

  // 2. 通过内部映射表直接查找
  const mappingEntry = LOCALE_MAPPINGS_INTERNAL.get(systemLanguage)
  if (mappingEntry) {
    // console.log(\`[useI18n] 映射匹配: \${systemLanguage} -> \${mappingEntry.fileName}\`)
    return mappingEntry.fileName as SupportedLocale
  }

  // 3. 语言主代码匹配（如 en-US -> en）
  const languageMain = systemLanguage.split('-')[0]
  for (const locale of supportedLocales) {
    if (locale === languageMain || locale.startsWith(languageMain + '-')) {
      // console.log(\`[useI18n] 语言主代码匹配: \${systemLanguage} -> \${locale}\`)
      return locale
    }
  }

  console.log(\`[useI18n] 未找到匹配语言: \${systemLanguage}，使用默认语言: \${defaultLocale}\`)
  console.log(\`[useI18n] 支持的语言列表: \${supportedLocales.join(', ')}\`)
  return defaultLocale
}

// 获取适合日期格式化的语言代码
export function getDateLocale(locale: SupportedLocale): string {
  return dateLocaleMapping[locale]
}

`

    // 写入配置文件
    fs.writeFileSync(outputFile, configContent, 'utf8')
    console.log(`[generate-locales] 配置文件已生成: ${outputFile}`)
    console.log(`[generate-locales] 共生成 ${availableLocales.length} 种语言配置`)

    console.log('[generate-locales] 更新 iOS Info.plist...')
    // 使用文件名作为 iOS 语言代码
    const locales = availableLocales
    try {
    if (!fs.existsSync(iosInfoPlistPath)) {
      console.log('[generate-locales] iOS Info.plist 不存在，跳过更新')
      return
    }
    let plistContent = fs.readFileSync(iosInfoPlistPath, 'utf8')
    const bundleLocalizationsRegex = /(<key>CFBundleLocalizations<\/key>\s*<array>)([\s\S]*?)(<\/array>)/
    const match = plistContent.match(bundleLocalizationsRegex)
    if (!match) {
      console.log('[generate-locales] 未找到 CFBundleLocalizations 配置，添加新配置')
      const localeEntries = locales.map(locale => `\t\t<string>${locale}</string>`).join('\n')
      const newConfig = `\t<key>CFBundleLocalizations</key>\n\t<array>\n${localeEntries}\n\t</array>\n</dict>`
      plistContent = plistContent.replace('</dict>', newConfig)
    } else {
      // 生成新的语言列表
      console.log('[generate-locales] 更新现有 CFBundleLocalizations 配置')
      const localeEntries = locales.map(locale => `\t\t<string>${locale}</string>`).join('\n')
      const newArray = `${match[1]}\n${localeEntries}\n\t${match[3]}`
      plistContent = plistContent.replace(match[0], newArray)
    }
    fs.writeFileSync(iosInfoPlistPath, plistContent, 'utf8')
    console.log(`[generate-locales] iOS Info.plist 已更新，支持语言: ${locales.join(', ')}`)
  } catch (error) {
    console.error('[generate-locales] 更新 iOS Info.plist 失败:', error.message)
  }
  } catch (error) {
    console.error('[generate-locales] 生成配置失败:', error)
    process.exit(1)
  }
}

// 运行生成脚本
generateLocalesConfig()
