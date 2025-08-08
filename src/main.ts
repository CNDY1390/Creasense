import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { IonicVue } from '@ionic/vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import routes, { setupRouterGuard, scrollBehavior } from './router'

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css'

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css'
import '@ionic/vue/css/float-elements.css'
import '@ionic/vue/css/text-alignment.css'
import '@ionic/vue/css/text-transformation.css'
import '@ionic/vue/css/flex-utils.css'
import '@ionic/vue/css/display.css'

/* Theme variables */
import './styles/variables.css'
import './styles/global.css'
import './styles/text-selection.css'

// 导入i18n配置
import { useI18n } from './composables/useI18n'

// 扩展Vue的全局属性类型
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $t: (key: string) => string
  }
}

// 创建路由实例
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior
})

// 创建Vue应用
const app = createApp(App)

app.use(createPinia())
app.use(IonicVue)
app.use(router)

async function initializeApp() {
  console.log('[Main] 开始延迟初始化')

  try {
    // 导入并初始化字体系统（延迟加载）
    const { initFontSystem } = await import('./utils/fontSystem')
    initFontSystem()
    console.log('[Main] 字体系统初始化完成')

    // 导入并初始化Capacitor（延迟加载）
    const { initializeCapacitor, isNativePlatform, getCapacitorPlugin } = await import('./utils/capacitor')
    initializeCapacitor()
    console.log('[Main] Capacitor初始化完成')

    // 导入并初始化动态协议管理器（延迟加载）
    const { DynamicProtocolManager } = await import('./utils/dynamicProtocol')
    const protocolManager = DynamicProtocolManager.getInstance()
    await protocolManager.loadProtocols()
    console.log('[Main] 动态协议管理器初始化完成')

    // 初始化状态栏
    if (isNativePlatform()) {
      console.log('[Main] 检测到原生平台，初始化状态栏')
      try {
        const StatusBar = getCapacitorPlugin('StatusBar') as { show?: () => void; setOverlaysWebView?: () => void } | null
        if (StatusBar && StatusBar.show) {
          StatusBar.show()
          console.log('[Main] StatusBar.show() 已调用')
          // if (StatusBar.setOverlaysWebView) {
          //   StatusBar.setOverlaysWebView({ overlay: false })
          // }
        } else {
          console.log('[Main] StatusBar 插件不可用')
        }
      } catch (error) {
        console.error('[Main] errorerror 状态栏初始化失败:', error)
      }
    } else {
      console.log('[Main] Web平台，跳过状态栏初始化')
    }

    // 获取i18n实例并更新全局翻译函数
    const i18n = useI18n()
    app.config.globalProperties.$t = i18n.t

    // 初始化语言设置
    console.log('[Main] 初始化语言设置')
    await i18n.initializeLocale()

    // 设置路由守卫
    console.log('[Main] 设置路由守卫')
    await setupRouterGuard(router)

    console.log('[Main] 延迟初始化完成')
  } catch (error) {
    console.error('[Main] 延迟初始化失败:', error)
  }
}

// 先初始化i18n，再挂载应用
console.log('[Main] 开始初始化应用')
initializeApp().then(() => {
  console.log('[Main] 初始化完成，挂载应用')
  app.mount('#app')
}).catch((error) => {
  console.error('[Main] 初始化失败，但仍挂载应用:', error)
  app.mount('#app')
})
