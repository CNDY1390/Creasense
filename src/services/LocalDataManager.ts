import type { AppData, PersonalData, HealthData, DataManagerResult, UserData, HealthStatus } from '@/types/app'

// Define specific types for different contexts
type LogData = unknown
type LogError = unknown
type ObjectData = Record<string, unknown>
type ChartDataValue = unknown

class LocalDataManager {
  private storageKey = 'health_dashboard_data'
  private versionKey = 'health_dashboard_version'
  private currentVersion = '1.0.0'

  private log(message: string, data?: LogData) {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] [LocalDataManager] ${message}`, data)
  }

  private logError(message: string, error?: LogError) {
    const timestamp = new Date().toISOString()
    console.error(`[${timestamp}] [LocalDataManager] ERROR: ${message}`, error)
  }

  async deleteField(path: string): Promise<DataManagerResult> {
    this.log(`删除字段: ${path}`)

    const dataResult = await this.loadData()
    if (!dataResult.success || !dataResult.data) {
      this.logError('无法获取数据')
      return { success: false, error: '数据不存在' }
    }

    const keys = path.split('.')
    let cur: ObjectData = dataResult.data as unknown as ObjectData

    for (let i = 0; i < keys.length - 1; i++) {
      if (typeof cur[keys[i]] !== 'object' || cur[keys[i]] === null) {
        this.logError(`路径不存在: ${keys.slice(0, i + 1).join('.')}`)
        return { success: false, error: '路径不存在' }
      }
      cur = cur[keys[i]] as ObjectData
    }

    const lastKey = keys[keys.length - 1]
    if (cur.hasOwnProperty(lastKey)) {
      delete cur[lastKey]
      await this.saveData(dataResult.data)
      this.log(`成功删除字段: ${path}`)
      return { success: true }
    }

    this.logError(`字段不存在: ${path}`)
    return { success: false, error: '字段不存在' }
  }

  async setField(path: string, value: unknown): Promise<DataManagerResult> {
    this.log(`设置字段: ${path}`, value)

    const dataResult = await this.loadData()
    if (!dataResult.success || !dataResult.data) {
      this.logError('主数据结构不完整')
      return { success: false, error: '主数据结构不完整' }
    }

    const keys = path.split('.')
    let cur: ObjectData = dataResult.data as unknown as ObjectData

    for (let i = 0; i < keys.length - 1; i++) {
      if (typeof cur[keys[i]] !== 'object' || cur[keys[i]] === null) {
        cur[keys[i]] = {}
      }
      cur = cur[keys[i]] as ObjectData
    }

    const lastKey = keys[keys.length - 1]
    if (typeof value === 'object' && value !== null &&
        typeof cur[lastKey] === 'object' && cur[lastKey] !== null) {
      this.deepMerge(cur[lastKey] as ObjectData, value as ObjectData)
      this.log(`递归合并对象: ${path}`)
    } else {
      cur[lastKey] = value
      this.log(`直接赋值: ${path}`)
    }

    const result = await this.saveData(dataResult.data)
    this.log(`字段设置完成: ${path}`)
    return result
  }

  async getField<T = unknown>(path: string): Promise<T | undefined> {
    this.log(`获取字段: ${path}`)

    const dataResult = await this.loadData()
    if (!dataResult.success || !dataResult.data) {
      this.logError('无法获取数据')
      return undefined
    }

    const keys = path.split('.')
    let cur: ObjectData = dataResult.data as unknown as ObjectData

    for (const key of keys) {
      if (cur == null) {
        this.logError(`字段路径中断: ${path}`)
        return undefined
      }
      cur = cur[key] as ObjectData
    }

    this.log(`字段获取成功: ${path}`, cur)
    return cur as T
  }

  async loadData(): Promise<DataManagerResult<AppData>> {
    try {
      this.log('开始加载数据')

      // 在Capacitor环境中，先尝试从localStorage加载
      const dataString = localStorage.getItem(this.storageKey)

      if (!dataString) {
        this.log('未找到本地数据，尝试初始化默认数据')

        // 尝试获取默认数据
        const defaultResult = await this.getDefaultData()
        if (defaultResult.success && defaultResult.data) {
          // 保存默认数据到localStorage
          await this.saveData(defaultResult.data)
          this.log('已初始化默认数据')
          return { success: true, data: defaultResult.data }
        }

        this.log('无法获取默认数据，首次启动')
        return {
          success: false,
          error: '未找到本地数据',
          isFirstLaunch: true
        }
      }

      const data = JSON.parse(dataString) as AppData
      if (!this.validateData(data)) {
        this.logError('数据格式验证失败')
        return {
          success: false,
          error: '数据格式不正确',
          isFirstLaunch: true
        }
      }

      // 数据格式验证通过，无需额外处理

      this.log('数据加载成功')
      return { success: true, data }
    } catch (error) {
      this.logError('加载数据失败', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        isFirstLaunch: true
      }
    }
  }

  async saveData(data: AppData): Promise<DataManagerResult> {
    try {
      this.log('开始保存数据')
      data.updatedAt = new Date().toISOString()
      data.version = this.currentVersion

      localStorage.setItem(this.storageKey, JSON.stringify(data))
      localStorage.setItem(this.versionKey, this.currentVersion)

      this.log('数据保存成功')
      return { success: true }
    } catch (error) {
      this.logError('保存数据失败', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  async getDefaultData(): Promise<DataManagerResult<AppData>> {
    try {
      this.log('获取默认数据')

      // 尝试加载个人数据
      const personalResult = await this.getPersonalData()
      if (!personalResult.success) {
        throw new Error('无法加载个人数据')
      }

      // 创建默认的 AppData，只包含用户信息
      const data: AppData = {
        user: personalResult.data!.user,
        version: this.currentVersion,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }

      this.log('默认数据获取成功')
      return { success: true, data }
    } catch (error) {
      this.logError('加载默认数据失败', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  async getPersonalData(): Promise<DataManagerResult<PersonalData>> {
    try {
      this.log('获取个人数据')
      const response = await fetch('/data/personalData.json')

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json() as PersonalData
      if (!this.validatePersonalData(data)) {
        throw new Error('个人数据格式不正确')
      }

      data.version = this.currentVersion
      data.lastModified = new Date().toISOString()
      if (!data.createdAt) data.createdAt = new Date().toISOString()
      if (!data.updatedAt) data.updatedAt = new Date().toISOString()

      this.log('个人数据获取成功')
      return { success: true, data }
    } catch (error) {
      this.logError('加载个人数据失败', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  async getDebugData(): Promise<DataManagerResult<HealthData>> {
    try {
      this.log('获取调试数据')
      const response = await fetch('/data/debugData.json')

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json() as HealthData
      if (!this.validateHealthData(data)) {
        throw new Error('调试数据格式不正确')
      }

      data.version = this.currentVersion
      data.lastModified = new Date().toISOString()
      if (!data.createdAt) data.createdAt = new Date().toISOString()
      if (!data.updatedAt) data.updatedAt = new Date().toISOString()

      this.log('调试数据获取成功')
      return { success: true, data }
    } catch (error) {
      this.logError('加载调试数据失败', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  isFirstLaunch(): boolean {
    try {
      const hasData = localStorage.getItem(this.storageKey) !== null
      const hasVersion = localStorage.getItem(this.versionKey) !== null
      const isFirst = !hasData || !hasVersion

      this.log(`首次启动检查: ${isFirst}`)
      return isFirst
    } catch (error) {
      this.logError('检查首次启动状态失败', error)
      return true
    }
  }

  async updateUserInfo(userInfo: Partial<UserData>): Promise<DataManagerResult> {
    this.log('更新用户信息', userInfo)
    return this.setField('user', userInfo)
  }

  async updateHealthData(healthData: Partial<HealthStatus>): Promise<DataManagerResult> {
    this.log('更新健康数据', healthData)
    return this.setField('healthStatus', healthData)
  }

  async updateChartData(chartData: ChartDataValue): Promise<DataManagerResult> {
    this.log('更新图表数据', chartData)
    return this.setField('rawData', chartData)
  }

  async exportData(): Promise<DataManagerResult> {
    this.log('开始导出数据')
    const result = await this.loadData()
    if (!result.success || !result.data) return result

    try {
      const exportData = {
        ...result.data,
        exportedAt: new Date().toISOString(),
        exportVersion: this.currentVersion
      }

      const dataBlob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })

      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `health_backup_${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)

