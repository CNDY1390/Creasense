import type { ChartData, RawDataPoint } from '@/types/app'

// 缓存系统
const cache = new Map<string, CacheEntry>()
const CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

interface CacheEntry {
  data: unknown
  timestamp: number
}

/**
 * 获取缓存数据
 */
function getCachedData<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null

  const now = Date.now()
  if (now - entry.timestamp > CACHE_DURATION) {
    cache.delete(key)
    return null
  }

  return entry.data as T
}

/**
 * 设置缓存数据
 */
function setCachedData<T>(key: string, data: T): void {
  cache.set(key, {
    data,
    timestamp: Date.now()
  })
}

/**
 * 清除缓存
 */
export function clearCache(): void {
  cache.clear()
}

/**
 * 从原始数据中获取指定时间范围的数据
 */
function getDataInRange(rawData: RawDataPoint[], startTime: Date, endTime: Date): RawDataPoint[] {
  return rawData.filter(point => {
    const pointTime = new Date(point.time)
    return pointTime >= startTime && pointTime <= endTime
  })
}

/**
 * 动态计算每日数据
 */
export function calculateDailyData(rawData: RawDataPoint[]): Array<{ time: string; value: number }> {
  const cacheKey = 'daily_all'
  const cached = getCachedData<Array<{ time: string; value: number }>>(cacheKey)
  if (cached) return cached

  const result = rawData.map(point => ({
    time: point.time,
    value: point.value
  }))

  setCachedData(cacheKey, result)
  return result
}

/**
 * 动态计算每周数据
 */
export function calculateWeeklyData(rawData: RawDataPoint[], days: number = 7): Array<{ date: string; value: number }> {
  const cacheKey = `weekly_${days}`
  const cached = getCachedData<Array<{ date: string; value: number }>>(cacheKey)
  if (cached) return cached

  // 如果没有数据，返回空数组
  if (!rawData || rawData.length === 0) {
    return []
  }

  // 获取数据的时间范围
  const dataDates = rawData.map(point => new Date(point.time))
  const maxDate = new Date(Math.max(...dataDates.map(d => d.getTime())))

  // 计算最近7天的数据
  const endDate = new Date(maxDate)
  const startDate = new Date(maxDate)
  startDate.setDate(endDate.getDate() - days + 1)
  startDate.setHours(0, 0, 0, 0)

  const filteredData = getDataInRange(rawData, startDate, endDate)

  // 按日期分组
  const dailyGroups = new Map<string, number[]>()

  filteredData.forEach(point => {
    const date = new Date(point.time).toISOString().split('T')[0]
    if (!dailyGroups.has(date)) {
      dailyGroups.set(date, [])
    }
    dailyGroups.get(date)!.push(point.value)
  })

  // 计算每天的平均值
  const result: Array<{ date: string; value: number }> = []

  dailyGroups.forEach((values, date) => {
    const average = Math.round(values.reduce((sum, val) => sum + val, 0) / values.length)
    result.push({
      date,
      value: average
    })
  })

  // 按日期排序
  result.sort((a, b) => a.date.localeCompare(b.date))

  setCachedData(cacheKey, result)
  return result
}

/**
 * 动态计算每月数据
 */
export function calculateMonthlyData(rawData: RawDataPoint[], months: number = 3): Array<{ month: string; value: number }> {
  const cacheKey = `monthly_${months}`
  const cached = getCachedData<Array<{ month: string; value: number }>>(cacheKey)
  if (cached) return cached

  // 如果没有数据，返回空数组
  if (!rawData || rawData.length === 0) {
    return []
  }

  // 获取数据的时间范围
  const dataDates = rawData.map(point => new Date(point.time))
  const maxDate = new Date(Math.max(...dataDates.map(d => d.getTime())))

  // 计算数据范围内的所有月份
  const endDate = new Date(maxDate)
  const startDate = new Date(Math.min(...dataDates.map(d => d.getTime())))
  startDate.setDate(1)
  startDate.setHours(0, 0, 0, 0)

  const filteredData = getDataInRange(rawData, startDate, endDate)

  // 按月份分组
  const monthlyGroups = new Map<string, number[]>()

  filteredData.forEach(point => {
    const date = new Date(point.time)
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!monthlyGroups.has(month)) {
      monthlyGroups.set(month, [])
    }
    monthlyGroups.get(month)!.push(point.value)
  })

  // 计算每月的平均值
  const result: Array<{ month: string; value: number }> = []

  monthlyGroups.forEach((values, month) => {
    const average = Math.round(values.reduce((sum, val) => sum + val, 0) / values.length)
    result.push({
      month,
      value: average
    })
  })

  // 按月份排序
  result.sort((a, b) => a.month.localeCompare(b.month))

  setCachedData(cacheKey, result)
  return result
}

/**
 * 添加新的数据点
 */
export function addDataPoint(chartData: ChartData, newPoint: RawDataPoint): ChartData {
  const updatedRawData = [...(chartData.rawData || []), newPoint]

  // 清除缓存，因为数据已更新
  clearCache()

  return {
    rawData: updatedRawData
  }
}

/**
 * 获取指定周期的数据
 */
export function getDataForPeriod(
  chartData: ChartData,
  period: 'daily' | 'weekly' | 'monthly'
): Array<{ time?: string; date?: string; month?: string; value: number }> {
  const rawData = chartData.rawData || []

  switch (period) {
    case 'daily':
      return calculateDailyData(rawData)
    case 'weekly':
      return calculateWeeklyData(rawData)
    case 'monthly':
      return calculateMonthlyData(rawData)
    default:
      return []
  }
}
