/**
 * @fileoverview 状态持久化优化器
 * @module stores/utils/persistence-optimizer
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 提供批量写入、防抖、节流等持久化优化功能，减少localStorage IO操作
 * 性能监控：集成状态管理性能监控，记录持久化操作耗时
 */

import { defaultStatePerformanceMonitor } from './state-performance-monitor'

/**
 * 持久化项接口
 */
interface PersistenceItem {
  /** 存储键 */
  key: string
  /** 存储值 */
  value: unknown
  /** 优先级（数字越大优先级越高） */
  priority: number
  /** 时间戳 */
  timestamp: number
}

/**
 * 持久化优化器配置
 */
export interface PersistenceOptimizerConfig {
  /** 批量大小阈值，默认10 */
  batchSize?: number
  /** 批量延迟时间（毫秒），默认100ms */
  batchDelay?: number
  /** 防抖延迟时间（毫秒），默认300ms */
  debounceDelay?: number
  /** 节流间隔时间（毫秒），默认1000ms */
  throttleInterval?: number
  /** 队列最大大小，默认100 */
  maxQueueSize?: number
}

/**
 * 持久化优化器类
 * @description 提供批量写入、防抖、节流等持久化优化功能
 */
export class PersistenceOptimizer {
  /** 待处理的更新 */
  private pendingUpdates: Map<string, PersistenceItem> = new Map()
  /** 批量写入定时器 */
  private batchTimer: ReturnType<typeof setTimeout> | null = null
  /** 防抖定时器映射 */
  private debounceTimers: Map<string, ReturnType<typeof setTimeout>> = new Map()
  /** 最后写入时间映射 */
  private lastWriteTime: Map<string, number> = new Map()
  /** 批量大小阈值 */
  private batchSize: number
  /** 批量延迟时间 */
  private batchDelay: number
  /** 防抖延迟时间 */
  private debounceDelay: number
  /** 节流间隔时间 */
  private throttleInterval: number
  /** 队列最大大小 */
  private maxQueueSize: number
  /** 统计信息 */
  private stats = {
    totalWrites: 0,
    batchWrites: 0,
    debouncedWrites: 0,
    throttledWrites: 0,
    skippedWrites: 0,
  }

  /**
   * 构造函数
   * @param config 配置选项
   */
  constructor(config: PersistenceOptimizerConfig = {}) {
    this.batchSize = config.batchSize ?? 10
    this.batchDelay = config.batchDelay ?? 100
    this.debounceDelay = config.debounceDelay ?? 300
    this.throttleInterval = config.throttleInterval ?? 1000
    this.maxQueueSize = config.maxQueueSize ?? 100
  }

  /**
   * 批量写入（推荐用于频繁更新的场景）
   * @param key 存储键
   * @param value 存储值
   * @param priority 优先级（可选，默认0）
   */
  batchWrite(key: string, value: unknown, priority: number = 0): void {
    // 如果队列已满，移除低优先级的项
    if (this.pendingUpdates.size >= this.maxQueueSize) {
      const sortedItems = Array.from(this.pendingUpdates.values()).sort(
        (a, b) => b.priority - a.priority,
      )
      const lowestPriorityItem = sortedItems[sortedItems.length - 1]
      if (lowestPriorityItem && lowestPriorityItem.priority < priority) {
        this.pendingUpdates.delete(lowestPriorityItem.key)
      } else {
        // 新项的优先级不够高，跳过
        this.stats.skippedWrites++
        return
      }
    }

    this.pendingUpdates.set(key, {
      key,
      value,
      priority,
      timestamp: Date.now(),
    })

    // 如果达到批量大小，立即写入
    if (this.pendingUpdates.size >= this.batchSize) {
      this.flushBatch()
      return
    }

    // 否则延迟写入
    this.scheduleBatchWrite()
  }

  /**
   * 防抖写入（推荐用于用户输入等场景）
   * @param key 存储键
   * @param value 存储值
   */
  debounceWrite(key: string, value: unknown): void {
    // 清除旧的定时器
    const existingTimer = this.debounceTimers.get(key)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    // 设置新的定时器（在Node.js环境中使用globalThis）
    const timer = (typeof window !== 'undefined' ? window : globalThis).setTimeout(() => {
      // 性能监控：记录持久化操作开始
      const operationId = defaultStatePerformanceMonitor.startPersistence(key)
      try {
        // 如果值是字符串，直接存储；否则使用JSON.stringify
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value)
        localStorage.setItem(key, stringValue)
        this.stats.debouncedWrites++
        this.stats.totalWrites++
        // 性能监控：记录持久化操作结束
        defaultStatePerformanceMonitor.endPersistence(key, operationId)
      } catch (error) {
        console.error(`持久化失败: ${key}`, error)
        // 性能监控：即使失败也记录结束（耗时可能为0）
        defaultStatePerformanceMonitor.endPersistence(key, operationId)
      }
      this.debounceTimers.delete(key)
    }, this.debounceDelay)

