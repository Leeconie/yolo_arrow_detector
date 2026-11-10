/**
 * @fileoverview 请求缓存管理器
 * @module core/api/cache
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 提供请求缓存功能，支持LRU缓存策略、TTL过期、版本控制等
 */

import { logger } from '@/core/logger'

/**
 * 缓存值类型
 */
type CacheValue = unknown

/**
 * 缓存项接口
 */
interface CacheItem<T> {
  /** 缓存数据 */
  data: T
  /** 创建时间 */
  createdAt: number
  /** 过期时间 */
  expiresAt: number
  /** 最后访问时间 */
  lastAccessed: number
}

/**
 * 缓存配置接口
 */
export interface CacheConfig {
  /** 最大缓存数量，默认100 */
  maxSize?: number
  /** 默认过期时间（毫秒），默认5分钟 */
  defaultTTL?: number
  /** 是否启用版本控制，默认false */
  enableVersion?: boolean
  /** 缓存版本号 */
  version?: string
}

/**
 * 缓存管理器类
 * @description 实现LRU缓存策略，支持TTL过期和版本控制
 */
export class CacheManager {
  /** 缓存存储 */
  private cache: Map<string, CacheItem<CacheValue>> = new Map()
  /** 最大缓存数量 */
  private maxSize: number
  /** 默认过期时间（毫秒） */
  private defaultTTL: number
  /** 是否启用版本控制 */
  private enableVersion: boolean
  /** 当前缓存版本号 */
  private version: string

