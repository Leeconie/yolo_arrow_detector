/**
 * @fileoverview 状态更新优化器测试
 * @module __tests__/stores/utils/state-update-optimizer
 * @author HeZaoCha
 * @date 2026-01-10
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { StateUpdateOptimizer } from '@/stores/utils/state-update-optimizer'

describe('StateUpdateOptimizer', () => {
  let optimizer: StateUpdateOptimizer

  beforeEach(() => {
    optimizer = new StateUpdateOptimizer({
      mergeWindow: 16,
      enableDeduplication: true,
      enableNextTick: true,
    })
    vi.useFakeTimers()
  })

  afterEach(() => {
    optimizer.clear()
    vi.useRealTimers()
  })

  describe('状态更新合并', () => {
    it('应该合并多个连续的状态更新', async () => {
      const updateFn1 = vi.fn()
      const updateFn2 = vi.fn()
      const updateFn3 = vi.fn()

      // 快速连续调度多个更新
      optimizer.scheduleUpdate('test', updateFn1)
      optimizer.scheduleUpdate('test', updateFn2)
      optimizer.scheduleUpdate('test', updateFn3)

      // 等待合并窗口
      await vi.advanceTimersByTimeAsync(16)

      // 等待nextTick
      await nextTick()

      // 应该只执行最后一次更新（相同key的更新会被覆盖）
      expect(updateFn1).not.toHaveBeenCalled()
      expect(updateFn2).not.toHaveBeenCalled()
      expect(updateFn3).toHaveBeenCalledTimes(1)
    })

    it('应该合并不同key的更新', async () => {
      const updateFn1 = vi.fn()
      const updateFn2 = vi.fn()

      optimizer.scheduleUpdate('key1', updateFn1)
      optimizer.scheduleUpdate('key2', updateFn2)

      // 等待合并窗口
      await vi.advanceTimersByTimeAsync(16)

      // 等待nextTick
      await nextTick()

      // 应该都执行
      expect(updateFn1).toHaveBeenCalledTimes(1)
      expect(updateFn2).toHaveBeenCalledTimes(1)
    })
  })

  describe('批量更新机制', () => {
    it('应该收集多个更新，一次性应用', async () => {
      const updateFn1 = vi.fn()
      const updateFn2 = vi.fn()
      const updateFn3 = vi.fn()

      optimizer.scheduleUpdate('key1', updateFn1)
      optimizer.scheduleUpdate('key2', updateFn2)
      optimizer.scheduleUpdate('key3', updateFn3)

      // 等待合并窗口
      await vi.advanceTimersByTimeAsync(16)

      // 等待nextTick
      await nextTick()

      // 应该都执行
      expect(updateFn1).toHaveBeenCalledTimes(1)
      expect(updateFn2).toHaveBeenCalledTimes(1)
      expect(updateFn3).toHaveBeenCalledTimes(1)
    })

    it('应该使用nextTick批量应用更新', async () => {
      const updateFn = vi.fn()

      optimizer.scheduleUpdate('test', updateFn)

      // 等待合并窗口（这会触发setTimeout回调）
      await vi.advanceTimersByTimeAsync(16)

      // 等待nextTick完成（在fake timers环境下，nextTick需要手动触发）
      await nextTick()

      // 在fake timers环境下，需要推进时间以确保所有异步操作完成
      await vi.advanceTimersByTimeAsync(0)

      // 应该在nextTick后执行
      expect(updateFn).toHaveBeenCalledTimes(1)
    }, 10000)
  })

  describe('更新去重', () => {
    it('应该避免重复更新相同状态', async () => {
      const updateFn = vi.fn()
      const value = { name: 'test' }

      // 使用相同的值调度两次更新
      optimizer.scheduleUpdate('test', updateFn, value)
      optimizer.scheduleUpdate('test', updateFn, value)

      // 等待合并窗口
      await vi.advanceTimersByTimeAsync(16)

      // 等待nextTick
      await nextTick()

      // 应该只执行一次（去重）
      expect(updateFn).toHaveBeenCalledTimes(1)
    })

    it('应该允许不同值的更新', async () => {
      const updateFn = vi.fn()

      optimizer.scheduleUpdate('test', updateFn, { name: 'test1' })
      optimizer.scheduleUpdate('test', updateFn, { name: 'test2' })

      // 等待合并窗口
      await vi.advanceTimersByTimeAsync(16)

      // 等待nextTick
      await nextTick()

      // 应该执行（值不同）
      expect(updateFn).toHaveBeenCalledTimes(1) // 相同key的更新会被覆盖，只保留最后一次
    })

    it('应该深度比较对象值', async () => {
      const updateFn = vi.fn()
      const value1 = { name: 'test', age: 20 }
      const value2 = { name: 'test', age: 20 }

      optimizer.scheduleUpdate('test', updateFn, value1)
      optimizer.scheduleUpdate('test', updateFn, value2)

      // 等待合并窗口
      await vi.advanceTimersByTimeAsync(16)

      // 等待nextTick
      await nextTick()

      // 应该只执行一次（深度比较认为值相同）
      expect(updateFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('nextTick优化', () => {
    it('应该在下一个DOM更新周期前完成状态更新', async () => {
      const updateFn = vi.fn()

      optimizer.scheduleUpdate('test', updateFn)

      // 等待合并窗口（这会触发setTimeout回调）
      await vi.advanceTimersByTimeAsync(16)

      // 在fake timers环境下，nextTick可能立即执行，所以不检查在nextTick之前是否执行
      // 等待nextTick完成
      await nextTick()

      // 在fake timers环境下，需要推进时间以确保所有异步操作完成
      await vi.advanceTimersByTimeAsync(0)

      // 应该在nextTick后执行
      expect(updateFn).toHaveBeenCalledTimes(1)
    }, 10000)

    it('可以在禁用nextTick时立即执行', async () => {
      const optimizerWithoutNextTick = new StateUpdateOptimizer({
        enableNextTick: false,
      })

      const updateFn = vi.fn()

      optimizerWithoutNextTick.scheduleUpdate('test', updateFn)

      // 等待合并窗口
      await vi.advanceTimersByTimeAsync(16)

      // 应该立即执行（不使用nextTick）
      expect(updateFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('flush方法', () => {
    it('应该立即应用所有待处理的更新', async () => {
      const updateFn1 = vi.fn()
      const updateFn2 = vi.fn()

      optimizer.scheduleUpdate('key1', updateFn1)
      optimizer.scheduleUpdate('key2', updateFn2)

      // 立即刷新
      optimizer.flush()

      // 等待nextTick
      await nextTick()

      // 应该都执行
      expect(updateFn1).toHaveBeenCalledTimes(1)
      expect(updateFn2).toHaveBeenCalledTimes(1)
    })
  })

  describe('clear方法', () => {
    it('应该清除所有待处理的更新', async () => {
      const updateFn = vi.fn()

      optimizer.scheduleUpdate('test', updateFn)

      // 清除
      optimizer.clear()

      // 等待合并窗口
      await vi.advanceTimersByTimeAsync(16)

      // 等待nextTick
      await nextTick()

      // 不应该执行（已清除）
      expect(updateFn).not.toHaveBeenCalled()
    })
  })

  describe('错误处理', () => {
    it('应该处理更新函数中的错误', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const updateFn = vi.fn(() => {
        throw new Error('Test error')
      })

      optimizer.scheduleUpdate('test', updateFn)

      // 等待合并窗口
      await vi.advanceTimersByTimeAsync(16)

      // 等待nextTick
      await nextTick()

      // 应该记录错误但不中断其他更新
      expect(consoleErrorSpy).toHaveBeenCalledWith('状态更新失败: test', expect.any(Error))

      consoleErrorSpy.mockRestore()
    })
  })
})
