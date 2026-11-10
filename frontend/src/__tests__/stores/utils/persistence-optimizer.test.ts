/**
 * @fileoverview 持久化优化器测试
 * @module __tests__/stores/utils/persistence-optimizer
 * @author HeZaoCha
 * @date 2026-01-10
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { PersistenceOptimizer } from '@/stores/utils/persistence-optimizer'

describe('PersistenceOptimizer', () => {
  let optimizer: PersistenceOptimizer
  let localStorageMock: Storage

  beforeEach(() => {
    // Mock localStorage
    localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    }
    global.localStorage = localStorageMock as Storage

    optimizer = new PersistenceOptimizer({
      batchSize: 3,
      batchDelay: 100,
      debounceDelay: 200,
      throttleInterval: 500,
    })
  })

  afterEach(() => {
    optimizer.clear()
    vi.clearAllTimers()
  })

  describe('批量写入', () => {
    it('应该能够批量写入多个更新', async () => {
      optimizer.batchWrite('key1', 'value1')
      optimizer.batchWrite('key2', 'value2')
      optimizer.batchWrite('key3', 'value3') // 达到批量大小，立即写入

      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(localStorageMock.setItem).toHaveBeenCalledTimes(3)
      // 注意：当值是字符串时，直接存储字符串本身，不使用JSON.stringify
      expect(localStorageMock.setItem).toHaveBeenCalledWith('key1', 'value1')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('key2', 'value2')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('key3', 'value3')
    })

    it('应该在延迟后写入未达到批量大小的更新', async () => {
      vi.useFakeTimers()

      optimizer.batchWrite('key1', 'value1')
      optimizer.batchWrite('key2', 'value2')

      expect(localStorageMock.setItem).not.toHaveBeenCalled()

      vi.advanceTimersByTime(100)

      expect(localStorageMock.setItem).toHaveBeenCalledTimes(2)

      vi.useRealTimers()
    })

    it('应该按优先级排序写入', async () => {
      optimizer.batchWrite('key1', 'value1', 1)
      optimizer.batchWrite('key2', 'value2', 3)
      optimizer.batchWrite('key3', 'value3', 2)

      optimizer.flushBatch()

      const calls = (localStorageMock.setItem as { mock: { calls: unknown[][] } }).mock.calls
      // 应该按优先级从高到低写入
      expect(calls[0][0]).toBe('key2') // 优先级3
      expect(calls[1][0]).toBe('key3') // 优先级2
      expect(calls[2][0]).toBe('key1') // 优先级1
    })
  })

  describe('防抖写入', () => {
    it('应该延迟写入', async () => {
      vi.useFakeTimers()

      optimizer.debounceWrite('key1', 'value1')

      expect(localStorageMock.setItem).not.toHaveBeenCalled()

      vi.advanceTimersByTime(200)

      expect(localStorageMock.setItem).toHaveBeenCalledTimes(1)
      // 注意：当值是字符串时，直接存储字符串本身，不使用JSON.stringify
      expect(localStorageMock.setItem).toHaveBeenCalledWith('key1', 'value1')

      vi.useRealTimers()
    })

    it('应该取消旧的定时器当有新更新时', async () => {
      vi.useFakeTimers()

      optimizer.debounceWrite('key1', 'value1')
      optimizer.debounceWrite('key1', 'value2')

      vi.advanceTimersByTime(200)

      expect(localStorageMock.setItem).toHaveBeenCalledTimes(1)
      // 注意：当值是字符串时，直接存储字符串本身，不使用JSON.stringify
      expect(localStorageMock.setItem).toHaveBeenCalledWith('key1', 'value2')

      vi.useRealTimers()
    })
  })

  describe('节流写入', () => {
    it('应该限制写入频率', () => {
      optimizer.throttleWrite('key1', 'value1')
      optimizer.throttleWrite('key1', 'value2')
      optimizer.throttleWrite('key1', 'value3')

      // 第一次写入应该成功，后续写入应该被节流
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(1)
      // 注意：当值是字符串时，直接存储字符串本身，不使用JSON.stringify
      expect(localStorageMock.setItem).toHaveBeenCalledWith('key1', 'value1')
    })

    it('应该在节流间隔后允许写入', () => {
      vi.useFakeTimers()

      optimizer.throttleWrite('key1', 'value1')
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(1)

      optimizer.throttleWrite('key1', 'value2')
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(1) // 被节流

      vi.advanceTimersByTime(500) // 超过节流间隔

      optimizer.throttleWrite('key1', 'value3')
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(2)

      vi.useRealTimers()
    })
  })

  describe('立即写入', () => {
    it('应该立即写入不经过优化', () => {
      optimizer.immediateWrite('key1', 'value1')

      expect(localStorageMock.setItem).toHaveBeenCalledTimes(1)
      // 注意：当值是字符串时，直接存储字符串本身，不使用JSON.stringify
      expect(localStorageMock.setItem).toHaveBeenCalledWith('key1', 'value1')
    })
  })

  describe('清除功能', () => {
    it('应该能够清除所有待处理的更新', () => {
      optimizer.batchWrite('key1', 'value1')
      optimizer.batchWrite('key2', 'value2')
      optimizer.debounceWrite('key3', 'value3')

      optimizer.clear()

      optimizer.flushBatch()
      expect(localStorageMock.setItem).not.toHaveBeenCalled()
    })
  })

  describe('统计信息', () => {
    it('应该正确统计写入次数', () => {
      optimizer.batchWrite('key1', 'value1')
      optimizer.batchWrite('key2', 'value2')
      optimizer.batchWrite('key3', 'value3')

      optimizer.flushBatch()

      const stats = optimizer.getStats()
      expect(stats.totalWrites).toBe(3)
      expect(stats.batchWrites).toBe(3)
    })
  })
})
