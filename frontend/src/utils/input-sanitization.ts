/**
 * @fileoverview 输入清理工具
 * @module utils/input-sanitization
 * @description 提供输入清理功能，防止XSS攻击和其他注入攻击
 * @author HeZaoCha
 * @date 2026-01-10
 * @see {@link https://owasp.org/www-community/attacks/xss/ OWASP XSS}
 * @see {@link https://github.com/cure53/DOMPurify DOMPurify}
 */

import DOMPurify from 'dompurify'

/**
 * 清理HTML内容，防止XSS攻击
 * @param input 输入内容
 * @param allowHtml 是否允许HTML标签（默认false）
 * @returns 清理后的内容，如果输入为空则返回空字符串
 * @description
 * 使用DOMPurify清理HTML内容：
 * - allowHtml=false：完全移除所有HTML标签和属性
 * - allowHtml=true：仅允许安全的HTML标签（b, i, em, strong, a, p, br）和href属性
 * @example
 * ```typescript
 * const cleaned = sanitizeInput('<script>alert("xss")</script>')
 * // 输出：''（所有HTML标签被移除）
 *
 * const cleaned2 = sanitizeInput('<b>bold</b>', true)
 * // 输出：'<b>bold</b>'（允许的标签保留）
 * ```
 */
export function sanitizeInput(input: string, allowHtml = false): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  if (allowHtml) {
    // 允许HTML，但清理危险内容
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
      ALLOWED_ATTR: ['href'],
    })
  }

  // 不允许HTML，完全清理
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  })
}

/**
 * 清理URL，防止URL注入攻击
 * @param url URL字符串
 * @returns 清理后的URL或null（如果URL无效或协议不安全）
 * @description
 * 验证并清理URL，仅允许http和https协议，防止：
 * - javascript:协议注入
 * - data:协议注入
 * - 其他危险协议
 * @example
 * ```typescript
 * const safeUrl = sanitizeUrl('https://example.com')
 * // 输出：'https://example.com/'
 *
 * const unsafeUrl = sanitizeUrl('javascript:alert(1)')
 * // 输出：null
 * ```
 */
export function sanitizeUrl(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null
  }

  try {
    const parsedUrl = new URL(url)
    // 只允许http和https协议
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return null
    }
    return parsedUrl.toString()
  } catch {
    // 无效的URL
    return null
  }
}

/**
 * 清理JSON字符串，防止JSON注入攻击
 * @param jsonString JSON字符串
 * @returns 清理后的JSON对象或null（如果JSON无效）
 * @description
 * 解析JSON字符串并递归清理其中的所有字符串值，防止JSON注入攻击。
 * 会清理对象键名和值中的HTML标签。
 * @example
 * ```typescript
 * const json = '{"name": "<script>alert(1)</script>"}'
 * const cleaned = sanitizeJson(json)
 * // cleaned.name 不包含 <script> 标签
 * ```
 */
export function sanitizeJson(jsonString: string): unknown | null {
  if (!jsonString || typeof jsonString !== 'string') {
    return null
  }

  try {
    const parsed = JSON.parse(jsonString)
    // 递归清理对象中的字符串值
    return sanitizeObject(parsed)
  } catch {
    return null
  }
}

/**
 * 递归清理对象中的字符串值
 * @param obj 对象
 * @returns 清理后的对象
 */
function sanitizeObject(obj: unknown): unknown {
  if (typeof obj === 'string') {
    return sanitizeInput(obj)
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item))
  }

  if (obj && typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      // 清理键名
      const cleanKey = sanitizeInput(key)
      // 清理值
      sanitized[cleanKey] = sanitizeObject(value)
    }
    return sanitized
  }

  return obj
}

/**
 * 验证并清理用户输入
 * @param input 用户输入
 * @param maxLength 最大长度（默认1000字符）
 * @returns 清理后的输入，如果输入为空则返回空字符串
 * @description
 * 综合验证和清理用户输入：
 * - 限制输入长度（防止DoS攻击）
 * - 清理HTML标签（防止XSS攻击）
 * @example
 * ```typescript
 * const cleaned = validateAndSanitizeInput('<script>alert(1)</script>', 100)
 * // 输出：''（HTML标签被移除）
 * ```
 */
export function validateAndSanitizeInput(input: string, maxLength = 1000): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  // 限制长度
  if (input.length > maxLength) {
    input = input.substring(0, maxLength)
  }

  // 清理HTML
  return sanitizeInput(input)
}
