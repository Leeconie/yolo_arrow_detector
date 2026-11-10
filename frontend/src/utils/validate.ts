/**
 * @fileoverview 数据校验工具
 * @module utils/validate
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 提供邮箱、手机号、身份证等数据校验功能
 * 性能优化：预编译正则表达式、校验结果缓存、校验器复用
 * 性能监控：集成工具函数性能监控，记录函数执行时间和缓存命中率
 */

import { defaultUtilsPerformanceMonitor } from './performance-monitor'

/**
 * 预编译正则表达式（性能优化：避免重复创建正则对象）
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^1[3-9]\d{9}$/
const ID_CARD_REGEX = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/

/**
 * 校验结果缓存（性能优化：缓存常用值的校验结果）
 */
interface ValidationCacheItem {
  result: boolean
  expiresAt: number
}

class ValidationCache {
  private cache: Map<string, ValidationCacheItem> = new Map()
  private maxSize: number = 500
  private defaultTTL: number = 10 * 60 * 1000 // 10分钟

  getCached(value: string, validatorName: string): boolean | null {
    const key = `${value}:${validatorName}`
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

  setCached(value: string, validatorName: string, result: boolean): void {
    const key = `${value}:${validatorName}`

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

const validationCache = new ValidationCache()

/**
 * 邮箱校验
 * @param email 邮箱地址
 * @returns 是否为有效邮箱
 * @description 性能优化：使用预编译的正则表达式和结果缓存
 * @example
 * ```typescript
 * validateEmail('user@example.com') // true
 * validateEmail('invalid-email') // false
 * ```
 */
export function validateEmail(email: string): boolean {
  // 性能监控：记录函数执行开始
  const executionId = defaultUtilsPerformanceMonitor.startExecution('validateEmail')

  // 性能优化：检查缓存
  const cached = validationCache.getCached(email, 'validateEmail')
  if (cached !== null) {
    // 性能监控：记录缓存命中
    defaultUtilsPerformanceMonitor.recordCacheHit('validationCache')
    // 性能监控：记录函数执行结束
    defaultUtilsPerformanceMonitor.endExecution('validateEmail', executionId)
    return cached
  }

  // 性能监控：记录缓存未命中
  defaultUtilsPerformanceMonitor.recordCacheMiss('validationCache')

  // 性能优化：使用预编译的正则表达式
  const result = EMAIL_REGEX.test(email)

  // 性能优化：存储到缓存
  validationCache.setCached(email, 'validateEmail', result)

  // 性能监控：记录函数执行结束
  defaultUtilsPerformanceMonitor.endExecution('validateEmail', executionId)

  return result
}

/**
 * 手机号校验（中国大陆）
 * @param phone 手机号
 * @returns 是否为有效手机号
 * @description 性能优化：使用预编译的正则表达式和结果缓存
 * @example
 * ```typescript
 * validatePhone('13800138000') // true
 * validatePhone('12345678901') // false
 * ```
 */
export function validatePhone(phone: string): boolean {
  // 性能监控：记录函数执行开始
  const executionId = defaultUtilsPerformanceMonitor.startExecution('validatePhone')

  // 性能优化：检查缓存
  const cached = validationCache.getCached(phone, 'validatePhone')
  if (cached !== null) {
    // 性能监控：记录缓存命中
    defaultUtilsPerformanceMonitor.recordCacheHit('validationCache')
    // 性能监控：记录函数执行结束
    defaultUtilsPerformanceMonitor.endExecution('validatePhone', executionId)
    return cached
  }

  // 性能监控：记录缓存未命中
  defaultUtilsPerformanceMonitor.recordCacheMiss('validationCache')

  // 性能优化：使用预编译的正则表达式
  const result = PHONE_REGEX.test(phone)

  // 性能优化：存储到缓存
  validationCache.setCached(phone, 'validatePhone', result)

  // 性能监控：记录函数执行结束
  defaultUtilsPerformanceMonitor.endExecution('validatePhone', executionId)

  return result
}

/**
 * 身份证号校验（中国大陆18位）
 * @param idCard 身份证号
 * @returns 是否为有效身份证号
 * @description 性能优化：使用预编译的正则表达式和结果缓存
 * @example
 * ```typescript
 * validateIdCard('110101199001011234') // true
 * validateIdCard('123456789012345678') // false
 * ```
 */
export function validateIdCard(idCard: string): boolean {
  // 性能监控：记录函数执行开始
  const executionId = defaultUtilsPerformanceMonitor.startExecution('validateIdCard')

  // 性能优化：检查缓存
  const cached = validationCache.getCached(idCard, 'validateIdCard')
  if (cached !== null) {
    // 性能监控：记录缓存命中
    defaultUtilsPerformanceMonitor.recordCacheHit('validationCache')
    // 性能监控：记录函数执行结束
    defaultUtilsPerformanceMonitor.endExecution('validateIdCard', executionId)
    return cached
  }

  // 性能监控：记录缓存未命中
  defaultUtilsPerformanceMonitor.recordCacheMiss('validationCache')

  // 性能优化：使用预编译的正则表达式
  if (!ID_CARD_REGEX.test(idCard)) {
    validationCache.setCached(idCard, 'validateIdCard', false)
    // 性能监控：记录函数执行结束
    defaultUtilsPerformanceMonitor.endExecution('validateIdCard', executionId)
    return false
  }

  // 校验码验证
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
  const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']
  let sum = 0

  for (let i = 0; i < 17; i++) {
    const char = idCard[i]
    if (!char) {
      // 性能监控：记录函数执行结束
      defaultUtilsPerformanceMonitor.endExecution('validateIdCard', executionId)
      return false
    }
    const weight = weights[i]
    if (weight === undefined) {
      // 性能监控：记录函数执行结束
      defaultUtilsPerformanceMonitor.endExecution('validateIdCard', executionId)
      return false
    }
    sum += parseInt(char) * weight
  }

  const checkCode = checkCodes[sum % 11]
  const lastChar = idCard[17]
  if (!lastChar) {
    validationCache.setCached(idCard, 'validateIdCard', false)
    // 性能监控：记录函数执行结束
    defaultUtilsPerformanceMonitor.endExecution('validateIdCard', executionId)
    return false
  }

  const result = lastChar.toUpperCase() === checkCode

  // 性能优化：存储到缓存
  validationCache.setCached(idCard, 'validateIdCard', result)

  // 性能监控：记录函数执行结束
  defaultUtilsPerformanceMonitor.endExecution('validateIdCard', executionId)

  return result
}

/**
 * URL校验
 * @param url URL地址
 * @returns 是否为有效URL
 * @example
 * ```typescript
 * validateUrl('https://example.com') // true
 * validateUrl('invalid-url') // false
 * ```
 */
export function validateUrl(url: string): boolean {
  // 性能监控：记录函数执行开始
  const executionId = defaultUtilsPerformanceMonitor.startExecution('validateUrl')

  try {
    new URL(url)
    // 性能监控：记录函数执行结束
    defaultUtilsPerformanceMonitor.endExecution('validateUrl', executionId)
    return true
  } catch {
    // 性能监控：记录函数执行结束
    defaultUtilsPerformanceMonitor.endExecution('validateUrl', executionId)
    return false
  }
}
