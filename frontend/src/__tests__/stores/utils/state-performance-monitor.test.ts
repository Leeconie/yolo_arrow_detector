/**
 * @fileoverview 状态管理性能监控器测试
 * @module __tests__/stores/utils/state-performance-monitor
 * @author HeZaoCha
 * @date 2026-01-10
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { StatePerformanceMonitor } from '@/stores/utils/state-performance-monitor'

describe('StatePerformanceMonitor', () => {
  let monitor: StatePerformanceMonitor

  beforeEach(() => {
    monitor = new StatePerformanceMonitor({
      enabled: true,
      reportMetrics: false,
    })
    vi.useFakeTimers()
  })

  afterEach(() => {
    monitor.clear()
    monitor.stopReporting()
    vi.useRealTimers()
  })

  describe('状态更新频率统计', () => {
    it('应该记录状态更新次数', () => {
      monitor.recordStateUpdate('test')
      monitor.recordStateUpdate('test')
      monitor.recordStateUpdate('test')

      const metrics = monitor.getMetrics()
      expect(metrics.stateUpdates.totalUpdates).toBe(3)
    })

    it('应该计算平均更新间隔', () => {
      monitor.recordStateUpdate('test')
      vi.advanceTimersByTime(100)
      monitor.recordStateUpdate('test')
      vi.advanceTimersByTime(200)
      monitor.recordStateUpdate('test')

      const metrics = monitor.getMetrics()
      expect(metrics.stateUpdates.avgUpdateInterval).toBeGreaterThan(0)
    })

    it('应该按状态键记录更新', () => {
      monitor.recordStateUpdate('key1')
      monitor.recordStateUpdate('key2')
      monitor.recordStateUpdate('key1')

      const metrics = monitor.getMetrics()
      const key1Record = metrics.stateUpdates.byKey.get('key1')
      const key2Record = metrics.stateUpdates.byKey.get('key2')

      expect(key1Record).toBeDefined()
      expect(key1Record?.count).toBe(2)
      expect(key2Record).toBeDefined()
      expect(key2Record?.count).toBe(1)
    })

    it('应该计算平均更新频率', () => {
      monitor.recordStateUpdate('test')
      monitor.recordStateUpdate('test')

      vi.advanceTimersByTime(1000) // 1秒

      const metrics = monitor.getMetrics()
      expect(metrics.stateUpdates.avgUpdateRate).toBeGreaterThan(0)
    })
  })

  describe('持久化耗时统计', () => {
    it('应该记录持久化操作耗时', async () => {
      const operationId = monitor.startPersistence('test')

      // 模拟一些耗时操作（使用fake timers）
      vi.advanceTimersByTime(10)

      monitor.endPersistence('test', operationId)

      const metrics = monitor.getMetrics()
      expect(metrics.persistence.totalOperations).toBe(1)
    }, 10000)

    it('应该计算平均耗时', async () => {
      const operationId1 = monitor.startPersistence('test')
      vi.advanceTimersByTime(10)
      monitor.endPersistence('test', operationId1)

      const operationId2 = monitor.startPersistence('test')
      vi.advanceTimersByTime(20)
      monitor.endPersistence('test', operationId2)

      const metrics = monitor.getMetrics()
      expect(metrics.persistence.avgTime).toBeGreaterThan(0)
    }, 10000)

    it('应该记录最小和最大耗时', async () => {
      const operationId1 = monitor.startPersistence('test')
      vi.advanceTimersByTime(10)
      monitor.endPersistence('test', operationId1)

      const operationId2 = monitor.startPersistence('test')
      vi.advanceTimersByTime(30)
      monitor.endPersistence('test', operationId2)

      const metrics = monitor.getMetrics()
      const record = metrics.persistence.byKey.get('test')

      expect(record).toBeDefined()
      expect(record?.minTime).toBeGreaterThanOrEqual(0)
      expect(record?.maxTime).toBeGreaterThanOrEqual(record?.minTime ?? 0)
    }, 10000)

    it('应该按存储键记录操作', async () => {
      const operationId1 = monitor.startPersistence('key1')
      vi.advanceTimersByTime(10)
      monitor.endPersistence('key1', operationId1)

      const operationId2 = monitor.startPersistence('key2')
      vi.advanceTimersByTime(10)
      monitor.endPersistence('key2', operationId2)

      const metrics = monitor.getMetrics()
      expect(metrics.persistence.byKey.has('key1')).toBe(true)
      expect(metrics.persistence.byKey.has('key2')).toBe(true)
    })
  })

  describe('性能指标获取', () => {
    it('应该返回完整的性能指标', () => {
      monitor.recordStateUpdate('test')
      const operationId = monitor.startPersistence('test')
      monitor.endPersistence('test', operationId)

      const metrics = monitor.getMetrics()

      expect(metrics).toHaveProperty('stateUpdates')
      expect(metrics).toHaveProperty('persistence')
      expect(metrics.stateUpdates).toHaveProperty('totalUpdates')
      expect(metrics.stateUpdates).toHaveProperty('byKey')
      expect(metrics.stateUpdates).toHaveProperty('avgUpdateRate')
      expect(metrics.stateUpdates).toHaveProperty('avgUpdateInterval')
      expect(metrics.persistence).toHaveProperty('totalOperations')
      expect(metrics.persistence).toHaveProperty('byKey')
      expect(metrics.persistence).toHaveProperty('avgTime')
      expect(metrics.persistence).toHaveProperty('totalTime')
    })
  })

  describe('启用/禁用', () => {
    it('应该能够禁用性能监控', () => {
      monitor.disable()
      monitor.recordStateUpdate('test')

      const metrics = monitor.getMetrics()
      expect(metrics.stateUpdates.totalUpdates).toBe(0)
    })

    it('应该能够重新启用性能监控', () => {
      monitor.disable()
      monitor.recordStateUpdate('test')
      monitor.enable()
      monitor.recordStateUpdate('test')

      const metrics = monitor.getMetrics()
      expect(metrics.stateUpdates.totalUpdates).toBe(1)
    })
  })

  describe('清除记录', () => {
    it('应该清除所有记录', () => {
      monitor.recordStateUpdate('test')
      const operationId = monitor.startPersistence('test')
      monitor.endPersistence('test', operationId)

      monitor.clear()

      const metrics = monitor.getMetrics()
      expect(metrics.stateUpdates.totalUpdates).toBe(0)
      expect(metrics.persistence.totalOperations).toBe(0)
    })
  })
})
