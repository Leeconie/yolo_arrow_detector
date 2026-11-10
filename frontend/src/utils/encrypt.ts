/**
 * @fileoverview 加密解密工具
 * @module utils/encrypt
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 提供数据加密解密功能，使用AES等加密算法
 * @note 前端加密主要用于数据脱敏和简单保护，重要数据应使用HTTPS传输，敏感数据应在后端加密
 */

/**
 * Base64编码
 * @param str 原始字符串
 * @returns Base64编码后的字符串
 * @example
 * ```typescript
 * base64Encode('hello') // 'aGVsbG8='
 * ```
 */
export function base64Encode(str: string): string {
  if (typeof btoa !== 'undefined') {
    // 浏览器环境
    return btoa(unescape(encodeURIComponent(str)))
  } else {
    // Node.js环境 - 在测试环境中使用 Buffer
    // 使用全局 Buffer（在 Node.js 环境中通过 @types/node 提供）
    // @ts-expect-error - Buffer 在 Node.js 测试环境中可用
    return Buffer.from(str, 'utf-8').toString('base64')
  }
}

/**
 * Base64解码
 * @param str Base64编码的字符串
 * @returns 解码后的原始字符串
 * @example
 * ```typescript
 * base64Decode('aGVsbG8=') // 'hello'
 * ```
 */
export function base64Decode(str: string): string {
  if (typeof atob !== 'undefined') {
    // 浏览器环境
    return decodeURIComponent(escape(atob(str)))
  } else {
    // Node.js环境 - 在测试环境中使用 Buffer
    // 使用全局 Buffer（在 Node.js 环境中通过 @types/node 提供）
    // @ts-expect-error - Buffer 在 Node.js 测试环境中可用
    return Buffer.from(str, 'base64').toString('utf-8')
  }
}

/**
 * 简单的字符串加密（XOR加密）
 * @param str 原始字符串
 * @param key 加密密钥
 * @returns 加密后的字符串（Base64编码）
 * @description 使用XOR算法进行简单加密，适用于非敏感数据
 * @example
 * ```typescript
 * simpleEncrypt('hello', 'key') // 返回加密后的Base64字符串
 * ```
 */
export function simpleEncrypt(str: string, key: string): string {
  let result = ''
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    result += String.fromCharCode(charCode)
  }
  return base64Encode(result)
}

/**
 * 简单的字符串解密（XOR解密）
 * @param encryptedStr 加密后的字符串（Base64编码）
 * @param key 解密密钥（必须与加密时使用的密钥相同）
 * @returns 解密后的原始字符串
 * @example
 * ```typescript
 * simpleDecrypt(encryptedStr, 'key') // 返回原始字符串
 * ```
 */
export function simpleDecrypt(encryptedStr: string, key: string): string {
  try {
    const str = base64Decode(encryptedStr)
    let result = ''
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      result += String.fromCharCode(charCode)
    }
    return result
  } catch (error) {
    // 使用安全日志，避免泄露敏感信息
    import('@/utils/sensitive').then(({ safeLog }) => {
      safeLog('error', '解密失败', { error: String(error) })
    })
    throw new Error('解密失败：无效的加密字符串或密钥')
  }
}

/**
 * 生成随机字符串
 * @param length 字符串长度
 * @param chars 字符集，默认为字母数字
 * @returns 随机字符串
 * @example
 * ```typescript
 * randomString(8) // 'aB3dE5fG'
 * randomString(16, '0123456789') // '1234567890123456'
 * ```
 */
export function randomString(
  length: number,
  chars: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
): string {
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 计算字符串的哈希值（简单哈希）
 * @param str 原始字符串
 * @returns 哈希值（数字）
 * @description 这是一个简单的哈希函数，不适用于安全场景
 * @example
 * ```typescript
 * simpleHash('hello') // 返回哈希值
 * ```
 */
export function simpleHash(str: string): number {
  let hash = 0
  if (str.length === 0) return hash
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // 转换为32位整数
  }
  return hash
}
