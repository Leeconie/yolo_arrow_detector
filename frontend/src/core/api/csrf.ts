/**
 * @fileoverview CSRF防护工具
 * @module core/api/csrf
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 提供CSRF Token管理、生成、验证等功能
 */

import { getStorage, setStorage, removeStorage } from '@/utils/storage'

/**
 * CSRF Token存储键
 */
const CSRF_TOKEN_KEY = 'csrfToken'

/**
 * CSRF Token过期时间（秒，默认1小时）
 */
const CSRF_TOKEN_EXPIRES = 3600

/**
 * 生成CSRF Token
 * @returns CSRF Token字符串
 * @description 生成一个随机的CSRF Token，用于防止CSRF攻击
 */
export function generateCsrfToken(): string {
  // 使用crypto API生成随机Token（如果可用）
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
  }

  // 降级方案：使用Math.random
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15) +
    Date.now().toString(36)
  )
}

/**
 * 获取CSRF Token
 * @returns CSRF Token，如果不存在则生成新的
 * @description 从localStorage获取CSRF Token，如果不存在或已过期则生成新的
 */
export function getCsrfToken(): string {
  const token = getStorage<string>(CSRF_TOKEN_KEY)
  if (token) {
    return token
  }

  // 如果不存在，生成新的Token
  const newToken = generateCsrfToken()
  setCsrfToken(newToken)
  return newToken
}

/**
 * 设置CSRF Token
 * @param token CSRF Token值
 * @description 将CSRF Token存储到localStorage，设置过期时间
 */
export function setCsrfToken(token: string): void {
  setStorage(CSRF_TOKEN_KEY, token, CSRF_TOKEN_EXPIRES)
}

/**
 * 清除CSRF Token
 * @description 清除localStorage中的CSRF Token
 */
export function clearCsrfToken(): void {
  removeStorage(CSRF_TOKEN_KEY)
}

/**
 * 验证CSRF Token
 * @param token 待验证的Token
 * @returns 是否有效
 * @description 验证Token是否存在且未过期
 */
export function validateCsrfToken(token: string): boolean {
  if (!token) {
    return false
  }

  const storedToken = getStorage<string>(CSRF_TOKEN_KEY)
  return storedToken === token
}

/**
 * 刷新CSRF Token
 * @returns 新的CSRF Token
 * @description 生成新的CSRF Token并替换旧的
 */
export function refreshCsrfToken(): string {
  const newToken = generateCsrfToken()
  setCsrfToken(newToken)
  return newToken
}
