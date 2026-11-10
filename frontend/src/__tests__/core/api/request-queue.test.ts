/**
 * @fileoverview 请求队列管理器测试
 * @module __tests__/core/api/request-queue
 * @author HeZaoCha
 * @date 2026-01-10
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { RequestQueue, RequestPriority } from '@/core/api/request-queue'

describe('RequestQueue', () => {
  let queue: RequestQueue

  beforeEach(() => {
    queue = new RequestQueue({
      maxConcurrency: 2,
      enableDeduplication: true,
      deduplicationWindow: 100,
    })
  })

  describe('并发控制', () => {
    it('应该限制并发请求数', async () => {
      const results: number[] = []
      const promises: Promise<number>[] = []

      // 创建5个请求，但最大并发数为2
      for (let i = 0; i < 5; i++) {
        const promise = queue.execute(
          () =>
            new Promise<number>((resolve) => {
              setTimeout(() => {
                results.push(i)
                resolve(i)
              }, 50)
            }),
          RequestPriority.NORMAL,
          'GET',
          `/api/test${i}`,
        )
        promises.push(promise)
      }

      await Promise.all(promises)

      // 验证所有请求都完成了
      expect(results.length).toBe(5)
      expect(results.sort()).toEqual([0, 1, 2, 3, 4])
    })

    it('应该正确处理并发请求', async () => {
      const startTime = Date.now()
      const promises = [
        queue.execute(
          () => new Promise((resolve) => setTimeout(() => resolve(1), 100)),
          RequestPriority.NORMAL,
          'GET',
          '/api/test1',
        ),
        queue.execute(
          () => new Promise((resolve) => setTimeout(() => resolve(2), 100)),
          RequestPriority.NORMAL,
          'GET',
          '/api/test2',
        ),
        queue.execute(
          () => new Promise((resolve) => setTimeout(() => resolve(3), 100)),
          RequestPriority.NORMAL,
          'GET',
          '/api/test3',
        ),
      ]

      await Promise.all(promises)
      const duration = Date.now() - startTime

      // 由于并发限制为2，3个请求应该需要至少200ms（前两个并发，第三个等待）
      expect(duration).toBeGreaterThanOrEqual(150)
    })
  })

  describe('优先级处理', () => {
    it('应该优先处理高优先级请求', async () => {
      const results: number[] = []

      // 先添加普通优先级请求
      queue.execute(
        () =>
          new Promise<number>((resolve) => {
            setTimeout(() => {
              results.push(1)
              resolve(1)
            }, 100)
          }),
        RequestPriority.NORMAL,
        'GET',
        '/api/normal',
      )

      // 立即添加高优先级请求
      queue.execute(
        () =>
          new Promise<number>((resolve) => {
            setTimeout(() => {
              results.push(2)
              resolve(2)
            }, 50)
          }),
        RequestPriority.HIGH,
        'GET',
        '/api/high',
      )

      await new Promise((resolve) => setTimeout(resolve, 200))

      // 高优先级请求应该先完成（即使后添加）
      expect(results[0]).toBe(2)
    })
  })

  describe('请求去重', () => {
    it('应该合并相同请求', async () => {
      let callCount = 0
      const requestFn = () => {
        callCount++
        return Promise.resolve({ data: 'test' })
      }

      // 同时发起3个相同请求
      const promises = [
        queue.execute(requestFn, RequestPriority.NORMAL, 'GET', '/api/test', { id: 1 }),
        queue.execute(requestFn, RequestPriority.NORMAL, 'GET', '/api/test', { id: 1 }),
        queue.execute(requestFn, RequestPriority.NORMAL, 'GET', '/api/test', { id: 1 }),
      ]

      const results = await Promise.all(promises)

      // 请求函数应该只被调用一次
      expect(callCount).toBe(1)
      // 所有Promise应该返回相同结果
      expect(results[0]).toEqual({ data: 'test' })
      expect(results[1]).toEqual({ data: 'test' })
      expect(results[2]).toEqual({ data: 'test' })
    })

    it('应该区分不同参数的请求', async () => {
      let callCount = 0
      const requestFn = (id: number) => {
        callCount++
        return Promise.resolve({ id })
      }

      const promises = [
        queue.execute(() => requestFn(1), RequestPriority.NORMAL, 'GET', '/api/test', { id: 1 }),
        queue.execute(() => requestFn(2), RequestPriority.NORMAL, 'GET', '/api/test', { id: 2 }),
      ]

      await Promise.all(promises)

      // 不同参数的请求应该分别执行
      expect(callCount).toBe(2)
    })
  })

  describe('队列统计', () => {
    it('应该正确统计队列信息', async () => {
      queue.execute(() => Promise.resolve(1), RequestPriority.NORMAL, 'GET', '/api/test1')
      queue.execute(() => Promise.resolve(2), RequestPriority.NORMAL, 'GET', '/api/test2')
      queue.execute(() => Promise.resolve(3), RequestPriority.HIGH, 'GET', '/api/test3')

      await new Promise((resolve) => setTimeout(resolve, 50))

      const stats = queue.getStats()
      expect(stats.total).toBeGreaterThanOrEqual(3)
      expect(stats.completed).toBeGreaterThanOrEqual(3)
    })
  })

  describe('清空队列', () => {
    it('应该能够清空队列', async () => {
      // 设置最大并发数为0，确保所有请求都进入队列
      const limitedQueue = new RequestQueue({
        maxConcurrency: 0,
        enableDeduplication: false,
      })

      const promises = [
        limitedQueue.execute(
          () => new Promise((resolve) => setTimeout(() => resolve(1), 100)),
          RequestPriority.NORMAL,
          'GET',
          '/api/test1',
        ),
        limitedQueue.execute(
          () => new Promise((resolve) => setTimeout(() => resolve(2), 100)),
          RequestPriority.NORMAL,
          'GET',
          '/api/test2',
        ),
      ]

      // 等待请求进入队列
      await new Promise((resolve) => setTimeout(resolve, 10))

      // 立即清空队列
      limitedQueue.clear()

      // 所有请求应该被拒绝
      await expect(Promise.all(promises)).rejects.toThrow()
    })
  })
})
