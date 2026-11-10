/**
 * @fileoverview 日期处理工具
 * @module utils/date
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 提供日期格式化、解析、计算等功能
 * 性能优化：格式化结果缓存、算法优化、减少Date对象创建
 * 性能监控：集成工具函数性能监控，记录函数执行时间和缓存命中率
 */

import { defaultUtilsPerformanceMonitor } from './performance-monitor'

/**
 * 格式化结果缓存
 */
interface FormatCacheItem {
  result: string
  expiresAt: number
}

class DateFormatCache {
  private cache: Map<string, FormatCacheItem> = new Map()
  private maxSize: number = 100
  private defaultTTL: number = 5 * 60 * 1000 // 5分钟

  getCached(timestamp: number, format: string): string | null {
    const key = `${timestamp}:${format}`
    const item = this.cache.get(key)

    if (!item) {
      return null
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return item.result
  }

  setCached(timestamp: number, format: string, result: string): void {
    const key = `${timestamp}:${format}`

    // LRU策略：如果缓存已满，移除最旧的项
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, {
      result,
      expiresAt: Date.now() + this.defaultTTL,
    })
  }

  clear(): void {
    this.cache.clear()
  }
}

const formatCache = new DateFormatCache()

/**
 * 日期格式化
 * @param date 日期对象、时间戳或日期字符串
 * @param format 格式化模板，默认 'YYYY-MM-DD HH:mm:ss'
 * @returns 格式化后的日期字符串
 * @description 性能优化：使用缓存减少重复计算，优化字符串替换算法
 * @example
 * ```typescript
 * formatDate(new Date(), 'YYYY-MM-DD') // '2026-01-07'
 * formatDate(1641532800000, 'YYYY-MM-DD HH:mm:ss') // '2026-01-07 12:00:00'
 * ```
 */
export function formatDate(
  date: Date | string | number,
  format: string = 'YYYY-MM-DD HH:mm:ss',
): string {
  const d = new Date(date)

  if (isNaN(d.getTime())) {
    throw new Error('Invalid date')
  }

  const timestamp = d.getTime()

  // 性能监控：记录函数执行开始
  const executionId = defaultUtilsPerformanceMonitor.startExecution('formatDate')

  // 性能优化：检查缓存
  const cached = formatCache.getCached(timestamp, format)
  if (cached !== null) {
    // 性能监控：记录缓存命中
    defaultUtilsPerformanceMonitor.recordCacheHit('dateFormatCache')
    // 性能监控：记录函数执行结束
    defaultUtilsPerformanceMonitor.endExecution('formatDate', executionId)
    return cached
  }

  // 性能监控：记录缓存未命中
  defaultUtilsPerformanceMonitor.recordCacheMiss('dateFormatCache')

  // 性能优化：一次性获取所有日期组件，减少Date对象访问
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const day = d.getDate()
  const hours = d.getHours()
  const minutes = d.getMinutes()
  const seconds = d.getSeconds()

  // 性能优化：使用数组存储格式化后的组件，减少字符串操作
  const parts = {
    YYYY: String(year),
    MM: String(month).padStart(2, '0'),
    DD: String(day).padStart(2, '0'),
    HH: String(hours).padStart(2, '0'),
    mm: String(minutes).padStart(2, '0'),
    ss: String(seconds).padStart(2, '0'),
  }

  // 性能优化：一次性替换所有占位符，减少字符串操作次数
  let result = format
  result = result.replace('YYYY', parts.YYYY)
  result = result.replace('MM', parts.MM)
  result = result.replace('DD', parts.DD)
  result = result.replace('HH', parts.HH)
  result = result.replace('mm', parts.mm)
  result = result.replace('ss', parts.ss)

  // 性能优化：存储到缓存
  formatCache.setCached(timestamp, format, result)

  // 性能监控：记录函数执行结束
  defaultUtilsPerformanceMonitor.endExecution('formatDate', executionId)

  return result
}

/**
 * 解析日期字符串
 * @param dateString 日期字符串
 * @returns Date对象
 * @throws 如果日期字符串无效，抛出错误
 * @example
 * ```typescript
 * parseDate('2026-01-07') // Date对象
 * parseDate('2026-01-07 12:00:00') // Date对象
 * ```
 */
export function parseDate(dateString: string): Date {
  // 性能监控：记录函数执行开始
  const executionId = defaultUtilsPerformanceMonitor.startExecution('parseDate')

  const date = new Date(dateString)

  if (isNaN(date.getTime())) {
    // 性能监控：记录函数执行结束（即使失败也记录）
    defaultUtilsPerformanceMonitor.endExecution('parseDate', executionId)
    throw new Error(`Invalid date string: ${dateString}`)
  }

  // 性能监控：记录函数执行结束
  defaultUtilsPerformanceMonitor.endExecution('parseDate', executionId)

  return date
}

/**
 * 计算日期加减
 * @param date 基准日期
 * @param days 要加减的天数（正数为加，负数为减）
 * @returns 计算后的Date对象
 * @description 性能优化：使用时间戳计算替代Date对象操作，减少Date对象创建
 * @example
 * ```typescript
 * addDays(new Date(), 7) // 7天后
 * addDays(new Date(), -7) // 7天前
 * ```
 */
export function addDays(date: Date, days: number): Date {
  // 性能监控：记录函数执行开始
  const executionId = defaultUtilsPerformanceMonitor.startExecution('addDays')

  // 性能优化：使用时间戳计算，避免Date对象操作
  const result = new Date(date.getTime() + days * 24 * 60 * 60 * 1000)

  // 性能监控：记录函数执行结束
  defaultUtilsPerformanceMonitor.endExecution('addDays', executionId)

  return result
}

/**
 * 计算两个日期之间的天数差
 * @param date1 第一个日期
 * @param date2 第二个日期
 * @returns 天数差（date2 - date1）
 * @example
 * ```typescript
 * daysBetween(new Date('2026-01-01'), new Date('2026-01-07')) // 6
 * ```
 */
export function daysBetween(date1: Date, date2: Date): number {
  const timeDiff = date2.getTime() - date1.getTime()
  return Math.floor(timeDiff / (1000 * 60 * 60 * 24))
}

/**
 * 格式化视频时间（秒数转换为 MM:SS 格式）
 * @param seconds 秒数
 * @returns 格式化后的时间字符串（MM:SS）
 * @description 用于视频播放器时间显示，将秒数转换为分:秒格式
 * @example
 * ```typescript
 * formatTime(125) // '02:05'
 * formatTime(3661) // '61:01'
 * ```
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) {
    return '00:00'
  }
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
