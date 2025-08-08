import type { BiometricAuthOptions, BiometricAuthResult } from '@/types/biometric'
import { isNativePlatform, getNativeBiometricPlugin } from '@/utils/capacitor'

class BiometricAuth {
  private isAuthRunning = false

  private log(message: string, data?: unknown) {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] [BiometricAuth] ${message}`, data)
  }

  private logError(message: string, error?: unknown) {
    const timestamp = new Date().toISOString()
    console.error(`[${timestamp}] [BiometricAuth] ERROR: ${message}`, error)
  }

  private async showPermissionAlert(alertTitle?: string, alertMessage?: string) {
    console.log('[showPermissionAlert] 参数类型检查:', {
      alertTitle: typeof alertTitle,
      alertTitleValue: alertTitle,
      alertMessage: typeof alertMessage,
      alertMessageValue: alertMessage
    });

    // 使用传入的多语言文本，如果没有传入则使用默认文本
    const message = alertMessage || '面容识别权限被拒绝或未启用，请在系统设置中启用面容识别权限。\n\n是否跳转到系统设置？'

    // 显示 confirm 对话框
    const confirmed = confirm(message)

    if (confirmed) {
      try {
        this.log('用户确认跳转到系统设置')
        await this.navigateToSystemSettings()
      } catch (error) {
        this.logError('跳转到系统设置失败', error)
        // 如果跳转失败，显示手动操作提示
        alert('跳转失败，请手动打开系统设置 > 面容ID与密码 > 面容ID')
      }
    } else {
      this.log('用户取消跳转到系统设置')
    }
  }

  private async navigateToSystemSettings() {
    try {
      this.log('正在跳转到系统设置...')

      // 检查是否在原生平台
      if (!isNativePlatform()) {
        this.log('Web平台，显示手动跳转提示')
        alert('请手动打开系统设置 > 面容ID与密码 > 面容ID')
        return
      }

      // 在原生平台上使用 capacitor-native-settings 插件
      this.log('原生平台，使用 capacitor-native-settings 插件')

      try {
        const { NativeSettings, IOSSettings } = await import('capacitor-native-settings')

        // 打开系统设置页面
        await NativeSettings.openIOS({
          option: IOSSettings.App
        })

        this.log('成功跳转到面容ID设置页面')

      } catch (pluginError) {
        this.logError('capacitor-native-settings 插件调用失败', pluginError)

        // 备用方案：使用 window.open
        try {
          this.log('尝试备用方案：window.open')
          const settingsUrl = 'App-Prefs:root=TOUCHID_PASSCODE'
          window.open(settingsUrl, '_blank')
          this.log('使用 window.open 打开面容ID设置')
        } catch (windowError) {
          this.logError('window.open 也失败，显示手动操作提示', windowError)
          alert('请手动打开系统设置 > 面容ID与密码 > 面容ID')
        }
      }

    } catch (error) {
      this.logError('跳转到系统设置失败', error)
      alert('跳转失败，请手动打开系统设置 > 面容ID与密码 > 面容ID')
    }
  }

  async performBiometricAuth(options: BiometricAuthOptions = {}, permissionAlertTitle?: string, permissionAlertMessage?: string): Promise<BiometricAuthResult> {
    console.log('[performBiometricAuth] 参数类型检查:', {
      options: typeof options,
      optionsValue: options,
      optionsKeys: options ? Object.keys(options) : null,
      title: options?.title ? typeof options.title : 'undefined',
      titleValue: options?.title,
      subtitle: options?.subtitle ? typeof options.subtitle : 'undefined',
      subtitleValue: options?.subtitle,
      description: options?.description ? typeof options.description : 'undefined',
      descriptionValue: options?.description,
      reason: options?.reason ? typeof options.reason : 'undefined',
      reasonValue: options?.reason,
      permissionAlertTitle: typeof permissionAlertTitle,
      permissionAlertTitleValue: permissionAlertTitle,
      permissionAlertMessage: typeof permissionAlertMessage,
      permissionAlertMessageValue: permissionAlertMessage
    });

    if (this.isAuthRunning) {
      this.logError('生物识别验证已在进行中')
      return { success: false, error: '生物识别验证已在进行中' }
    }

    this.isAuthRunning = true
    this.log('开始生物识别验证', options)

    let authResult: BiometricAuthResult = { success: false }

    if (isNativePlatform()) {
      console.log('isNativePlatform')
      try {
        const NativeBiometric = getNativeBiometricPlugin()

        this.log('使用原生生物识别')
        await NativeBiometric.verifyIdentity({
          title: options.title,
          subtitle: options.subtitle,
          description: options.description,
          reason: options.reason
        })

        this.log('原生生物识别验证成功')
        authResult = { success: true }
      } catch (error) {
        this.logError('原生生物识别验证失败', error)

        // 检查是否为权限相关错误
        const errorMessage = error instanceof Error ? error.message : String(error)
        const isPermissionError = errorMessage.includes('permission') ||
                                errorMessage.includes('denied') ||
                                errorMessage.includes('not available') ||
                                errorMessage.includes('not enrolled') ||
                                errorMessage.includes('locked out')

        if (isPermissionError) {
          this.logError('检测到权限错误，显示权限检查提示')
          this.showPermissionAlert(permissionAlertTitle, permissionAlertMessage)
        }

        authResult = {
          success: false,
          error: errorMessage
        }
      }
    } else {
      this.log('非原生环境，跳过生物识别验证')
      authResult = { success: true }
    }

    this.isAuthRunning = false
    this.log('生物识别验证完成', authResult)
    return authResult
  }

  async isAvailable(): Promise<boolean> {
    if (!isNativePlatform()) {
      this.log('生物识别不可用：非原生环境')
      return false
    }

    try {
      const NativeBiometric = getNativeBiometricPlugin()
      const result = await NativeBiometric.isAvailable()
      this.log('生物识别可用性检查', result)
      return result.isAvailable
    } catch (error) {
      this.logError('检查生物识别可用性失败', error)
      return false
    }
  }

  getIsAuthRunning(): boolean {
    return this.isAuthRunning
  }
}

export const biometricAuth = new BiometricAuth()
