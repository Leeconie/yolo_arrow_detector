/**
 * @fileoverview 状态更新优化器
 * @module stores/utils/state-update-optimizer
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 提供状态更新合并、批量更新、更新去重、nextTick优化等功能，减少响应式触发次数
 * @dependencies vue
 */

import { nextTick } from 'vue'
import { defaultStatePerformanceMonitor } from './state-performance-monitor'

/**
 * 状态更新项接口
 */
interface StateUpdateItem {
  /** 状态键（用于标识状态） */
  key: string
  /** 更新函数 */
  updateFn: () => void
  /** 时间戳 */
  timestamp: number
}

/**
 * 状态更新优化器配置
 */
export interface StateUpdateOptimizerConfig {
  /** 合并窗口时间（毫秒），默认16ms（约一帧时间） */
  mergeWindow?: number
  /** 是否启用更新去重，默认true */
  enableDeduplication?: boolean
  /** 是否启用nextTick优化，默认true */
  enableNextTick?: boolean
}

/**
 * 状态更新优化器类
 * @description 提供状态更新合并、批量更新、更新去重、nextTick优化等功能
 */
export class StateUpdateOptimizer {
  /** 待处理的状态更新 */
  private pendingUpdates: Map<string, StateUpdateItem> = new Map()
  /** 合并定时器 */
  private mergeTimer: number | null = null
  /** 批量更新调度标志 */
  private isScheduled: boolean = false
  /** 最后状态值映射（用于去重） */
  private lastValues: Map<string, unknown> = new Map()
  /** 合并窗口时间 */
  private mergeWindow: number
  /** 是否启用更新去重 */
  private enableDeduplication: boolean
  /** 是否启用nextTick优化 */
  private enableNextTick: boolean

  /**
   * 构造函数
   * @param config 配置选项
   */
  constructor(config: StateUpdateOptimizerConfig = {}) {
    this.mergeWindow = config.mergeWindow ?? 16
    this.enableDeduplication = config.enableDeduplication ?? true
    this.enableNextTick = config.enableNextTick ?? true
  }

  /**
   * 调度状态更新
   * @param key 状态键（用于标识状态，相同key的更新会被合并或去重）
   * @param updateFn 更新函数
   * @param value 状态值（可选，用于去重检查）
   * @description 合并多个连续的状态更新，使用nextTick批量应用，支持更新去重
   * @example
   * ```typescript
   * const optimizer = new StateUpdateOptimizer()
   *
   * // 调度更新
   * optimizer.scheduleUpdate('userInfo', () => {
   *   userInfo.value = newValue
   * }, newValue)
   * ```
   */
  scheduleUpdate(key: string, updateFn: () => void, value?: unknown): void {
    // 更新去重：检查值是否真正变化
    if (this.enableDeduplication && value !== undefined) {
      if (!this.shouldUpdate(key, value)) {
        return // 值未变化，跳过更新
      }
    }

    // 记录最新值（用于去重）
    if (value !== undefined) {
      this.lastValues.set(key, this.deepClone(value))
    }

    // 合并更新：相同key的更新会被覆盖（只保留最后一次）
    this.pendingUpdates.set(key, {
      key,
      updateFn,
      timestamp: Date.now(),
    })

    // 如果已经调度了批量更新，不需要重复调度
    if (this.isScheduled) {
      return
    }

    // 使用合并窗口延迟批量应用更新
    if (this.mergeTimer) {
      ;(typeof window !== 'undefined' ? window : globalThis).clearTimeout(this.mergeTimer)
    }

    this.mergeTimer = (typeof window !== 'undefined' ? window : globalThis).setTimeout(() => {
      this.applyBatchUpdates()
      this.mergeTimer = null
    }, this.mergeWindow) as unknown as number
  }

  /**
   * 立即应用所有待处理的更新
   * @description 强制立即应用所有待处理的更新，不等待合并窗口
   */
  flush(): void {
    if (this.mergeTimer) {
      ;(typeof window !== 'undefined' ? window : globalThis).clearTimeout(this.mergeTimer)
      this.mergeTimer = null
    }
    this.applyBatchUpdates()
  }

