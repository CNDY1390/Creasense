import { onMounted, onUnmounted, ref } from 'vue'
import { textSelectionManager } from '@/utils/textSelection'

/**
 * 文字选择管理组合式函数
 * 提供在Vue组件中管理文字选择的功能
 */
export function useTextSelection() {
  const isInitialized = ref(false)

  /**
   * 为元素添加禁用选择功能
   */
  const addNoSelect = (element: HTMLElement) => {
    textSelectionManager.addNoSelectToElement(element)
  }

  /**
   * 为元素添加可访问性文字功能
   */
  const addAccessibleText = (element: HTMLElement) => {
    textSelectionManager.addAccessibleTextToElement(element)
  }

  /**
   * 为元素添加隐私文字功能
   */
  const addPrivacyText = (element: HTMLElement) => {
    textSelectionManager.addPrivacyTextToElement(element)
  }

  /**
   * 批量处理元素
   */
  const processElements = (selector: string, type: 'no-select' | 'accessible' | 'privacy' = 'no-select') => {
    const elements = document.querySelectorAll(selector) as NodeListOf<HTMLElement>

    elements.forEach(element => {
      switch (type) {
        case 'no-select':
          addNoSelect(element)
          break
        case 'accessible':
          addAccessibleText(element)
          break
        case 'privacy':
          addPrivacyText(element)
          break
      }
    })

    // console.log(`[useTextSelection] 处理了 ${elements.length} 个元素，类型: ${type}`)
  }

  /**
   * 为医疗数据添加隐私保护
   */
  const protectMedicalData = () => {
    // 保护医疗数据
    processElements('.metric-value', 'privacy')
    processElements('.current-value .value', 'privacy')
    processElements('.risk-percentage', 'privacy')
    processElements('.percentage', 'privacy')

    // 保护用户信息
    processElements('.user-name .item-body', 'privacy')
    processElements('.user-info', 'privacy')

    console.log('[useTextSelection] 医疗数据隐私保护已启用')
  }

  /**
   * 为UI装饰性元素禁用选择
   */
  const disableUISelection = () => {
    // 禁用页面标题和导航
    processElements('.page-title', 'no-select')
    processElements('.item-title', 'no-select')
    processElements('nav *, .navigation *', 'no-select')

    // 禁用按钮文字
    processElements('button, .btn-primary, .btn-secondary, .btn-danger', 'no-select')

    // 禁用图标和装饰性元素
    processElements('.fa-solid, .fa-regular, .fa-brands, .icon', 'no-select')
    processElements('.decorative-text', 'no-select')

    // 禁用状态指示器
    processElements('.status-indicator, .status-text, .status-level', 'no-select')

    // 禁用卡片和区块标题
    processElements('.item-title', 'no-select')
    processElements('.metric-label', 'no-select')
    processElements('.greeting .hello', 'no-select')
    processElements('.view-all', 'no-select')

    // 禁用设备信息装饰性文字
    processElements('.device-model, .device-status', 'no-select')

    console.log('[useTextSelection] UI装饰性元素选择已禁用')
  }

  /**
   * 保持可访问性文字
   */
  const enableAccessibleText = () => {
    // 保持设置说明可访问
    processElements('.item-footnote', 'accessible')
    processElements('.setting-footnote', 'accessible')
    processElements('.device-details p', 'accessible')
    processElements('.risk-advice', 'accessible')
    processElements('.error-message', 'accessible')
    processElements('.help-text', 'accessible')
    processElements('.form-label', 'accessible')

    console.log('[useTextSelection] 可访问性文字已启用')
  }

  /**
   * 初始化文字选择管理
   */
  const initialize = () => {
    if (isInitialized.value) {
      console.log('[useTextSelection] 已经初始化')
      return
    }

    console.log('[useTextSelection] 初始化文字选择管理')

    // 等待DOM加载完成
    setTimeout(() => {
      disableUISelection()
      protectMedicalData()
      enableAccessibleText()

      isInitialized.value = true
      console.log('[useTextSelection] 文字选择管理初始化完成')
    }, 100)
  }

  /**
   * 清理
   */
  const cleanup = () => {
    isInitialized.value = false
    console.log('[useTextSelection] 清理文字选择管理')
  }

  // 组件挂载时自动初始化
  onMounted(() => {
    initialize()
  })

  // 组件卸载时清理
  onUnmounted(() => {
    cleanup()
  })

  return {
    isInitialized,
    addNoSelect,
    addAccessibleText,
    addPrivacyText,
    processElements,
    protectMedicalData,
    disableUISelection,
    enableAccessibleText,
    initialize,
    cleanup
  }
}
