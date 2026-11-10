/**
 * @fileoverview Token缓存模块
 * @module core/api/token-cache
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 提供Token和CSRF Token的内存缓存，减少重复获取
 */

import { useUserStore } from '@/stores/modules/user'
import { checkAndRefreshToken } from './token-refresh'
import { getCsrfToken } from './csrf'

/**
 * Token缓存类
 * @description 缓存Token，减少重复获取和刷新
 */
class TokenCache {
  /** 缓存的Token */
  private token: string | null = null
  /** Token过期时间 */
  private expiresAt: number = 0
  /** 缓存有效期（毫秒），默认5分钟 */
  private cacheTTL: number = 5 * 60 * 1000

  /**
   * 获取Token
   * @returns Token，如果不存在则返回null
   * @description 从缓存获取Token，如果缓存过期则刷新
   */
  async getToken(): Promise<string | null> {
    // 如果缓存有效，直接返回
    if (this.token && Date.now() < this.expiresAt) {
      return this.token
    }

    // 从Store获取Token
    const userStore = useUserStore()
    if (!userStore.token) {
      this.clear()
      return null
    }

    // 检查并刷新Token
    try {
      const validToken = await checkAndRefreshToken()
      this.token = validToken
      this.expiresAt = Date.now() + this.cacheTTL
      return validToken
    } catch {
      // 刷新失败，使用当前Token
      this.token = userStore.token
      this.expiresAt = Date.now() + this.cacheTTL
      return this.token
    }
  }

  /**
   * 清除Token缓存
   */
  clear(): void {
    this.token = null
    this.expiresAt = 0
  }
}

/**
 * CSRF Token缓存类
 * @description 缓存CSRF Token，减少重复生成
 */
class CsrfTokenCache {
  /** 缓存的CSRF Token */
  private token: string | null = null
  /** Token过期时间 */
  private expiresAt: number = 0
  /** 缓存有效期（毫秒），默认1小时 */
  private cacheTTL: number = 60 * 60 * 1000

  /**
   * 获取CSRF Token
   * @returns CSRF Token
   * @description 从缓存获取CSRF Token，如果缓存过期则重新获取
   */
  getToken(): string {
    // 如果缓存有效，直接返回
    if (this.token && Date.now() < this.expiresAt) {
      return this.token
    }

    // 从storage获取或生成新Token
    this.token = getCsrfToken()
    this.expiresAt = Date.now() + this.cacheTTL
    return this.token
  }

  /**
   * 清除CSRF Token缓存
   */
  clear(): void {
    this.token = null
    this.expiresAt = 0
  }
}

/**
 * Token缓存实例
 */
export const tokenCache = new TokenCache()

/**
 * CSRF Token缓存实例
 */
export const csrfTokenCache = new CsrfTokenCache()
