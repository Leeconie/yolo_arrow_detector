/**
 * @fileoverview 性能监控模块
 * @module core/api/performance-monitor
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 提供请求耗时统计、缓存命中率统计、性能指标上报等功能
 */

import { logger } from '@/core/logger'

/**
 * 请求计时信息
 */
interface RequestTiming {
  /** 请求ID */
  requestId: string
  /** 开始时间 */
  startTime: number
  /** 拦截器耗时 */
  interceptorTime?: number
  /** 网络请求耗时 */
  networkTime?: number
  /** 响应处理耗时 */
  responseTime?: number
  /** 结束时间 */
  endTime?: number
  /** 总耗时 */
  totalTime?: number
  /** 请求URL */
  url?: string
  /** 请求方法 */
  method?: string
}

/**
 * 性能指标接口
 */
export interface PerformanceMetrics {
  /** 请求耗时统计 */
  requestTimings: RequestTiming[]
  /** 平均请求耗时 */
  averageRequestTime: number
  /** 缓存命中率 */
  cacheHitRate: number
  /** 总请求数 */
  totalRequests: number
  /** 成功请求数 */
  successfulRequests: number
  /** 失败请求数 */
  failedRequests: number
}

/**
 * 性能监控器类
 * @description 记录和统计API请求性能指标
 */
export class PerformanceMonitor {
  /** 请求计时信息映射 */
  private requestTimings: Map<string, RequestTiming> = new Map()
  /** 缓存统计 */
  private cacheStats = {
    hits: 0,
    misses: 0,
  }
  /** 请求统计 */
  private requestStats = {
    total: 0,
    successful: 0,
    failed: 0,
  }
  /** 是否启用性能监控 */
  private enabled: boolean
  /** 是否上报性能指标 */
  private enableReporting: boolean
  /** 上报函数（可选） */
  private reportFn?: (metrics: PerformanceMetrics) => void | Promise<void>

  /**
   * 构造函数
   * @param config 配置选项
   */
  constructor(
    config: {
      enabled?: boolean
      enableReporting?: boolean
      reportFn?: (metrics: PerformanceMetrics) => void | Promise<void>
    } = {},
  ) {
    this.enabled = config.enabled ?? true
    this.enableReporting = config.enableReporting ?? false
    this.reportFn = config.reportFn
  }

  /**
   * 开始请求计时
   * @param requestId 请求ID
   * @param url 请求URL
   * @param method 请求方法
   */
  startRequest(requestId: string, url?: string, method?: string): void {
    if (!this.enabled) return

    this.requestTimings.set(requestId, {
      requestId,
      startTime: performance.now(),
      url,
      method,
    })

    this.requestStats.total++
  }

  /**
   * 记录拦截器耗时
   * @param requestId 请求ID
   * @param time 耗时（毫秒）
   */
  recordInterceptorTime(requestId: string, time: number): void {
    if (!this.enabled) return

    const timing = this.requestTimings.get(requestId)
    if (timing) {
      timing.interceptorTime = time
    }
  }

  /**
   * 记录网络请求耗时
   * @param requestId 请求ID
   * @param time 耗时（毫秒）
   */
  recordNetworkTime(requestId: string, time: number): void {
    if (!this.enabled) return

    const timing = this.requestTimings.get(requestId)
    if (timing) {
      timing.networkTime = time
    }
  }

  /**
   * 记录响应处理耗时
   * @param requestId 请求ID
   * @param time 耗时（毫秒）
   */
  recordResponseTime(requestId: string, time: number): void {
    if (!this.enabled) return

    const timing = this.requestTimings.get(requestId)
    if (timing) {
      timing.responseTime = time
    }
  }

  /**
   * 结束请求计时
   * @param requestId 请求ID
   * @param success 是否成功
   */
  endRequest(requestId: string, success: boolean = true): void {
    if (!this.enabled) return

    const timing = this.requestTimings.get(requestId)
    if (timing) {
      timing.endTime = performance.now()
      timing.totalTime = timing.endTime - timing.startTime

      if (success) {
        this.requestStats.successful++
      } else {
        this.requestStats.failed++
      }

      // 如果启用上报，上报性能指标
      if (this.enableReporting && this.reportFn) {
        this.reportMetrics().catch((error) => {
          logger.error('性能指标上报失败', {
            context: {
              module: 'api',
              function: 'performanceMonitor.endRequest',
            },
            error: error instanceof Error ? error : new Error(String(error)),
            data: {
              requestId,
              success,
            },
          })
        })
      }
    }
  }

  /**
   * 记录缓存命中
   */
  recordCacheHit(): void {
    if (!this.enabled) return
    this.cacheStats.hits++
    logger.debug('缓存命中', {
      context: {
        module: 'api',
        function: 'performanceMonitor.recordCacheHit',
      },
      data: {
        hits: this.cacheStats.hits,
        misses: this.cacheStats.misses,
        hitRate: this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) || 0,
      },
    })
  }

  /**
   * 记录缓存未命中
   */
  recordCacheMiss(): void {
    if (!this.enabled) return
    this.cacheStats.misses++
    logger.debug('缓存未命中', {
      context: {
        module: 'api',
        function: 'performanceMonitor.recordCacheMiss',
      },
      data: {
        hits: this.cacheStats.hits,
        misses: this.cacheStats.misses,
        hitRate: this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) || 0,
      },
    })
  }

  /**
   * 获取性能指标
   * @returns 性能指标
   */
  getMetrics(): PerformanceMetrics {
    const timings = Array.from(this.requestTimings.values())
    const completedTimings = timings.filter((t) => t.totalTime !== undefined)

    const averageRequestTime =
      completedTimings.length > 0
        ? completedTimings.reduce((sum, t) => sum + (t.totalTime || 0), 0) / completedTimings.length
        : 0

    const totalCacheRequests = this.cacheStats.hits + this.cacheStats.misses
    const cacheHitRate =
      totalCacheRequests > 0 ? (this.cacheStats.hits / totalCacheRequests) * 100 : 0

    return {
      requestTimings: completedTimings,
      averageRequestTime,
      cacheHitRate,
      totalRequests: this.requestStats.total,
      successfulRequests: this.requestStats.successful,
      failedRequests: this.requestStats.failed,
    }
  }

  /**
   * 上报性能指标
   * @returns Promise<void>
   */
  async reportMetrics(): Promise<void> {
    if (!this.enableReporting || !this.reportFn) return

    const metrics = this.getMetrics()
    await this.reportFn(metrics)
  }

  /**
   * 清除所有统计数据
   */
  clear(): void {
    this.requestTimings.clear()
    this.cacheStats = {
      hits: 0,
      misses: 0,
    }
    this.requestStats = {
      total: 0,
      successful: 0,
      failed: 0,
    }
  }

  /**
   * 启用性能监控
   */
  enable(): void {
    this.enabled = true
  }

  /**
   * 禁用性能监控
   */
  disable(): void {
    this.enabled = false
  }
}

/**
 * 默认性能监控器实例
 */
export const defaultPerformanceMonitor = new PerformanceMonitor()