  /**
   * 批量应用更新
   * @description 使用nextTick批量应用所有待处理的更新
   */
  private applyBatchUpdates(): void {
    if (this.pendingUpdates.size === 0) {
      this.isScheduled = false
      return
    }

    // 如果启用nextTick优化，在下一个DOM更新周期前应用更新
    if (this.enableNextTick) {
      if (this.isScheduled) {
        return // 已经调度，等待执行
      }

      this.isScheduled = true
      nextTick(() => {
        this.executeUpdates()
        this.isScheduled = false
      })
    } else {
      // 不使用nextTick，立即执行
      this.executeUpdates()
    }
  }

  /**
   * 执行所有待处理的更新
   * @description 按顺序执行所有待处理的更新函数
   */
  private executeUpdates(): void {
    const updates = Array.from(this.pendingUpdates.values())
    this.pendingUpdates.clear()

    // 按时间戳排序，确保更新顺序
    updates.sort((a, b) => a.timestamp - b.timestamp)

    // 执行所有更新
    updates.forEach((item) => {
      try {
        item.updateFn()
        // 性能监控：记录状态更新
        defaultStatePerformanceMonitor.recordStateUpdate(item.key)
      } catch (error) {
        console.error(`状态更新失败: ${item.key}`, error)
      }
    })
  }

  /**
   * 检查是否应该更新（去重逻辑）
   * @param key 状态键
   * @param newValue 新值
   * @returns 是否应该更新
   */
  private shouldUpdate(key: string, newValue: unknown): boolean {
    const lastValue = this.lastValues.get(key)

    // 如果之前没有值，需要更新
    if (lastValue === undefined) {
      return true
    }

    // 使用深度比较检查值是否真正变化
    return !this.deepEqual(lastValue, newValue)
  }

  /**
   * 深度比较两个值是否相等
   * @param a 第一个值
   * @param b 第二个值
   * @returns 是否相等
   */
  private deepEqual(a: unknown, b: unknown): boolean {
    // 基本类型比较
    if (a === b) {
      return true
    }

    // null/undefined比较
    if (a == null || b == null) {
      return a === b
    }

    // 类型不同，不相等
    if (typeof a !== typeof b) {
      return false
    }

    // 非对象类型，直接比较
    if (typeof a !== 'object') {
      return false
    }

    // 数组比较
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) {
        return false
      }
      for (let i = 0; i < a.length; i++) {
        if (!this.deepEqual(a[i], b[i])) {
          return false
        }
      }
      return true
    }

    // 对象比较
    const objA = a as Record<string, unknown>
    const objB = b as Record<string, unknown>
    const keysA = Object.keys(objA)
    const keysB = Object.keys(objB)

    if (keysA.length !== keysB.length) {
      return false
    }

    for (const key of keysA) {
      if (!keysB.includes(key)) {
        return false
      }
      if (!this.deepEqual(objA[key], objB[key])) {
        return false
      }
    }

    return true
  }

  /**
   * 深度克隆对象
   * @param obj 要克隆的对象
   * @returns 克隆后的对象
   */
  private deepClone(obj: unknown): unknown {
    if (obj === null || typeof obj !== 'object') {
      return obj
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime())
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.deepClone(item))
    }

    if (typeof obj === 'object' && obj !== null) {
      const cloned: Record<string, unknown> = {}
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          cloned[key] = this.deepClone((obj as Record<string, unknown>)[key])
        }
      }
      return cloned
    }

    return obj
  }

  /**
   * 清除所有待处理的更新
   * @description 清除所有待处理的更新和缓存的状态值
   */
  clear(): void {
    if (this.mergeTimer) {
      ;(typeof window !== 'undefined' ? window : globalThis).clearTimeout(this.mergeTimer)
      this.mergeTimer = null
    }
    this.pendingUpdates.clear()
    this.lastValues.clear()
    this.isScheduled = false
  }
}

/**
 * 默认状态更新优化器实例
 * @description 提供全局默认的状态更新优化器实例
 */
export const defaultStateUpdateOptimizer = new StateUpdateOptimizer()
