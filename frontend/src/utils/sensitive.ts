/**
 * @fileoverview 敏感信息保护工具
 * @module utils/sensitive
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 提供敏感信息脱敏、日志安全等功能
 */

import { mask } from './string'

/**
 * 敏感信息类型
 */
export enum SensitiveType {
  /** 手机号 */
  PHONE = 'phone',
  /** 邮箱 */
  EMAIL = 'email',
  /** 身份证号 */
  ID_CARD = 'idCard',
  /** 银行卡号 */
  BANK_CARD = 'bankCard',
  /** Token */
  TOKEN = 'token',
  /** 密码 */
  PASSWORD = 'password',
  /** 通用敏感信息 */
  GENERAL = 'general',
}

/**
 * 敏感信息脱敏配置
 */
const SENSITIVE_CONFIG: Record<SensitiveType, { start: number; end: number; maskChar?: string }> = {
  [SensitiveType.PHONE]: { start: 3, end: 4 }, // 138****8000
  [SensitiveType.EMAIL]: { start: 2, end: 3 }, // us***@example.com -> us***@ex***.com
  [SensitiveType.ID_CARD]: { start: 6, end: 4 }, // 110101199001011234 -> 110101********1234
  [SensitiveType.BANK_CARD]: { start: 4, end: 4 }, // 6222021234567890 -> 6222********7890
  [SensitiveType.TOKEN]: { start: 8, end: 8 }, // 前8后8，中间脱敏
  [SensitiveType.PASSWORD]: { start: 0, end: 0 }, // 全部脱敏
  [SensitiveType.GENERAL]: { start: 2, end: 2 }, // 前2后2
}

/**
 * 检测敏感信息类型
 * @param value 待检测的值
 * @returns 敏感信息类型，如果不是敏感信息则返回null
 */
export function detectSensitiveType(value: string): SensitiveType | null {
  if (!value || typeof value !== 'string') {
    return null
  }

  // 手机号检测（11位数字，以1开头）
  if (/^1[3-9]\d{9}$/.test(value)) {
    return SensitiveType.PHONE
  }

  // 邮箱检测
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return SensitiveType.EMAIL
  }

  // 身份证号检测（15位或18位）
  if (/^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(value)) {
    return SensitiveType.ID_CARD
  }

  // 银行卡号检测（16-19位数字）
  if (/^\d{16,19}$/.test(value)) {
    return SensitiveType.BANK_CARD
  }

  // Token检测（长字符串，通常包含字母数字和特殊字符）
  if (value.length > 20 && /^[a-zA-Z0-9_-]+$/.test(value)) {
    return SensitiveType.TOKEN
  }

  // 密码检测（通常不会在日志中出现，但为安全起见）
  if (value.toLowerCase().includes('password') || value.toLowerCase().includes('pwd')) {
    return SensitiveType.PASSWORD
  }

  return null
}

/**
 * 脱敏敏感信息
 * @param value 待脱敏的值
 * @param type 敏感信息类型（可选，如果不提供则自动检测）
 * @returns 脱敏后的值
 * @example
 * ```typescript
 * maskSensitive('13800138000') // '138****8000'
 * maskSensitive('user@example.com', SensitiveType.EMAIL) // 'us***@ex***.com'
 * ```
 */
export function maskSensitive(value: string, type?: SensitiveType): string {
  if (!value || typeof value !== 'string') {
    return value
  }

  // 如果没有指定类型，自动检测
  const detectedType = type || detectSensitiveType(value)
  if (!detectedType) {
    // 如果不是敏感信息，使用通用脱敏（前2后2）
    return mask(value, 2, 2)
  }

  const config = SENSITIVE_CONFIG[detectedType]

  // 特殊处理邮箱
  if (detectedType === SensitiveType.EMAIL) {
    const [localPart, domain] = value.split('@')
    if (!domain || !localPart) {
      return mask(value, config.start, config.end)
    }
    const maskedLocal = mask(localPart, config.start, config.end)
    const [domainName, ...tld] = domain.split('.')
    if (!domainName) {
      return mask(value, config.start, config.end)
    }
    const maskedDomain = mask(domainName, config.start, config.end)
    return `${maskedLocal}@${maskedDomain}.${tld.join('.')}`
  }

  return mask(value, config.start, config.end, config.maskChar)
}

/**
 * 脱敏对象中的敏感信息
 * @param obj 待脱敏的对象
 * @param sensitiveKeys 敏感字段名列表（可选）
 * @returns 脱敏后的对象
 * @description 递归处理对象，自动检测并脱敏敏感信息
 * @example
 * ```typescript
 * maskSensitiveObject({
 *   phone: '13800138000',
 *   email: 'user@example.com',
 *   name: 'John'
 * })
 * // { phone: '138****8000', email: 'us***@ex***.com', name: 'John' }
 * ```
 */
