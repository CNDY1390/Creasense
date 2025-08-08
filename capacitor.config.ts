import type { CapacitorConfig } from '@capacitor/cli'

const config = {
  appId: 'com.cndy.creasense',
  appName: 'Creasense',
  webDir: 'dist',
  ios: {
    path: '../ios',  //build 目录
    contentInset: "never", //保证沉浸
    allowsLinkPreview: false, //禁止网页链接预览？？
    webContentsDebuggingEnabled: false, //禁止网页调试 ？？
    scrollEnabled: true, //允许网页滚动？？
    limitsNavigationsToAppBoundDomains: false, //禁止网页跳转  ？？
    preferredContentMode: "mobile", //移动端模式  ？？
    scheme: "Creasense", //网页协议 ？？
    allowsBackForwardNavigationGestures: false, //禁止网页左右滑动实现上一页等等  ✅？
    // backgroundColor: "var(--bg-secondary)", //背景色
  },
  plugins: {
    StatusBar: {
      style: 'auto',
      overlay: false,
    },
    CapacitorHttp: {
      enabled: true,
    },
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
    },
  },
} as CapacitorConfig

export default config
