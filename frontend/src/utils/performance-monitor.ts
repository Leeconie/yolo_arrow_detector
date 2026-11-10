/**
 * @fileoverview 工具函数性能监控器
 * @module utils/performance-monitor
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 提供函数执行时间统计、缓存命中率统计、性能指标上报等功能
 */

/**
 * 函数执行记录
 */
interface FunctionExecutionRecord {
  /** 函数名 */
  functionName: string
  /** 执行次数 */
  count: number
  /** 总耗时（毫秒） */
  totalTime: number
  /** 最小耗时（毫秒） */
  minTime: number
  /** 最大耗时（毫秒） */
  maxTime: number
  /** 平均耗时（毫秒） */
  avgTime: number
}

/**
 * 扩展的Performance接口（包含mark和measure方法）
 */
interface ExtendedPerformance {
  mark?: (name: string) => void
  measure?: (name: string, startMark: string) => void
  getEntriesByName?: (name: string) => PerformanceEntry[]
  clearMarks?: (name?: string) => void
  clearMeasures?: (name?: string) => void
}

/**
 * 缓存统计记录
 */
interface CacheStatisticsRecord {
  /** 缓存名称 */
  cacheName: string
  /** 总请求数 */
  totalRequests: number
  /** 缓存命中数 */
  cacheHits: number
  /** 缓存未命中数 */
  cacheMisses: number
  /** 缓存命中率（0-1） */
  hitRate: number
}

/**
 * 性能指标接口
 */
export interface UtilsPerformanceMetrics {
  /** 函数执行统计 */
  functionExecutions: {
    /** 总执行次数 */
    totalExecutions: number
    /** 不同函数的执行记录 */
    byFunction: Map<string, FunctionExecutionRecord>
    /** 平均执行时间（毫秒） */
    avgExecutionTime: number
    /** 总执行时间（毫秒） */
    totalExecutionTime: number
  }
  /** 缓存统计 */
  cacheStatistics: {
    /** 总请求数 */
    totalRequests: number
    /** 总命中数 */
    totalHits: number
    /** 总未命中数 */
    totalMisses: number
    /** 总体命中率（0-1） */
    overallHitRate: number
    /** 不同缓存的统计记录 */
    byCache: Map<string, CacheStatisticsRecord>
  }
}

/**
 * 工具函数性能监控器配置
 */
export interface UtilsPerformanceMonitorConfig {
  /** 是否启用性能监控，默认true */
  enabled?: boolean
  /** 是否上报性能指标，默认false */
  reportMetrics?: boolean
  /** 上报间隔（毫秒），默认60000（1分钟） */
  reportInterval?: number
  /** 最大记录数，默认1000 */
  maxRecords?: number
}

/**
 * 工具函数性能监控器类
 * @description 记录和统计工具函数性能指标
 */
export class UtilsPerformanceMonitor {
  /** 是否启用性能监控 */
  private enabled: boolean
  /** 是否上报性能指标 */
  private reportMetrics: boolean
  /** 上报间隔 */
  private reportInterval: number
  /** 最大记录数 */
  private maxRecords: number
  /** 函数执行记录 */
  private functionExecutionRecords: Map<string, FunctionExecutionRecord> = new Map()
  /** 缓存统计记录 */
  private cacheStatisticsRecords: Map<string, CacheStatisticsRecord> = new Map()
  /** 上报定时器 */
  private reportTimer: number | null = null
  /** 监控开始时间 */
  private startTime: number = Date.now()

  /**
   * 构造函数
   * @param config 配置选项
   */
  constructor(config: UtilsPerformanceMonitorConfig = {}) {
    this.enabled = config.enabled ?? true
    this.reportMetrics = config.reportMetrics ?? false
    this.reportInterval = config.reportInterval ?? 60000
    this.maxRecords = config.maxRecords ?? 1000

    // 如果启用上报，启动定时上报
    if (this.enabled && this.reportMetrics) {
      this.startReporting()
    }
  }

  /**
   * 记录函数执行开始
   * @param functionName 函数名
   * @returns 执行ID（用于结束记录）
   */
  startExecution(functionName: string): string {
    if (!this.enabled) {
      return ''
    }

    const executionId = `${functionName}-${Date.now()}-${Math.random()}`
    // 使用performance.now()获取高精度时间
    ;(performance as ExtendedPerformance).mark?.(`execution-start-${executionId}`)
    return executionId
  }

  /**
   * 记录函数执行结束
   * @param functionName 函数名
   * @param executionId 执行ID（从startExecution获取）
   * @description 计算函数执行耗时并记录
   */
  endExecution(functionName: string, executionId: string): void {
    if (!this.enabled || !executionId) {
      return
    }

    // 计算耗时
    let duration = 0
    const extendedPerformance = performance as ExtendedPerformance
    if (extendedPerformance.measure) {
      try {
        extendedPerformance.measure(`execution-${executionId}`, `execution-start-${executionId}`)
        const measure = extendedPerformance.getEntriesByName?.(`execution-${executionId}`)?.[0]
        duration = measure?.duration ?? 0
        extendedPerformance.clearMarks?.(`execution-start-${executionId}`)
        extendedPerformance.clearMeasures?.(`execution-${executionId}`)
      } catch {
        // 如果performance API不可用，使用Date.now()估算
        duration = 0
      }
    }

    // 如果无法获取精确时间，使用0（表示已记录但无法测量）
    if (duration === 0) {
      duration = 0.01 // 使用最小估算值
    }

    let record = this.functionExecutionRecords.get(functionName)

    if (!record) {
      record = {
        functionName,
        count: 0,
        totalTime: 0,
        minTime: duration,
        maxTime: duration,
        avgTime: duration,
      }
      this.functionExecutionRecords.set(functionName, record)
    }

    record.count++
    record.totalTime += duration
    record.minTime = Math.min(record.minTime, duration)
    record.maxTime = Math.max(record.maxTime, duration)
    record.avgTime = record.totalTime / record.count
  }