      this.log('数据导出成功')
      return { success: true, message: '数据导出成功' }
    } catch (error) {
      this.logError('导出数据失败', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  async importData(file: File): Promise<DataManagerResult> {
    this.log('开始导入数据', file.name)

    return new Promise((resolve) => {
      const reader = new FileReader()

      reader.onload = async (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string)
          if (!this.validateData(importedData)) {
            this.logError('导入数据格式验证失败')
            resolve({ success: false, error: '导入的数据格式不正确' })
            return
          }

          const result = await this.saveData(importedData)
          if (result.success) {
            this.log('数据导入成功')
            resolve({ success: true, message: '数据导入成功' })
          } else {
            resolve(result)
          }
        } catch (error) {
          this.logError('文件解析失败', error)
          resolve({ success: false, error: '文件格式不正确' })
        }
      }

      reader.onerror = () => {
        this.logError('文件读取失败')
        resolve({ success: false, error: '文件读取失败' })
      }

      reader.readAsText(file)
    })
  }

  async clearAllData(): Promise<DataManagerResult> {
    try {
      this.log('清除所有数据')
      localStorage.removeItem(this.storageKey)
      localStorage.removeItem(this.versionKey)
      this.log('所有数据已清除')
      return { success: true, message: '所有数据已清除' }
    } catch (error) {
      this.logError('清除数据失败', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  async initializeWithEmptyData(): Promise<DataManagerResult> {
    this.log('初始化空数据')

    try {
      const response = await fetch('/data/emptyData.json')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const emptyData = await response.json()
      // 只在setup时设置数据，后续只能读取本地数据
      emptyData.createdAt = new Date().toISOString()
      emptyData.updatedAt = new Date().toISOString()
      emptyData.lastModified = new Date().toISOString()

      const result = await this.saveData(emptyData)
      this.log('空数据初始化完成')
      return result
    } catch (error) {
      this.logError('初始化空数据失败', error)
      return { success: false, error: '初始化空数据失败' }
    }
  }

  async initializeWithDebugData(): Promise<DataManagerResult> {
    this.log('初始化调试数据')

    try {
      // 加载个人数据
      const personalResult = await this.getPersonalData()
      if (!personalResult.success) {
        throw new Error('无法加载个人数据')
      }

      // 加载调试数据
      const debugResult = await this.getDebugData()
      if (!debugResult.success) {
        throw new Error('无法加载调试数据')
      }

      // 由于调试数据不再包含健康状态，我们创建一个空的健康状态
      const calculatedStatus: 'normal' | 'warning' | 'danger' | 'unknown' = 'unknown'

      // 转换数据格式
      const convertedHealthStatus = {
        creatinine: {
          value: 0,
          unit: 'µmol/L',
          level: calculatedStatus,
          percentage: 0,
          timestamp: ""
        },
        illnessProbability: 0,
        lastUpdated: new Date().toISOString()
      }

      // 合并数据
      const combinedData: AppData = {
        user: personalResult.data!.user,
        healthStatus: convertedHealthStatus,
        chartData: debugResult.data!.chartData,
        version: this.currentVersion,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }

      const result = await this.saveData(combinedData)
      this.log('调试数据初始化完成')
      return result
    } catch (error) {
      this.logError('初始化调试数据失败', error)
      return { success: false, error: '初始化调试数据失败' }
    }
  }

  private calculateHealthStatus(creatinineLevel: number): 'normal' | 'warning' | 'danger' {
    // 肌酐正常范围：男性 59-104 µmol/L，女性 45-84 µmol/L
    // 使用男性标准作为默认值
    if (creatinineLevel < 59) {
      return 'normal'
    } else if (creatinineLevel <= 104) {
      return 'normal'
    } else if (creatinineLevel <= 150) {
      return 'warning'
    } else {
      return 'danger'
    }
  }

  private deepMerge(target: ObjectData, source: ObjectData): void {
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (typeof source[key] === 'object' && source[key] !== null &&
            typeof target[key] === 'object' && target[key] !== null) {
          this.deepMerge(target[key] as ObjectData, source[key] as ObjectData)
        } else {
          target[key] = source[key]
        }
      }
    }
  }

  private validateData(data: unknown): data is AppData {
    return data !== null &&
           typeof data === 'object' &&
           data !== undefined &&
           'user' in data &&
           'healthStatus' in data &&
           'chartData' in data
  }

  private validateRawData(data: unknown): boolean {
    return data !== null &&
           typeof data === 'object' &&
           data !== undefined &&
           'user' in data &&
           typeof (data as Record<string, unknown>).user === 'object' &&
           (data as Record<string, unknown>).user !== null &&
           'name' in ((data as Record<string, unknown>).user as Record<string, unknown>)
  }

  private validatePersonalData(data: unknown): data is PersonalData {
    return data !== null &&
           typeof data === 'object' &&
           data !== undefined &&
           'user' in data &&
           typeof (data as Record<string, unknown>).user === 'object' &&
           (data as Record<string, unknown>).user !== null &&
           'name' in ((data as Record<string, unknown>).user as Record<string, unknown>)
  }

  private validateHealthData(data: unknown): data is HealthData {
    return data !== null &&
           typeof data === 'object' &&
           data !== undefined &&
           'chartData' in data &&
           typeof (data as Record<string, unknown>).chartData === 'object'
  }
}

export const localDataManager = new LocalDataManager()
