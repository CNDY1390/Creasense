// 简化的苹果系统字体工具

// 初始化字体系统
export function initFontSystem(): void {
  // 设置苹果系统字体
  document.documentElement.style.fontFamily = '-apple-system, BlinkMacSystemFont, sans-serif'

  // 不设置根字号，让浏览器使用默认值
  // 这样不会影响图表等使用 rem 的元素

  if (import.meta.env.DEV) {
    console.log('[Font System] 苹果系统字体已应用')
  }
}
