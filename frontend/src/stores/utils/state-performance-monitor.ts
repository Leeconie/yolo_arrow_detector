/**
 * @fileoverview 状态管理性能监控器
 * @module stores/utils/state-performance-monitor
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 提供状态更新频率统计、持久化耗时统计、性能指标上报等功能
 */

/**
 * 状态更新记录
 */
interface StateUpdateRecord {
  /** 状态键 */
  key: string
  /** 更新次数 */
  count: number
  /** 首次更新时间 */
  firstUpdateTime: number
  /** 最后更新时间 */
  lastUpdateTime: number
  /** 更新间隔列表（毫秒） */
  intervals: number[]
}

/**
 * 持久化操作记录
 */
interface PersistenceRecord {
  /** 存储键 */
  key: string
  /** 操作次数 */
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
 * 性能指标接口
 */
export interface StatePerformanceMetrics {
  /** 状态更新统计 */
  stateUpdates: {
    /** 总更新次数 */
    totalUpdates: number
    /** 不同状态键的更新记录 */
    byKey: Map<string, StateUpdateRecord>
    /** 平均更新频率（次/秒） */
    avgUpdateRate: number
    /** 平均更新间隔（毫秒） */
    avgUpdateInterval: number
  }
  /** 持久化统计 */
  persistence: {
    /** 总操作次数 */
    totalOperations: number
    /** 不同存储键的操作记录 */
    byKey: Map<string, PersistenceRecord>
    /** 平均耗时（毫秒） */
    avgTime: number
    /** 总耗时（毫秒） */
    totalTime: number
  }
}

/**
 * 状态管理性能监控器配置
 */
export interface StatePerformanceMonitorConfig {
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
 * 状态管理性能监控器类
 * @description 记录和统计状态管理性能指标
 */
export class StatePerformanceMonitor {
  /** 是否启用性能监控 */
  private enabled: boolean
  /** 是否上报性能指标 */
  private reportMetrics: boolean
  /** 上报间隔 */
  private reportInterval: number
  /** 最大记录数 */
  private maxRecords: number
  /** 状态更新记录 */
  private stateUpdateRecords: Map<string, StateUpdateRecord> = new Map()
  /** 持久化操作记录 */
  private persistenceRecords: Map<string, PersistenceRecord> = new Map()
  /** 上报定时器 */
  private reportTimer: number | null = null
  /** 监控开始时间 */
  private startTime: number = Date.now()

