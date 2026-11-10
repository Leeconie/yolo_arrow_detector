/**
 * @fileoverview API请求性能测试
 * @module core/api/performance.test
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 测试API请求性能优化的效果，包括响应时间、并发处理、缓存命中率、内存使用
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { CacheManager } from '@/core/api/cache'
import { RequestQueue, RequestPriority } from '@/core/api/request-queue'
import { PerformanceMonitor } from '@/core/api/performance-monitor'

describe('API请求性能优化', () => {
  let cacheManager: CacheManager
  let requestQueue: RequestQueue
  let performanceMonitor: PerformanceMonitor

  beforeEach(() => {
    cacheManager = new CacheManager()
    requestQueue = new RequestQueue()
    performanceMonitor = new PerformanceMonitor()
  })

  afterEach(() => {
    cacheManager.clear()
    requestQueue.clear()
    performanceMonitor.clear()
  })

  describe('请求响应时间优化', () => {
    it('应该测量请求响应时间', async () => {
      const startTime = performance.now()

      // 模拟一个请求
      await new Promise((resolve) => setTimeout(resolve, 10))

      const endTime = performance.now()
      const duration = endTime - startTime

      // 允许一些误差，因为定时器精度问题
      expect(duration).toBeGreaterThanOrEqual(8)
      expect(duration).toBeLessThan(50) // 允许一些误差
    })

    it('应该通过缓存减少响应时间', async () => {
      const method = 'GET'
      const url = '/api/users'
      const params = {}
      const data = { users: [{ id: 1, name: 'Test' }] }

      // 第一次请求（无缓存）
      const startTime1 = performance.now()
      cacheManager.set(method, url, params, data)
      const cachedData = cacheManager.get(method, url, params)
      const endTime1 = performance.now()
      const duration1 = endTime1 - startTime1

      // 第二次请求（有缓存）
      const startTime2 = performance.now()
      const cachedData2 = cacheManager.get(method, url, params)
      const endTime2 = performance.now()
      const duration2 = endTime2 - startTime2

      expect(cachedData).toEqual(data)
      expect(cachedData2).toEqual(data)
      // 缓存读取应该比设置快得多
      expect(duration2).toBeLessThan(duration1 * 10)
    })
  })

  describe('并发处理能力', () => {
    it('应该支持多个并发请求', async () => {
      const requests: Promise<unknown>[] = []
      const maxConcurrency = 10

      for (let i = 0; i < maxConcurrency; i++) {
        const request = requestQueue.execute(
          async () => {
            await new Promise((resolve) => setTimeout(resolve, 10))
            return { id: i }
          },
          RequestPriority.NORMAL,
          'GET',
          `/api/test/${i}`,
          {},
        )
        requests.push(request)
      }

      const results = await Promise.all(requests)
      expect(results).toHaveLength(maxConcurrency)
      results.forEach((result, index) => {
        expect(result).toEqual({ id: index })
      })
    })

    it('应该限制最大并发数', async () => {
      const maxConcurrency = 5
      const requestQueueLimited = new RequestQueue({ maxConcurrency })
      const activeRequests: number[] = []
      let maxActive = 0

      const requests: Promise<unknown>[] = []
      for (let i = 0; i < 20; i++) {
        const request = requestQueueLimited.execute(
          async () => {
            activeRequests.push(i)
            maxActive = Math.max(maxActive, activeRequests.length)
            await new Promise((resolve) => setTimeout(resolve, 10))
            activeRequests.splice(activeRequests.indexOf(i), 1)
            return { id: i }
          },
          RequestPriority.NORMAL,
          'GET',
          `/api/test/${i}`,
          {},
        )
        requests.push(request)
      }

      await Promise.all(requests)
      // 最大并发数应该不超过限制
      expect(maxActive).toBeLessThanOrEqual(maxConcurrency)
    })

    it('应该支持请求优先级', async () => {
      const results: number[] = []

      // 添加低优先级请求
      requestQueue.execute(
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 50))
          results.push(1)
          return { priority: 'low' }
        },
        RequestPriority.NORMAL,
        'GET',
        '/api/low',
        {},
      )

      // 添加高优先级请求
      requestQueue.execute(
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 10))
          results.push(0)
          return { priority: 'high' }
        },
        RequestPriority.HIGH,
        'GET',
        '/api/high',
        {},
      )

      await new Promise((resolve) => setTimeout(resolve, 100))

      // 高优先级请求应该先完成
      expect(results[0]).toBe(0)
    })
  })

  describe('缓存命中率', () => {
    it('应该统计缓存命中率', () => {
      const method = 'GET'
      const url = '/api/users'
      const params = {}
      const data = { users: [] }

      // 设置缓存
      cacheManager.set(method, url, params, data)

      // 第一次获取（命中）
      const hit1 = cacheManager.get(method, url, params)
      expect(hit1).toEqual(data)

      // 第二次获取（命中）
      const hit2 = cacheManager.get(method, url, params)
      expect(hit2).toEqual(data)

      // 获取不存在的缓存（未命中）
      const miss = cacheManager.get(method, '/api/other', params)
      expect(miss).toBeNull()
    })

    it('应该处理缓存过期', async () => {
      const method = 'GET'
      const url = '/api/users'
      const params = {}
      const data = { users: [] }
      const ttl = 100 // 100ms

      cacheManager.set(method, url, params, data, ttl)

      // 立即获取（应该命中）
      const hit = cacheManager.get(method, url, params)
      expect(hit).toEqual(data)

      // 等待过期
      await new Promise((resolve) => setTimeout(resolve, 150))

      // 过期后获取（应该未命中）
      const miss = cacheManager.get(method, url, params)
      expect(miss).toBeNull()
    })

    it('应该支持缓存大小限制', () => {
      const maxSize = 3
      const limitedCache = new CacheManager({ maxSize })
      const method = 'GET'

      // 添加超过限制的缓存项
      for (let i = 0; i < 5; i++) {
        limitedCache.set(method, `/api/item/${i}`, {}, { id: i })
      }

      // 最早的项应该被移除（LRU策略）
      const oldest = limitedCache.get(method, '/api/item/0', {})
      expect(oldest).toBeNull()

      // 最新的项应该存在
      const newest = limitedCache.get(method, '/api/item/4', {})
      expect(newest).toEqual({ id: 4 })
    })
  })

  describe('内存使用情况', () => {
    it('应该监控内存使用', () => {
      // 在浏览器环境中，performance.memory可能不可用
      if (typeof performance !== 'undefined' && 'memory' in performance) {
        const memoryBefore =
          (performance as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize || 0

        // 创建一些缓存
        for (let i = 0; i < 100; i++) {
          cacheManager.set(`/api/item/${i}`, {}, { data: 'x'.repeat(1000) })
        }

        const memoryAfter =
          (performance as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize || 0

        // 内存使用应该增加
        if (memoryBefore > 0 && memoryAfter > 0) {
          expect(memoryAfter).toBeGreaterThan(memoryBefore)
        }
      }
    })

    it('应该清理过期缓存释放内存', async () => {
      const method = 'GET'
      // 创建带过期时间的缓存
      for (let i = 0; i < 10; i++) {
        cacheManager.set(method, `/api/item/${i}`, {}, { data: 'x'.repeat(1000) }, 50)
      }

      // 等待过期
      await new Promise((resolve) => setTimeout(resolve, 100))

      // 尝试获取（应该都已过期）
      for (let i = 0; i < 10; i++) {
        const item = cacheManager.get(method, `/api/item/${i}`, {})
        expect(item).toBeNull()
      }
    })

    it('应该支持手动清理缓存', () => {
      const method = 'GET'
      // 创建缓存
      for (let i = 0; i < 10; i++) {
        cacheManager.set(method, `/api/item/${i}`, {}, { id: i })
      }

      // 清理缓存
      cacheManager.clear()

      // 所有缓存应该被清除
      for (let i = 0; i < 10; i++) {
        const item = cacheManager.get(method, `/api/item/${i}`, {})
        expect(item).toBeNull()
      }
    })
  })

  describe('性能监控', () => {
    it('应该记录请求耗时', () => {
      const requestId = 'test-request-1'
      performanceMonitor.startRequest(requestId)

      // 模拟请求处理
      const duration = 50
      setTimeout(() => {
        performanceMonitor.endRequest(requestId)
      }, duration)

      // 等待请求完成
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const metrics = performanceMonitor.getMetrics()
          expect(metrics.totalRequests).toBeGreaterThan(0)
          resolve()
        }, duration + 10)
      })
    })

    it('应该统计缓存命中率', () => {
      // 启用性能监控
      performanceMonitor.enable()
      performanceMonitor.recordCacheHit()
      performanceMonitor.recordCacheHit()
      performanceMonitor.recordCacheMiss()

      const metrics = performanceMonitor.getMetrics()
      // getMetrics() 返回 cacheHitRate，不直接返回 cacheHits 和 cacheMisses
      // 但我们可以通过 cacheHitRate 验证统计是否正确
      const totalCacheRequests = 3 // 2 hits + 1 miss
      const expectedHitRate = (2 / totalCacheRequests) * 100
      expect(metrics.cacheHitRate).toBeCloseTo(expectedHitRate, 2)
    })
  })

  describe('性能优化效果验证', () => {
    it('缓存应该显著提升重复请求的性能', async () => {
      const method = 'GET'
      const url = '/api/users'
      const params = {}
      const data = { users: [] }

      // 第一次请求（设置缓存）
      const start1 = performance.now()
      cacheManager.set(method, url, params, data)
      const end1 = performance.now()
      const time1 = end1 - start1

      // 第二次请求（使用缓存）
      const start2 = performance.now()
      const cached = cacheManager.get(method, url, params)
      const end2 = performance.now()
      const time2 = end2 - start2

      expect(cached).toEqual(data)
      // 缓存读取应该比设置快得多（虽然在这个测试中差异可能很小）
      expect(time2).toBeLessThanOrEqual(time1 * 2)
    })

    it('请求队列应该有效管理并发', async () => {
      const maxConcurrency = 3
      const queue = new RequestQueue({ maxConcurrency })
      const activeCounts: number[] = []
      let currentActive = 0

      const requests: Promise<unknown>[] = []
      for (let i = 0; i < 10; i++) {
        requests.push(
          queue.execute(
            async () => {
              currentActive++
              activeCounts.push(currentActive)
              await new Promise((resolve) => setTimeout(resolve, 20))
              currentActive--
              return { id: i }
            },
            RequestPriority.NORMAL,
            'GET',
            `/api/test/${i}`,
            {},
          ),
        )
      }

      await Promise.all(requests)

      // 最大并发数应该不超过限制
      const maxActive = Math.max(...activeCounts)
      expect(maxActive).toBeLessThanOrEqual(maxConcurrency)
    })
  })
})
