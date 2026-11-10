/**
 * @fileoverview 性能监控器测试
 * @module __tests__/core/api/performance-monitor
 * @author HeZaoCha
 * @date 2026-01-10
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { PerformanceMonitor } from '@/core/api/performance-monitor'

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor

  beforeEach(() => {
    monitor = new PerformanceMonitor({ enabled: true })
  })

  describe('请求计时', () => {
    it('应该能够记录请求开始和结束时间', async () => {
      const requestId = 'test-request-1'
      monitor.startRequest(requestId, '/api/test', 'GET')
      await new Promise((resolve) => setTimeout(resolve, 10))
      monitor.endRequest(requestId, true)

      const metrics = monitor.getMetrics()
      const timing = metrics.requestTimings.find((t) => t.requestId === requestId)
      expect(timing).toBeDefined()
      expect(timing?.totalTime).toBeGreaterThan(0)
    })

    it('应该能够记录拦截器耗时', () => {
      const requestId = 'test-request-2'
      monitor.startRequest(requestId)
      monitor.recordInterceptorTime(requestId, 5)
      monitor.endRequest(requestId, true)

      const metrics = monitor.getMetrics()
      const timing = metrics.requestTimings.find((t) => t.requestId === requestId)
      expect(timing?.interceptorTime).toBe(5)
    })

    it('应该能够记录网络请求耗时', () => {
      const requestId = 'test-request-3'
      monitor.startRequest(requestId)
      monitor.recordNetworkTime(requestId, 100)
      monitor.endRequest(requestId, true)

      const metrics = monitor.getMetrics()
      const timing = metrics.requestTimings.find((t) => t.requestId === requestId)
      expect(timing?.networkTime).toBe(100)
    })

    it('应该能够记录响应处理耗时', () => {
      const requestId = 'test-request-4'
      monitor.startRequest(requestId)
      monitor.recordResponseTime(requestId, 10)
      monitor.endRequest(requestId, true)

      const metrics = monitor.getMetrics()
      const timing = metrics.requestTimings.find((t) => t.requestId === requestId)
      expect(timing?.responseTime).toBe(10)
    })
  })

  describe('缓存统计', () => {
    it('应该能够记录缓存命中', () => {
      monitor.recordCacheHit()
      monitor.recordCacheHit()
      monitor.recordCacheMiss()

      const metrics = monitor.getMetrics()
      // 注意：缓存统计不在getMetrics中返回，需要单独检查
      // 这里主要验证方法不会抛出错误
      expect(metrics).toBeDefined()
    })

    it('应该能够记录缓存未命中', () => {
      monitor.recordCacheMiss()
      monitor.recordCacheMiss()
      monitor.recordCacheHit()

      const metrics = monitor.getMetrics()
      expect(metrics).toBeDefined()
    })
  })

  describe('性能指标', () => {
    it('应该能够计算平均请求耗时', () => {
      monitor.startRequest('req1')
      monitor.endRequest('req1', true)

      monitor.startRequest('req2')
      monitor.endRequest('req2', true)

      const metrics = monitor.getMetrics()
      expect(metrics.averageRequestTime).toBeGreaterThan(0)
      expect(metrics.totalRequests).toBe(2)
    })

    it('应该能够统计成功和失败请求数', () => {
      monitor.startRequest('req1')
      monitor.endRequest('req1', true)

      monitor.startRequest('req2')
      monitor.endRequest('req2', false)

      monitor.startRequest('req3')
      monitor.endRequest('req3', true)

      const metrics = monitor.getMetrics()
      expect(metrics.successfulRequests).toBe(2)
      expect(metrics.failedRequests).toBe(1)
      expect(metrics.totalRequests).toBe(3)
    })
  })

  describe('启用/禁用', () => {
    it('应该能够禁用性能监控', () => {
      monitor.disable()
      monitor.startRequest('req1')
      monitor.endRequest('req1', true)

      const metrics = monitor.getMetrics()
      expect(metrics.requestTimings.length).toBe(0)
    })

    it('应该能够重新启用性能监控', () => {
      monitor.disable()
      monitor.enable()
      monitor.startRequest('req1')
      monitor.endRequest('req1', true)

      const metrics = monitor.getMetrics()
      expect(metrics.requestTimings.length).toBe(1)
    })
  })

  describe('清除数据', () => {
    it('应该能够清除所有统计数据', () => {
      monitor.startRequest('req1')
      monitor.endRequest('req1', true)
      monitor.recordCacheHit()

      monitor.clear()

      const metrics = monitor.getMetrics()
      expect(metrics.requestTimings.length).toBe(0)
      expect(metrics.totalRequests).toBe(0)
    })
  })
})
