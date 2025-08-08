import { ref, computed } from 'vue'
import { isNativePlatform } from '@/utils/capacitor'
import {
  type SupportedLocale,
  localeNames,
  defaultLocale,
  mapSystemLanguageToSupported
} from './locales-config'

// 导出类型和配置供其他模块使用
export type { SupportedLocale }
export { localeNames }

// 获取用户首选语言
async function getPreferredLocale(): Promise<SupportedLocale> {
 return getCurrentAppLanguage()
}

// 全局i18n状态
const currentLocale = ref<SupportedLocale>(defaultLocale)
const messages = ref<Record<string, Record<string, Record<string, string>>>>({})

// 扩展的i18n composable
export function useI18n() {
  // 翻译函数
  const t = (key: string): string => {
    // console.log(`[useI18n] 翻译请求: ${key}`)

    const keys = key.split('.')
    let current: unknown = messages.value[currentLocale.value]

    if (!current) {
      console.error(`[useI18n] 未找到语言: ${currentLocale.value}`)
      return key
    }

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = (current as Record<string, unknown>)[k]
      } else {
        console.error(`[useI18n] 未找到翻译键: ${key}`)
        return key
      }
    }

    if (typeof current === 'string') {
      // console.log(`[useI18n] 翻译成功: ${key} -> ${current}`)
      return current
    }

    console.error(`[useI18n] 翻译失败: ${key}`)
    return key
  }

  // 当前语言
  const locale = computed(() => currentLocale.value)

  // 可用语言列表
  const locales = computed(() => Object.keys(messages.value) as SupportedLocale[])

  // 获取当前语言的显示名称
  const currentLocaleName = computed(() => localeNames[currentLocale.value])

  // 切换语言（在原生平台上提示用户修改系统设置）
  const changeLocale = async (newLocale: SupportedLocale) => {
    console.log(`[useI18n] 语言切换请求: ${newLocale}`)

    if (isNativePlatform()) {
      console.log('[useI18n] 原生平台：语言设置跟随系统，请修改iOS设置')
      // 可以在这里显示一个提示，告诉用户需要修改系统设置
      // 或者直接刷新应用以获取最新的系统语言设置
      window.location.reload()
      return
    }

    currentLocale.value = newLocale
    console.log(`[useI18n] 语言切换完成: ${newLocale}`)
  }

  // 设置消息
  const setMessages = (locale: SupportedLocale, msgs: Record<string, Record<string, string>>) => {
    messages.value[locale] = msgs as Record<string, Record<string, string>>
    console.log(`[useI18n] 设置消息: ${locale}`, Object.keys(msgs))
  }

  // 格式化日期
  const formatDate = (date: Date | string | number, format: 'short' | 'long' = 'short'): string => {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date

    if (format === 'short') {
      return dateObj.toLocaleDateString()
    }

    return dateObj.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // 格式化时间
  const formatTime = (date: Date | string | number): string => {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
    return dateObj.toLocaleTimeString()
  }

  // 格式化数字
  const formatNumber = (number: number): string => {
    return new Intl.NumberFormat().format(number)
  }

  // 格式化货币
  const formatCurrency = (amount: number, currency = 'CNY'): string => {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency
    }).format(amount)
  }

  // 获取系统语言并更新当前语言
  const updateLocaleFromSystem = async (): Promise<void> => {
    try {
      const systemLocale = await getPreferredLocale()
      console.log(`[useI18n] 从系统更新语言: ${systemLocale}`)
      currentLocale.value = systemLocale

      // 确保语言文件已加载
      if (!messages.value[systemLocale]) {
        console.log(`[useI18n] 语言文件未加载，开始加载: ${systemLocale}`)
        await loadLanguageFile(systemLocale)
      }
    } catch (error) {
      console.error('[useI18n] 更新系统语言失败:', error)
    }
  }

  // 初始化语言设置
  const initializeLocale = async (): Promise<void> => {
    try {
      const systemLocale = await getPreferredLocale()
      console.log(`[useI18n] 初始化语言: ${systemLocale}`)
      currentLocale.value = systemLocale

      // 确保语言文件已加载
      if (!messages.value[systemLocale]) {
        console.log(`[useI18n] 语言文件未加载，开始加载: ${systemLocale}`)
        await loadLanguageFile(systemLocale)
      }
    } catch (error) {
      console.error('[useI18n] 初始化语言失败:', error)
      currentLocale.value = defaultLocale
    }
  }

  // 加载语言文件
  const loadLanguageFile = async (locale: SupportedLocale): Promise<void> => {
    try {
      console.log(`[useI18n] 开始加载语言文件: ${locale}`)
      const response = await fetch(`/locales/${locale}.json`)
      if (!response.ok) {
        throw new Error(`Failed to load locale: ${locale}, status: ${response.status}`)
      }
      const messages = await response.json()
      setMessages(locale, messages as Record<string, Record<string, string>>)
      console.log(`[useI18n] 语言文件加载成功: ${locale}`)
    } catch (error) {
      console.error(`[useI18n] 加载语言文件失败: ${locale}`, error)
      // 如果加载失败，尝试加载默认语言
      if (locale !== defaultLocale) {
        console.log(`[useI18n] 尝试加载默认语言: ${defaultLocale}`)
        await loadLanguageFile(defaultLocale)
      }
    }
  }

  return {
    t,
    locale,
    locales,
    localeNames,
    currentLocaleName,
    changeLocale,
    setMessages,
    formatDate,
    formatTime,
    formatNumber,
    formatCurrency,
    updateLocaleFromSystem,
    initializeLocale,
    loadLanguageFile,
    // 新增的功能函数
    getCurrentAppLanguage,
    generateLanguageDisplayText
  }
}

export function getCurrentAppLanguage(): SupportedLocale {
  const navigatorLanguage = navigator.language
  const mappedLocale = mapSystemLanguageToSupported(navigatorLanguage)
  return mappedLocale
}

// 生成语言显示文本
export async function generateLanguageDisplayText(): Promise<string> {
  try {
    const currentLanguage = getCurrentAppLanguage()
    const displayText = localeNames[currentLanguage]
    return displayText
  } catch (error) {
    console.error("[useI18n] 生成显示文本失败:", error)
    return "error"
  }
}
