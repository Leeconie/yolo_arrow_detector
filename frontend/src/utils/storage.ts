/**
 * @fileoverview 本地存储工具
 * @module utils/storage
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 提供localStorage和sessionStorage的封装，支持过期机制
 */

import { logger } from '@/core/logger'

/**
 * 存储项接口
 */
interface StorageItem<T = unknown> {
  /** 数据值 */
  value: T
  /** 过期时间戳（毫秒），0表示永不过期 */
  expires: number
}

/**
 * 设置localStorage
 * @param key 存储键
 * @param value 存储值
 * @param expiresIn 过期时间（秒），0表示永不过期
 * @example
 * ```typescript
 * setStorage('key', 'value', 3600) // 存储1小时
 * setStorage('key', 'value', 0) // 永久存储
 * ```
 */
export function setStorage<T = unknown>(key: string, value: T, expiresIn: number = 0): void {
  const item: StorageItem<T> = {
    value,
    expires: expiresIn > 0 ? Date.now() + expiresIn * 1000 : 0,
  }

  try {
    localStorage.setItem(key, JSON.stringify(item))
    logger.debug('数据已存储到localStorage', {
      context: {
        module: 'utils',
        function: 'setStorage',
      },
      data: {
        key,
        expiresIn,
        hasExpires: expiresIn > 0,
      },
    })
  } catch (error: unknown) {
    logger.error('存储数据失败', {
      context: {
        module: 'utils',
        function: 'setStorage',
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
 * 获取localStorage
 * @param key 存储键
 * @param defaultValue 默认值（当数据不存在或已过期时返回）
 * @returns 存储的值或默认值
 * @example
 * ```typescript
 * const value = getStorage<string>('key', 'default')
 * ```
 */
export function getStorage<T = unknown>(key: string, defaultValue?: T): T | undefined {
  try {
    const itemStr = localStorage.getItem(key)
    if (!itemStr) {
      return defaultValue
    }

    const item: StorageItem<T> = JSON.parse(itemStr)

    // 检查是否过期
    if (item.expires > 0 && Date.now() > item.expires) {
      // 数据已过期，删除并返回默认值
      localStorage.removeItem(key)
      logger.debug('localStorage数据已过期', {
        context: {
          module: 'utils',
          function: 'getStorage',
        },
        data: {
          key,
          expiredAt: new Date(item.expires).toISOString(),
        },
      })
      return defaultValue
    }

    logger.debug('从localStorage读取数据成功', {
      context: {
        module: 'utils',
        function: 'getStorage',
      },
      data: {
        key,
        hasExpires: item.expires > 0,
      },
    })
    return item.value
  } catch (error: unknown) {
    logger.error('读取数据失败', {
      context: {
        module: 'utils',
        function: 'getStorage',
      },
      error: error instanceof Error ? error : new Error(String(error)),
      data: {
        key,
      },
    })
    return defaultValue
  }
}

/**
 * 删除localStorage
 * @param key 存储键
 */
export function removeStorage(key: string): void {
  localStorage.removeItem(key)
  logger.debug('从localStorage删除数据', {
    context: {
      module: 'utils',
      function: 'removeStorage',
    },
    data: {
      key,
    },
  })
}

/**
 * 清空localStorage
 */
export function clearStorage(): void {
  localStorage.clear()
  logger.info('localStorage已清空', {
    context: {
      module: 'utils',
      function: 'clearStorage',
    },
  })
}

/**
 * 设置sessionStorage
 * @param key 存储键
 * @param value 存储值
 */
export function setSessionStorage<T = unknown>(key: string, value: T): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
    logger.debug('数据已存储到sessionStorage', {
      context: {
        module: 'utils',
        function: 'setSessionStorage',
      },
      data: {
        key,
      },
    })
  } catch (error: unknown) {
    logger.error('存储数据失败', {
      context: {
        module: 'utils',
        function: 'setSessionStorage',
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
 * 获取sessionStorage
 * @param key 存储键
 * @param defaultValue 默认值
 * @returns 存储的值或默认值
 */
export function getSessionStorage<T = unknown>(key: string, defaultValue?: T): T | undefined {
  try {
    const itemStr = sessionStorage.getItem(key)
    if (!itemStr) {
      return defaultValue
    }
    const value = JSON.parse(itemStr) as T
    logger.debug('从sessionStorage读取数据成功', {
      context: {
        module: 'utils',
        function: 'getSessionStorage',
      },
      data: {
        key,
      },
    })
    return value
  } catch (error: unknown) {
    logger.error('读取数据失败', {
      context: {
        module: 'utils',
        function: 'getSessionStorage',
      },
      error: error instanceof Error ? error : new Error(String(error)),
      data: {
        key,
      },
    })
    return defaultValue
  }
}

/**
 * 删除sessionStorage
 * @param key 存储键
 */
export function removeSessionStorage(key: string): void {
  sessionStorage.removeItem(key)
}

/**
 * 清空sessionStorage
 */
export function clearSessionStorage(): void {
  sessionStorage.clear()
}