  /**
   * 构造函数
   * @param config 配置选项
   */
  constructor(config: StatePerformanceMonitorConfig = {}) {
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
   * 记录状态更新
   * @param key 状态键
   * @description 记录状态更新次数和更新间隔
   */
  recordStateUpdate(key: string): void {
    if (!this.enabled) {
      return
    }

    const now = Date.now()
    let record = this.stateUpdateRecords.get(key)

    if (!record) {
      record = {
        key,
        count: 0,
        firstUpdateTime: now,
        lastUpdateTime: now,
        intervals: [],
      }
      this.stateUpdateRecords.set(key, record)
    } else {
      // 计算更新间隔
      const interval = now - record.lastUpdateTime
      record.intervals.push(interval)

      // 限制记录数，保留最近的记录
      if (record.intervals.length > this.maxRecords) {
        record.intervals.shift()
      }
    }

    record.count++
    record.lastUpdateTime = now
  }

  /**
   * 记录持久化操作开始
   * @param key 存储键
   * @returns 操作ID（用于结束记录）
   */
  startPersistence(key: string): string {
    if (!this.enabled) {
      return ''
    }

    const operationId = `${key}-${Date.now()}-${Math.random()}`
    // 使用performance.now()获取高精度时间
    ;(performance as ExtendedPerformance).mark?.(`persistence-start-${operationId}`)
    return operationId
  }

  /**
   * 记录持久化操作结束
   * @param key 存储键
   * @param operationId 操作ID（从startPersistence获取）
   * @description 计算持久化操作耗时并记录
   */
  endPersistence(key: string, operationId: string): void {
    if (!this.enabled || !operationId) {
      return
    }

    // 计算耗时
    let duration = 0
    const extendedPerformance = performance as ExtendedPerformance
    if (extendedPerformance.measure) {
      try {
        extendedPerformance.measure(
          `persistence-${operationId}`,
          `persistence-start-${operationId}`,
        )
        const measure = extendedPerformance.getEntriesByName?.(`persistence-${operationId}`)?.[0]
        duration = measure?.duration ?? 0
        extendedPerformance.clearMarks?.(`persistence-start-${operationId}`)
        extendedPerformance.clearMeasures?.(`persistence-${operationId}`)
      } catch {
        // 如果performance API不可用，使用Date.now()估算
        duration = 0
      }
    }

    // 如果无法获取精确时间，使用0（表示已记录但无法测量）
    if (duration === 0) {
      duration = 0.1 // 使用最小估算值
    }

    let record = this.persistenceRecords.get(key)

    if (!record) {
      record = {
        key,
        count: 0,
        totalTime: 0,
        minTime: duration,
        maxTime: duration,
        avgTime: duration,
      }
      this.persistenceRecords.set(key, record)
    }

    record.count++
    record.totalTime += duration
    record.minTime = Math.min(record.minTime, duration)
    record.maxTime = Math.max(record.maxTime, duration)
    record.avgTime = record.totalTime / record.count
  }

  /**
   * 获取性能指标
   * @returns 性能指标
   */
  getMetrics(): StatePerformanceMetrics {
    // 计算状态更新统计
    let totalUpdates = 0
    let totalIntervals = 0
    let intervalCount = 0

    this.stateUpdateRecords.forEach((record) => {
      totalUpdates += record.count
      totalIntervals += record.intervals.reduce((sum, interval) => sum + interval, 0)
      intervalCount += record.intervals.length
    })

    const elapsedTime = (Date.now() - this.startTime) / 1000 // 秒
    const avgUpdateRate = elapsedTime > 0 ? totalUpdates / elapsedTime : 0
    const avgUpdateInterval = intervalCount > 0 ? totalIntervals / intervalCount : 0

    // 计算持久化统计
    let totalOperations = 0
    let totalTime = 0

    this.persistenceRecords.forEach((record) => {
      totalOperations += record.count
      totalTime += record.totalTime
    })

    const avgPersistenceTime = totalOperations > 0 ? totalTime / totalOperations : 0

    return {
      stateUpdates: {
        totalUpdates,
        byKey: new Map(this.stateUpdateRecords),
        avgUpdateRate,
        avgUpdateInterval,
      },
      persistence: {
        totalOperations,
        byKey: new Map(this.persistenceRecords),
        avgTime: avgPersistenceTime,
        totalTime,
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
      console.group('状态管理性能指标')
      console.log('状态更新统计:', {
        总更新次数: metrics.stateUpdates.totalUpdates,
        平均更新频率: `${metrics.stateUpdates.avgUpdateRate.toFixed(2)} 次/秒`,
        平均更新间隔: `${metrics.stateUpdates.avgUpdateInterval.toFixed(2)} 毫秒`,
      })
      console.log('持久化统计:', {
        总操作次数: metrics.persistence.totalOperations,
        平均耗时: `${metrics.persistence.avgTime.toFixed(2)} 毫秒`,
        总耗时: `${metrics.persistence.totalTime.toFixed(2)} 毫秒`,
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
   * @description 清除所有状态更新和持久化操作记录
   */
  clear(): void {
    this.stateUpdateRecords.clear()
    this.persistenceRecords.clear()
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
 * 默认状态管理性能监控器实例
 * @description 提供全局默认的状态管理性能监控器实例
 */
export const defaultStatePerformanceMonitor = new StatePerformanceMonitor({
  enabled: import.meta.env.DEV, // 开发环境默认启用
  reportMetrics: false, // 默认不上报
})
