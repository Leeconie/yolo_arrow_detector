/**
 * @fileoverview 工具函数性能监控器测试
 * @module __tests__/utils/performance-monitor
 * @author HeZaoCha
 * @date 2026-01-10
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { UtilsPerformanceMonitor } from '@/utils/performance-monitor'

describe('UtilsPerformanceMonitor', () => {
  let monitor: UtilsPerformanceMonitor

  beforeEach(() => {
    monitor = new UtilsPerformanceMonitor({
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

  describe('函数执行时间统计', () => {
    it('应该记录函数执行次数', async () => {
      const executionId1 = monitor.startExecution('testFunction')
      vi.advanceTimersByTime(10)
      monitor.endExecution('testFunction', executionId1)

      const executionId2 = monitor.startExecution('testFunction')
      vi.advanceTimersByTime(10)
      monitor.endExecution('testFunction', executionId2)

      const metrics = monitor.getMetrics()
      expect(metrics.functionExecutions.totalExecutions).toBe(2)
    }, 10000)

    it('应该计算平均执行时间', async () => {
      const executionId1 = monitor.startExecution('testFunction')
      vi.advanceTimersByTime(10)
      monitor.endExecution('testFunction', executionId1)

      const executionId2 = monitor.startExecution('testFunction')
      vi.advanceTimersByTime(20)
      monitor.endExecution('testFunction', executionId2)

      const metrics = monitor.getMetrics()
      expect(metrics.functionExecutions.avgExecutionTime).toBeGreaterThan(0)
    }, 10000)

    it('应该记录最小和最大执行时间', async () => {
      const executionId1 = monitor.startExecution('testFunction')
      vi.advanceTimersByTime(10)
      monitor.endExecution('testFunction', executionId1)

      const executionId2 = monitor.startExecution('testFunction')
      vi.advanceTimersByTime(30)
      monitor.endExecution('testFunction', executionId2)

      const metrics = monitor.getMetrics()
      const record = metrics.functionExecutions.byFunction.get('testFunction')

      expect(record).toBeDefined()
      expect(record?.minTime).toBeGreaterThanOrEqual(0)
      expect(record?.maxTime).toBeGreaterThanOrEqual(record?.minTime ?? 0)
    }, 10000)

    it('应该按函数名记录执行', async () => {
      const executionId1 = monitor.startExecution('function1')
      vi.advanceTimersByTime(10)
      monitor.endExecution('function1', executionId1)

      const executionId2 = monitor.startExecution('function2')
      vi.advanceTimersByTime(10)
      monitor.endExecution('function2', executionId2)

      const metrics = monitor.getMetrics()
      expect(metrics.functionExecutions.byFunction.has('function1')).toBe(true)
      expect(metrics.functionExecutions.byFunction.has('function2')).toBe(true)
    }, 10000)
  })

  describe('缓存命中率统计', () => {
    it('应该记录缓存命中', () => {
      monitor.recordCacheHit('testCache')
      monitor.recordCacheHit('testCache')

      const metrics = monitor.getMetrics()
      expect(metrics.cacheStatistics.totalHits).toBe(2)
    })

    it('应该记录缓存未命中', () => {
      monitor.recordCacheMiss('testCache')
      monitor.recordCacheMiss('testCache')

      const metrics = monitor.getMetrics()
      expect(metrics.cacheStatistics.totalMisses).toBe(2)
    })

    it('应该计算缓存命中率', () => {
      monitor.recordCacheHit('testCache')
      monitor.recordCacheHit('testCache')
      monitor.recordCacheMiss('testCache')

      const metrics = monitor.getMetrics()
      expect(metrics.cacheStatistics.overallHitRate).toBeCloseTo(2 / 3, 2)
    })

    it('应该按缓存名称记录统计', () => {
      monitor.recordCacheHit('cache1')
      monitor.recordCacheMiss('cache1')
      monitor.recordCacheHit('cache2')

      const metrics = monitor.getMetrics()
      const cache1Record = metrics.cacheStatistics.byCache.get('cache1')
      const cache2Record = metrics.cacheStatistics.byCache.get('cache2')

      expect(cache1Record).toBeDefined()
      expect(cache1Record?.totalRequests).toBe(2)
      expect(cache1Record?.cacheHits).toBe(1)
      expect(cache1Record?.cacheMisses).toBe(1)
      expect(cache2Record).toBeDefined()
      expect(cache2Record?.totalRequests).toBe(1)
      expect(cache2Record?.cacheHits).toBe(1)
    })
  })

  describe('性能指标获取', () => {
    it('应该返回完整的性能指标', async () => {
      const executionId = monitor.startExecution('testFunction')
      vi.advanceTimersByTime(10)
      monitor.endExecution('testFunction', executionId)

      monitor.recordCacheHit('testCache')
      monitor.recordCacheMiss('testCache')

      const metrics = monitor.getMetrics()

      expect(metrics).toHaveProperty('functionExecutions')
      expect(metrics).toHaveProperty('cacheStatistics')
      expect(metrics.functionExecutions).toHaveProperty('totalExecutions')
      expect(metrics.functionExecutions).toHaveProperty('byFunction')
      expect(metrics.functionExecutions).toHaveProperty('avgExecutionTime')
      expect(metrics.functionExecutions).toHaveProperty('totalExecutionTime')
      expect(metrics.cacheStatistics).toHaveProperty('totalRequests')
      expect(metrics.cacheStatistics).toHaveProperty('totalHits')
      expect(metrics.cacheStatistics).toHaveProperty('totalMisses')
      expect(metrics.cacheStatistics).toHaveProperty('overallHitRate')
      expect(metrics.cacheStatistics).toHaveProperty('byCache')
    })
  })

  describe('启用/禁用', () => {
    it('应该能够禁用性能监控', () => {
      monitor.disable()
      const executionId = monitor.startExecution('testFunction')
      monitor.endExecution('testFunction', executionId)
      monitor.recordCacheHit('testCache')

      const metrics = monitor.getMetrics()
      expect(metrics.functionExecutions.totalExecutions).toBe(0)
      expect(metrics.cacheStatistics.totalRequests).toBe(0)
    })

    it('应该能够重新启用性能监控', () => {
      monitor.disable()
      const executionId1 = monitor.startExecution('testFunction')
      monitor.endExecution('testFunction', executionId1)
      monitor.enable()
      const executionId2 = monitor.startExecution('testFunction')
      monitor.endExecution('testFunction', executionId2)

      const metrics = monitor.getMetrics()
      expect(metrics.functionExecutions.totalExecutions).toBe(1)
    })
  })

  describe('清除记录', () => {
    it('应该清除所有记录', async () => {
      const executionId = monitor.startExecution('testFunction')
      vi.advanceTimersByTime(10)
      monitor.endExecution('testFunction', executionId)
      monitor.recordCacheHit('testCache')

      monitor.clear()

      const metrics = monitor.getMetrics()
      expect(metrics.functionExecutions.totalExecutions).toBe(0)
      expect(metrics.cacheStatistics.totalRequests).toBe(0)
    })
  })
})
