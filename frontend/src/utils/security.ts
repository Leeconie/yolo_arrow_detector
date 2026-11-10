/**
 * @fileoverview 安全工具函数
 * @module utils/security
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 提供XSS防护、输入过滤等安全相关工具函数
 */

import DOMPurify from 'dompurify'
import { logger } from '@/core/logger'

/**
 * 清理HTML内容，防止XSS攻击
 * @param dirty 需要清理的HTML字符串
 * @param options DOMPurify配置选项
 * @returns 清理后的安全HTML字符串
 * @description 使用DOMPurify清理HTML内容，移除潜在的XSS攻击代码
 * @example
 * ```typescript
 * const safeHtml = sanitizeHtml('<script>alert("xss")</script><p>Safe content</p>')
 * // 返回: '<p>Safe content</p>'
 * ```
 */
export function sanitizeHtml(dirty: string, options?: import('dompurify').Config): string {
  if (!dirty) {
    return ''
  }

  // 默认配置：允许常用标签和属性，但移除危险内容
  const defaultOptions: import('dompurify').Config = {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      's',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'a',
      'img',
      'blockquote',
      'code',
      'pre',
      'span',
      'div',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id'],
    ALLOW_DATA_ATTR: false,
    ...options,
  }

  return DOMPurify.sanitize(dirty, defaultOptions) as string
}

/**
 * 转义HTML特殊字符
 * @param text 需要转义的文本
 * @returns 转义后的安全文本
 * @description 将HTML特殊字符转换为实体，防止XSS攻击
 * @example
 * ```typescript
 * const escaped = escapeHtml('<script>alert("xss")</script>')
 * // 返回: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 * ```
 */
export function escapeHtml(text: string): string {
  if (!text) {
    return ''
  }

  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }

  return text.replace(/[&<>"']/g, (char) => map[char] || char)
}

/**
 * 验证URL是否安全
 * @param url 需要验证的URL
 * @returns 是否安全
 * @description 检查URL是否为安全的http/https协议，防止javascript:等危险协议
 * @example
 * ```typescript
 * isSafeUrl('https://example.com') // true
 * isSafeUrl('javascript:alert("xss")') // false
 * ```
 */
export function isSafeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false
  }

  // 检查是否包含协议（必须）
  if (!/^https?:\/\//i.test(url) && !url.startsWith('/')) {
    // 既不是绝对URL（http/https开头），也不是相对路径（/开头），视为不安全
    return false
  }

  try {
    // 对于相对路径，直接返回true（由应用控制）
    if (url.startsWith('/')) {
      return true
    }

    const urlObj = new URL(url)
    // 只允许http和https协议
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    // URL解析失败，视为不安全
    return false
  }
}

/**
 * 清理URL，确保安全
 * @param url 需要清理的URL
 * @returns 清理后的安全URL，如果不安全则返回空字符串
 * @description 验证并清理URL，移除危险协议
 * @example
 * ```typescript
 * sanitizeUrl('javascript:alert("xss")') // 返回: ''
 * sanitizeUrl('https://example.com') // 返回: 'https://example.com'
 * ```
 */
export function sanitizeUrl(url: string): string {
  if (!url) {
    return ''
  }

  if (isSafeUrl(url)) {
    return url
  }

  return ''
}

/**
 * 检查localStorage中是否存储了敏感信息
 * @param key 存储键名
 * @param value 存储值
 * @returns 是否安全
 * @description 检查是否尝试存储敏感信息（如密码、token等）
 * @example
 * ```typescript
 * isSafeStorageKey('password', '123456') // false
 * isSafeStorageKey('theme', 'dark') // true
 * ```
 */
export function isSafeStorageKey(key: string, value?: string): boolean {
  if (!key) {
    return false
  }

  // 敏感键名列表
  const sensitiveKeys = ['password', 'pwd', 'pass', 'secret', 'token', 'key', 'credential', 'auth']

  const lowerKey = key.toLowerCase()

  // 检查键名
  for (const sensitiveKey of sensitiveKeys) {
    if (lowerKey.includes(sensitiveKey)) {
      return false
    }
  }

  // 如果提供了值，检查值是否包含明显的敏感信息
  if (value) {
    // 检查是否包含类似token的格式（长字符串）
    if (value.length > 50 && /^[a-zA-Z0-9_-]+$/.test(value)) {
      // 可能是token，但允许存储（因为我们需要存储token）
      // 这里只是警告，不阻止
    }
  }

  return true
}

/**
 * 安全的localStorage存储
 * @param key 存储键名
 * @param value 存储值
 * @param checkSensitive 是否检查敏感信息（默认false，因为某些场景需要存储token）
 * @description 提供安全的localStorage存储，包含敏感信息检查
 * @example
 * ```typescript
 * safeSetStorage('userToken', 'abc123', false) // 允许存储token
 * safeSetStorage('password', '123456', true) // 会警告但不阻止
 * ```
 */
export function safeSetStorage(key: string, value: string, checkSensitive = false): void {
  if (!key) {
    logger.warn('Storage key cannot be empty', {
      context: {
        module: 'utils',
        function: 'safeSetStorage',
      },
    })
    return
  }

  if (checkSensitive && !isSafeStorageKey(key, value)) {
    // 对于明确的敏感信息（如password），阻止存储
    const lowerKey = key.toLowerCase()
    const criticalSensitiveKeys = ['password', 'pwd', 'pass', 'secret', 'credential']

    if (criticalSensitiveKeys.some((sensitiveKey) => lowerKey.includes(sensitiveKey))) {
      logger.error('尝试存储关键敏感信息到localStorage，已阻止', {
        context: {
          module: 'utils',
          function: 'safeSetStorage',
        },
        data: {
          key,
        },
      })
      throw new Error(`Cannot store sensitive information: ${key}`)
    }

    // 其他敏感信息给出警告，但不阻止（如token需要存储）
    logger.warn('尝试存储敏感信息到localStorage', {
      context: {
        module: 'utils',
        function: 'safeSetStorage',
      },
      data: {
        key,
      },
    })
  }

  try {
    localStorage.setItem(key, value)
    logger.debug('安全存储数据到localStorage', {
      context: {
        module: 'utils',
        function: 'safeSetStorage',
      },
      data: {
        key,
        checkSensitive,
      },
    })
  } catch (error) {
    logger.error('安全存储数据失败', {
      context: {
        module: 'utils',
        function: 'safeSetStorage',
      },
      error: error instanceof Error ? error : new Error(String(error)),
      data: {
        key,
      },
    })
    throw error
  }
}

/**
 * 清理用户输入
 * @param input 用户输入
 * @param options 清理选项
 * @returns 清理后的安全输入
 * @description 综合清理用户输入，包括HTML清理和转义
 * @example
 * ```typescript
 * const safeInput = sanitizeInput('<script>alert("xss")</script>Hello')
 * // 返回: 'Hello' (移除了script标签)
 * ```
 */
export function sanitizeInput(
  input: string,
  options?: {
    /** 是否允许HTML标签 */
    allowHtml?: boolean
    /** 是否转义HTML */
    escapeHtml?: boolean
    /** 最大长度 */
    maxLength?: number
  },
): string {
  if (!input) {
    return ''
  }

  let result = input

  // 限制长度
  if (options?.maxLength && result.length > options.maxLength) {
    result = result.substring(0, options.maxLength)
  }

  // 如果允许HTML，使用DOMPurify清理
  if (options?.allowHtml) {
    result = sanitizeHtml(result)
  } else if (options?.escapeHtml !== false) {
    // 默认转义HTML
    result = escapeHtml(result)
  }

  return result
}