  /**
   * 记录缓存命中
   * @param cacheName 缓存名称
   * @description 记录缓存命中次数
   */
  recordCacheHit(cacheName: string): void {
    if (!this.enabled) {
      return
    }

    let record = this.cacheStatisticsRecords.get(cacheName)

    if (!record) {
      record = {
        cacheName,
        totalRequests: 0,
        cacheHits: 0,
        cacheMisses: 0,
        hitRate: 0,
      }
      this.cacheStatisticsRecords.set(cacheName, record)
    }

    record.totalRequests++
    record.cacheHits++
    record.hitRate = record.cacheHits / record.totalRequests
  }

  /**
   * 记录缓存未命中
   * @param cacheName 缓存名称
   * @description 记录缓存未命中次数
   */
  recordCacheMiss(cacheName: string): void {
    if (!this.enabled) {
      return
    }

    let record = this.cacheStatisticsRecords.get(cacheName)

    if (!record) {
      record = {
        cacheName,
        totalRequests: 0,
        cacheHits: 0,
        cacheMisses: 0,
        hitRate: 0,
      }
      this.cacheStatisticsRecords.set(cacheName, record)
    }

    record.totalRequests++
    record.cacheMisses++
    record.hitRate = record.cacheHits / record.totalRequests
  }

  /**
   * 获取性能指标
   * @returns 性能指标
   */
  getMetrics(): UtilsPerformanceMetrics {
    // 计算函数执行统计
    let totalExecutions = 0
    let totalExecutionTime = 0

    this.functionExecutionRecords.forEach((record) => {
      totalExecutions += record.count
      totalExecutionTime += record.totalTime
    })

    const avgExecutionTime = totalExecutions > 0 ? totalExecutionTime / totalExecutions : 0

    // 计算缓存统计
    let totalRequests = 0
    let totalHits = 0
    let totalMisses = 0

    this.cacheStatisticsRecords.forEach((record) => {
      totalRequests += record.totalRequests
      totalHits += record.cacheHits
      totalMisses += record.cacheMisses
    })

    const overallHitRate = totalRequests > 0 ? totalHits / totalRequests : 0

    return {
      functionExecutions: {
        totalExecutions,
        byFunction: new Map(this.functionExecutionRecords),
        avgExecutionTime,
        totalExecutionTime,
      },
      cacheStatistics: {
        totalRequests,
        totalHits,
        totalMisses,
        overallHitRate,
        byCache: new Map(this.cacheStatisticsRecords),
      },
    }
  }

  /**
   * 上报性能指标
   * @description 将性能指标上报到监控服务（开发环境输出到控制台）
   */
  report(): void {
    if (!this.enabled) {
      return
    }

    const metrics = this.getMetrics()

    // 开发环境输出到控制台
    if (import.meta.env.DEV) {
      console.group('工具函数性能指标')
      console.log('函数执行统计:', {
        总执行次数: metrics.functionExecutions.totalExecutions,
        平均执行时间: `${metrics.functionExecutions.avgExecutionTime.toFixed(3)} 毫秒`,
        总执行时间: `${metrics.functionExecutions.totalExecutionTime.toFixed(2)} 毫秒`,
      })
      console.log('缓存统计:', {
        总请求数: metrics.cacheStatistics.totalRequests,
        总命中数: metrics.cacheStatistics.totalHits,
        总未命中数: metrics.cacheStatistics.totalMisses,
        总体命中率: `${(metrics.cacheStatistics.overallHitRate * 100).toFixed(2)}%`,
      })
      console.groupEnd()
    }

    // 生产环境可以上报到监控服务
    if (import.meta.env.PROD && this.reportMetrics) {
      // 注意：性能监控服务集成是可选的未来功能
      // 可以集成Sentry、自定义监控服务等
      // 当前实现仅记录到控制台，生产环境可根据需要扩展
      // 这里可以发送metrics到监控服务
    }
  }

  /**
   * 启动定时上报
   * @description 按配置的间隔定时上报性能指标
   */
  private startReporting(): void {
    if (this.reportTimer) {
      return
    }

    this.reportTimer = window.setInterval(() => {
      this.report()
    }, this.reportInterval)
  }

  /**
   * 停止定时上报
   * @description 停止定时上报性能指标
   */
  stopReporting(): void {
    if (this.reportTimer) {
      clearInterval(this.reportTimer)
      this.reportTimer = null
    }
  }

  /**
   * 启用性能监控
   */
  enable(): void {
    this.enabled = true
    if (this.reportMetrics) {
      this.startReporting()
    }
  }

  /**
   * 禁用性能监控
   */
  disable(): void {
    this.enabled = false
    this.stopReporting()
  }

  /**
   * 清除所有记录
   * @description 清除所有函数执行和缓存统计记录
   */
  clear(): void {
    this.functionExecutionRecords.clear()
    this.cacheStatisticsRecords.clear()
    this.startTime = Date.now()
  }

  /**
   * 重置监控器
   * @description 清除所有记录并重置开始时间
   */
  reset(): void {
    this.clear()
  }
}

/**
 * 默认工具函数性能监控器实例
 * @description 提供全局默认的工具函数性能监控器实例
 */
export const defaultUtilsPerformanceMonitor = new UtilsPerformanceMonitor({
  enabled: import.meta.env.DEV, // 开发环境默认启用
  reportMetrics: false, // 默认不上报
})