  /** 缓存统计 */
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
  }

  /**
   * 构造函数
   * @param config 缓存配置
   */
  constructor(config: CacheConfig = {}) {
    this.maxSize = config.maxSize ?? 100
    this.defaultTTL = config.defaultTTL ?? 5 * 60 * 1000 // 默认5分钟
    this.enableVersion = config.enableVersion ?? false
    this.version = config.version ?? '1.0.0'
  }

  /**
   * 生成缓存键
   * @param method 请求方法
   * @param url 请求URL
   * @param params 请求参数
   * @returns 缓存键
   */
  private generateKey(method: string, url: string, params?: Record<string, unknown>): string {
    // 对参数进行排序，确保相同参数生成相同键
    const sortedParams = params
      ? Object.keys(params)
          .sort()
          .reduce(
            (acc, key) => {
              acc[key] = params[key]
              return acc
            },
            {} as Record<string, unknown>,
          )
      : {}

    const paramsStr = JSON.stringify(sortedParams)
    return `${method.toUpperCase()}:${url}:${paramsStr}`
  }

  /**
   * 获取缓存
   * @template T 缓存数据类型
   * @param method 请求方法
   * @param url 请求URL
   * @param params 请求参数
   * @returns 缓存数据，如果不存在或已过期则返回null
   */
  get<T>(method: string, url: string, params?: Record<string, unknown>): T | null {
    const key = this.generateKey(method, url, params)
    const item = this.cache.get(key)

    if (!item) {
      this.stats.misses++
      logger.debug('缓存未命中', {
        context: {
          module: 'api',
          function: 'cache.get',
        },
        data: {
          method,
          url,
          key: key.substring(0, 100), // 限制日志长度
        },
      })
      return null
    }

    // 检查是否过期
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key)
      this.stats.misses++
      logger.debug('缓存已过期', {
        context: {
          module: 'api',
          function: 'cache.get',
        },
        data: {
          method,
          url,
          expiredAt: new Date(item.expiresAt).toISOString(),
        },
      })
      return null
    }

    // 更新最后访问时间（LRU）
    item.lastAccessed = Date.now()
    this.stats.hits++
    logger.debug('缓存命中', {
      context: {
        module: 'api',
        function: 'cache.get',
      },
      data: {
        method,
        url,
        age: Date.now() - item.createdAt,
      },
    })
    return item.data as T
  }

  /**
   * 设置缓存
   * @template T 缓存数据类型
   * @param method 请求方法
   * @param url 请求URL
   * @param params 请求参数
   * @param data 缓存数据
   * @param ttl 过期时间（毫秒），如果不提供则使用默认值
   */
  set<T>(
    method: string,
    url: string,
    params: Record<string, unknown>,
    data: T,
    ttl?: number,
  ): void {
    // 仅缓存GET请求
    if (method.toUpperCase() !== 'GET') {
      logger.debug('跳过非GET请求缓存', {
        context: {
          module: 'api',
          function: 'cache.set',
        },
        data: {
          method,
          url,
        },
      })
      return
    }

    const key = this.generateKey(method, url, params)
    const now = Date.now()
    const expiresAt = now + (ttl ?? this.defaultTTL)

    // 如果缓存已满，移除最久未使用的项（LRU）
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      logger.debug('缓存已满，执行LRU淘汰', {
        context: {
          module: 'api',
          function: 'cache.set',
        },
        data: {
          currentSize: this.cache.size,
          maxSize: this.maxSize,
        },
      })
      this.evictLRU()
    }

    this.cache.set(key, {
      data,
      createdAt: now,
      expiresAt,
      lastAccessed: now,
    })

    this.stats.sets++
    logger.debug('缓存已设置', {
      context: {
        module: 'api',
        function: 'cache.set',
      },
      data: {
        method,
        url,
        ttl: ttl ?? this.defaultTTL,
        expiresAt: new Date(expiresAt).toISOString(),
        cacheSize: this.cache.size,
      },
    })
  }

  /**
   * 删除缓存
   * @param method 请求方法
   * @param url 请求URL
   * @param params 请求参数
   */
  delete(method: string, url: string, params?: Record<string, unknown>): void {
    const key = this.generateKey(method, url, params)
    if (this.cache.delete(key)) {
      this.stats.deletes++
    }
  }

  /**
   * 清除所有缓存
   */
  clear(): void {
    const size = this.cache.size
    this.cache.clear()
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    }
    logger.info('缓存已清空', {
      context: {
        module: 'api',
        function: 'cache.clear',
      },
      data: {
        clearedItems: size,
      },
    })
  }

  /**
   * 按模式清除缓存
   * @param pattern 匹配模式（支持URL匹配）
   */
  clearByPattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
    let deletedCount = 0

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
        deletedCount++
      }
    }

    this.stats.deletes += deletedCount
  }

  /**
   * 设置缓存版本号
   * @param version 版本号
   * @description 版本号变更时，自动清除所有旧版本缓存
   */
  setVersion(version: string): void {
    if (this.enableVersion && this.version !== version) {
      this.clear()
      this.version = version
    }
  }

  /**
   * 清理过期缓存
   * @description 移除所有已过期的缓存项
   */
  cleanExpired(): void {
    const now = Date.now()
    let deletedCount = 0

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key)
        deletedCount++
      }
    }

    this.stats.deletes += deletedCount

    if (deletedCount > 0) {
      logger.debug('清理过期缓存', {
        context: {
          module: 'api',
          function: 'cache.cleanExpired',
        },
        data: {
          deletedCount,
          remainingSize: this.cache.size,
        },
      })
    }
  }

  /**
   * 移除最久未使用的缓存项（LRU）
   * @private
   */
  private evictLRU(): void {
    let oldestKey: string | null = null
    let oldestTime = Infinity

    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
      this.stats.deletes++
    }
  }

  /**
   * 获取缓存统计信息
   * @returns 统计信息
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses
    return {
      ...this.stats,
      total,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0,
      size: this.cache.size,
      maxSize: this.maxSize,
    }
  }

  /**
   * 获取缓存大小
   * @returns 当前缓存数量
   */
  size(): number {
    return this.cache.size
  }
}

/**
 * 默认缓存管理器实例
 */
export const defaultCacheManager = new CacheManager()