export function maskSensitiveObject<T extends Record<string, unknown>>(
  obj: T,
  sensitiveKeys?: string[],
): T {
  if (!obj || typeof obj !== 'object') {
    return obj
  }

  const result = { ...obj }
  const defaultSensitiveKeys = ['password', 'pwd', 'token', 'secret', 'key', 'credential', 'auth']

  for (const key in result) {
    if (Object.prototype.hasOwnProperty.call(result, key)) {
      const value = result[key]

      // 检查是否是敏感字段
      const isSensitiveKey =
        sensitiveKeys?.includes(key.toLowerCase()) ||
        defaultSensitiveKeys.some((sk) => key.toLowerCase().includes(sk))

      if (typeof value === 'string' && value) {
        if (isSensitiveKey) {
          // 敏感字段，根据字段名判断类型
          if (key.toLowerCase().includes('phone')) {
            result[key] = maskSensitive(value, SensitiveType.PHONE) as T[Extract<keyof T, string>]
          } else if (key.toLowerCase().includes('email')) {
            result[key] = maskSensitive(value, SensitiveType.EMAIL) as T[Extract<keyof T, string>]
          } else if (key.toLowerCase().includes('token')) {
            result[key] = maskSensitive(value, SensitiveType.TOKEN) as T[Extract<keyof T, string>]
          } else if (key.toLowerCase().includes('password') || key.toLowerCase().includes('pwd')) {
            result[key] = maskSensitive(value, SensitiveType.PASSWORD) as T[Extract<
              keyof T,
              string
            >]
          } else {
            result[key] = maskSensitive(value) as T[Extract<keyof T, string>]
          }
        } else {
          // 非敏感字段，但仍检测值本身
          const detectedType = detectSensitiveType(value)
          if (detectedType) {
            result[key] = maskSensitive(value, detectedType) as T[Extract<keyof T, string>]
          }
        }
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // 递归处理嵌套对象
        result[key] = maskSensitiveObject(
          value as Record<string, unknown>,
          sensitiveKeys,
        ) as T[Extract<keyof T, string>]
      } else if (Array.isArray(value)) {
        // 处理数组
        result[key] = value.map((item) => {
          if (typeof item === 'string' && item) {
            // 如果是敏感字段，或者值本身检测为敏感信息，才进行脱敏
            if (isSensitiveKey) {
              return maskSensitive(item)
            } else {
              // 非敏感字段，检测值本身是否为敏感信息
              const detectedType = detectSensitiveType(item)
              if (detectedType) {
                return maskSensitive(item, detectedType)
              }
              // 如果不是敏感信息，保持不变
              return item
            }
          } else if (typeof item === 'object' && item !== null) {
            return maskSensitiveObject(item as Record<string, unknown>, sensitiveKeys)
          }
          return item
        }) as T[Extract<keyof T, string>]
      }
    }
  }

  return result
}

/**
 * 安全的日志输出
 * @param level 日志级别
 * @param message 日志消息
 * @param data 日志数据（可选，会自动脱敏）
 * @description 输出日志时自动脱敏敏感信息
 * @example
 * ```typescript
 * safeLog('error', '请求失败', { token: 'abc123', phone: '13800138000' })
 * // 输出: [ERROR] 请求失败 { token: 'abc123****', phone: '138****8000' }
 * ```
 */
export function safeLog(
  level: 'log' | 'info' | 'warn' | 'error',
  message: string,
  data?: unknown,
): void {
  const timestamp = new Date().toISOString()
  const prefix = `[${level.toUpperCase()}] [${timestamp}]`

  if (data) {
    // 脱敏数据
    const maskedData =
      typeof data === 'object' && data !== null
        ? maskSensitiveObject(data as Record<string, unknown>)
        : typeof data === 'string'
          ? maskSensitive(data)
          : data

    console[level](prefix, message, maskedData)
  } else {
    console[level](prefix, message)
  }
}

/**
 * 脱敏错误消息
 * @param error 错误对象或消息
 * @returns 脱敏后的错误消息
 * @description 从错误对象中提取消息并脱敏
 */
export function maskErrorMessage(error: unknown): string {
  if (!error) {
    return '未知错误'
  }

  let message = ''

  if (error instanceof Error) {
    message = error.message
  } else if (typeof error === 'string') {
    message = error
  } else if (typeof error === 'object') {
    // 尝试从对象中提取message字段
    const errorObj = error as { message?: string; error?: string; msg?: string }
    message = errorObj.message || errorObj.error || errorObj.msg || JSON.stringify(error)
  } else {
    message = String(error)
  }

  // 脱敏消息中的敏感信息
  return maskSensitive(message)
}
