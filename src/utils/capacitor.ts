/**
 * Capacitor平台检测工具
 * 在开发环境中提供安全的Capacitor检查
 */

import { Capacitor } from '@capacitor/core'
// import { StatusBar, Style } from '@capacitor/status-bar'

// 全局平台信息，避免重复调用
let isNativePlatformGlobal: boolean = false;


// 获取平台检测结果
export function isNativePlatform(): boolean {
  return isNativePlatformGlobal;
}


// 定义Capacitor相关类型
interface CapacitorWindow extends Window {
  Capacitor?: {
    isNativePlatform(): boolean
    getPlatform(): string
    Plugins: Record<string, unknown>
  }
}

interface NativeBiometricPlugin {
  verifyIdentity(options: {
    title?: string
    subtitle?: string
    description?: string
    reason?: string
  }): Promise<void>
  isAvailable(): Promise<{ isAvailable: boolean }>
}


export const isCapacitorAvailable = (): boolean => {
  return typeof (window as CapacitorWindow).Capacitor !== 'undefined'
}



export const getCapacitorPlugin = (pluginName: string): unknown => {
  if (!isCapacitorAvailable()) {
    const error = new Error(`Web环境，${pluginName}插件不可用`);
    console.error(`[Capacitor] ${error.message}`);
    throw error;
  }

  const { Capacitor } = window as CapacitorWindow;
  if (!Capacitor || !Capacitor.Plugins[pluginName]) {
    const error = new Error(`获取${pluginName}插件失败: 插件不存在`);
    console.error(`[Capacitor] ${error.message}`);
    throw error;
  }

  return Capacitor.Plugins[pluginName];
}

// 获取NativeBiometric插件
export const getNativeBiometricPlugin = (): NativeBiometricPlugin => {
  const plugin = getCapacitorPlugin('NativeBiometric')
  return plugin as NativeBiometricPlugin
}


// 初始化Capacitor相关功能
export function initializeCapacitor(): void {
  console.log('[Capacitor] 开始初始化Capacitor')
 isNativePlatformGlobal = Capacitor.isNativePlatform();
}