    this.debounceTimers.set(key, timer)
  }

  /**
   * 节流写入（推荐用于定期更新的场景）
   * @param key 存储键
   * @param value 存储值
   */
  throttleWrite(key: string, value: unknown): void {
    const now = Date.now()
    const lastTime = this.lastWriteTime.get(key) ?? 0

    // 如果距离上次写入时间超过节流间隔，允许写入
    if (now - lastTime >= this.throttleInterval) {
      // 性能监控：记录持久化操作开始
      const operationId = defaultStatePerformanceMonitor.startPersistence(key)
      try {
        // 如果值是字符串，直接存储；否则使用JSON.stringify
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value)
        localStorage.setItem(key, stringValue)
        this.lastWriteTime.set(key, now)
        this.stats.throttledWrites++
        this.stats.totalWrites++
        // 性能监控：记录持久化操作结束
        defaultStatePerformanceMonitor.endPersistence(key, operationId)
      } catch (error) {
        console.error(`持久化失败: ${key}`, error)
        // 性能监控：即使失败也记录结束（耗时可能为0）
        defaultStatePerformanceMonitor.endPersistence(key, operationId)
      }
    } else {
      this.stats.skippedWrites++
    }
  }

  /**
   * 立即写入（不经过优化）
   * @param key 存储键
   * @param value 存储值
   */
  immediateWrite(key: string, value: unknown): void {
    // 性能监控：记录持久化操作开始
    const operationId = defaultStatePerformanceMonitor.startPersistence(key)
    try {
      // 如果值是字符串，直接存储；否则使用JSON.stringify
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value)
      localStorage.setItem(key, stringValue)
      this.stats.totalWrites++
      // 性能监控：记录持久化操作结束
      defaultStatePerformanceMonitor.endPersistence(key, operationId)
    } catch (error) {
      console.error(`持久化失败: ${key}`, error)
      // 性能监控：即使失败也记录结束（耗时可能为0）
      defaultStatePerformanceMonitor.endPersistence(key, operationId)
    }
  }

  /**
   * 安排批量写入
   * @private
   */
  private scheduleBatchWrite(): void {
    if (this.batchTimer) return

    // 在Node.js环境中使用globalThis
    const setTimeoutFn = typeof window !== 'undefined' ? window.setTimeout : globalThis.setTimeout
    this.batchTimer = setTimeoutFn(() => {
      this.flushBatch()
      this.batchTimer = null
    }, this.batchDelay)
  }

  /**
   * 立即执行批量写入
   */
  flushBatch(): void {
    if (this.pendingUpdates.size === 0) return

    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }

    // 按优先级排序
    const sortedItems = Array.from(this.pendingUpdates.values()).sort(
      (a, b) => b.priority - a.priority,
    )

    // 批量写入
    sortedItems.forEach((item) => {
      // 性能监控：记录持久化操作开始
      const operationId = defaultStatePerformanceMonitor.startPersistence(item.key)
      try {
        // 如果值是字符串，直接存储；否则使用JSON.stringify
        const stringValue = typeof item.value === 'string' ? item.value : JSON.stringify(item.value)
        localStorage.setItem(item.key, stringValue)
        // 性能监控：记录持久化操作结束
        defaultStatePerformanceMonitor.endPersistence(item.key, operationId)
      } catch (error) {
        console.error(`持久化失败: ${item.key}`, error)
        // 性能监控：即使失败也记录结束（耗时可能为0）
        defaultStatePerformanceMonitor.endPersistence(item.key, operationId)
      }
    })

    this.stats.batchWrites += sortedItems.length
    this.stats.totalWrites += sortedItems.length
    this.pendingUpdates.clear()
  }

  /**
   * 立即写入指定键的值（用于防抖）
   * @param key 存储键
   */
  flushDebounce(key: string): void {
    const timer = this.debounceTimers.get(key)
    if (timer) {
      clearTimeout(timer)
      this.debounceTimers.delete(key)
    }
  }

  /**
   * 清除所有待处理的更新
   */
  clear(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }

    this.debounceTimers.forEach((timer) => clearTimeout(timer))
    this.debounceTimers.clear()
    this.pendingUpdates.clear()
  }

  /**
   * 获取统计信息
   * @returns 统计信息
   */
  getStats() {
    return {
      ...this.stats,
      pendingUpdates: this.pendingUpdates.size,
      activeDebounceTimers: this.debounceTimers.size,
    }
  }
}

/**
 * 默认持久化优化器实例
 */
export const defaultPersistenceOptimizer = new PersistenceOptimizer()
