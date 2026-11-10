/**
 * @fileoverview Token刷新机制
 * @module core/api/token-refresh
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 提供Token自动刷新、过期检测等功能
 */

import { useUserStore } from '@/stores/modules/user'
import { get } from './request'
import type { LoginResponse } from '@/types/user'
import { logger } from '@/core/logger'

/**
 * Token刷新状态
 */
interface TokenRefreshState {
  /** 是否正在刷新 */
  isRefreshing: boolean
  /** 刷新请求的Promise */
  refreshPromise: Promise<string> | null
}

/**
 * Token刷新状态
 */
const refreshState: TokenRefreshState = {
  isRefreshing: false,
  refreshPromise: null,
}

/**
 * Token刷新配置
 */
export interface TokenRefreshConfig {
  /** Token过期前多少秒开始刷新（默认300秒，即5分钟） */
  refreshBeforeExpires?: number
  /** 刷新Token的API端点 */
  refreshEndpoint?: string
  /** 是否自动刷新 */
  autoRefresh?: boolean
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: Required<TokenRefreshConfig> = {
  refreshBeforeExpires: 300, // 5分钟
  // 注意：baseURL已经包含/api，所以这里只需要/auth/refresh
  refreshEndpoint: '/auth/refresh',
  autoRefresh: true,
}

/**
 * 解析JWT Token（简单解析，不验证签名）
 * @param token JWT Token字符串
 * @returns Token的payload部分，如果解析失败返回null
 * @description 仅用于解析Token中的过期时间等信息，不进行签名验证
 */
export function parseJwtToken(token: string): { exp?: number; iat?: number } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    // 解码payload（Base64）
    const payload = parts[1]
    if (!payload) {
      return null
    }
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

/**
 * 检查Token是否即将过期
 * @param token JWT Token字符串
 * @param refreshBeforeExpires 过期前多少秒开始刷新
 * @returns 是否即将过期
 */
export function isTokenExpiringSoon(token: string, refreshBeforeExpires = 300): boolean {
  const payload = parseJwtToken(token)
  if (!payload?.exp) {
    // 如果不是JWT Token或没有过期时间，返回false
    return false
  }

  const expiresAt = payload.exp * 1000 // 转换为毫秒
  const now = Date.now()
  const timeUntilExpires = expiresAt - now

  // 如果剩余时间少于refreshBeforeExpires秒，则认为即将过期
  return timeUntilExpires < refreshBeforeExpires * 1000
}

/**
 * 检查Token是否已过期
 * @param token JWT Token字符串
 * @returns 是否已过期
 */
export function isTokenExpired(token: string): boolean {
  const payload = parseJwtToken(token)
  if (!payload?.exp) {
    // 如果不是JWT Token或没有过期时间，认为未过期
    return false
  }

  const expiresAt = payload.exp * 1000 // 转换为毫秒
  return Date.now() >= expiresAt
}

/**
 * 刷新Token
 * @param config 刷新配置
 * @returns 新的Token
 * @description 调用刷新Token接口获取新的Token
 */
export async function refreshToken(config: TokenRefreshConfig = {}): Promise<string> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  // 如果正在刷新，返回现有的刷新Promise
  if (refreshState.isRefreshing && refreshState.refreshPromise) {
    logger.debug('Token正在刷新中，复用现有刷新请求', {
      context: {
        module: 'api',
        function: 'refreshToken',
      },
    })
    return refreshState.refreshPromise
  }

  logger.info('开始刷新Token', {
    context: {
      module: 'api',
      function: 'refreshToken',
    },
    data: {
      refreshEndpoint: finalConfig.refreshEndpoint,
    },
  })

  // 开始刷新
  refreshState.isRefreshing = true

  const refreshPromise = (async () => {
    try {
      // 调用刷新Token接口
      const response = await get<LoginResponse>(
        finalConfig.refreshEndpoint,
        {},
        { skipRetry: true },
      )

      if (response.accessToken) {
        // 更新Store中的Token
        const userStore = useUserStore()
        userStore.setToken(response.accessToken)

        // 如果返回了用户信息，也更新
        if (response.userInfo) {
          userStore.setUserInfo(response.userInfo)
        }

        logger.info('Token刷新成功', {
          context: {
            module: 'api',
            function: 'refreshToken',
          },
          data: {
            hasUserInfo: !!response.userInfo,
          },
        })

        return response.accessToken
      }

      throw new Error('刷新Token失败：未返回新Token')
    } catch (error) {
      logger.error('Token刷新失败', {
        context: {
          module: 'api',
          function: 'refreshToken',
        },
        error: error instanceof Error ? error : new Error(String(error)),
      })
      // 刷新失败，清除Token并跳转登录
      const userStore = useUserStore()
      userStore.logout()
      window.location.href = '/login'
      throw error
    } finally {
      // 重置刷新状态
      refreshState.isRefreshing = false
      refreshState.refreshPromise = null
      logger.debug('Token刷新状态已重置', {
        context: {
          module: 'api',
          function: 'refreshToken',
        },
      })
    }
  })()

  refreshState.refreshPromise = refreshPromise
  return refreshPromise
}

/**
 * 检查并自动刷新Token
 * @param config 刷新配置
 * @returns 当前有效的Token
 * @description 如果Token即将过期，自动刷新
 */
export async function checkAndRefreshToken(config: TokenRefreshConfig = {}): Promise<string> {
  const userStore = useUserStore()
  const currentToken = userStore.token

  if (!currentToken) {
    logger.warn('检查Token时未找到Token', {
      context: {
        module: 'api',
        function: 'checkAndRefreshToken',
      },
    })
    throw new Error('未找到Token')
  }

  // 检查Token是否已过期
  if (isTokenExpired(currentToken)) {
    logger.warn('Token已过期，开始刷新', {
      context: {
        module: 'api',
        function: 'checkAndRefreshToken',
      },
    })
    // Token已过期，尝试刷新
    return refreshToken(config)
  }

  // 检查Token是否即将过期
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  if (isTokenExpiringSoon(currentToken, finalConfig.refreshBeforeExpires)) {
    logger.info('Token即将过期，自动刷新', {
      context: {
        module: 'api',
        function: 'checkAndRefreshToken',
      },
      data: {
        refreshBeforeExpires: finalConfig.refreshBeforeExpires,
        autoRefresh: finalConfig.autoRefresh,
      },
    })
    // Token即将过期，自动刷新
    if (finalConfig.autoRefresh) {
      return refreshToken(config)
    }
  }

  logger.debug('Token检查通过，无需刷新', {
    context: {
      module: 'api',
      function: 'checkAndRefreshToken',
    },
  })

  return currentToken
}
