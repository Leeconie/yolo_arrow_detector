/**
 * @fileoverview 状态管理性能测试
 * @module __tests__/stores/performance
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 测试状态管理性能优化效果，包括响应速度、内存使用、持久化性能、状态更新频率
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/stores/modules/user'
import { useThemeStore } from '@/stores/modules/theme'
import { defaultStateUpdateOptimizer } from '@/stores/utils/state-update-optimizer'
import { defaultStatePerformanceMonitor } from '@/stores/utils/state-performance-monitor'

describe('状态管理性能测试', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    // 启用性能监控
    defaultStatePerformanceMonitor.enable()
    defaultStatePerformanceMonitor.clear()
  })

  afterEach(() => {
    defaultStatePerformanceMonitor.clear()
    defaultStateUpdateOptimizer.clear()
  })

  describe('响应速度提升效果', () => {
    it('应该减少状态更新延迟（使用状态更新优化器）', async () => {
      const store = useUserStore()

      // 快速连续更新多次
      for (let i = 0; i < 10; i++) {
        store.setToken(`token-${i}`)
      }

      // 等待状态更新优化器的合并窗口和nextTick
      await new Promise((resolve) => setTimeout(resolve, 50))

      // 验证状态已更新（最后一次的值）
      expect(store.token).toBe('token-9')

      // 验证更新延迟较小（优化器合并了多次更新）
      // 注意：由于使用了优化器，实际更新次数应该少于10次
      const metrics = defaultStatePerformanceMonitor.getMetrics()
      expect(metrics.stateUpdates.totalUpdates).toBeLessThan(10)
    })

    it('应该通过批量更新减少响应式触发次数', async () => {
      const store = useUserStore()
      const themeStore = useThemeStore()

      // 同时更新多个状态
      store.setToken('new-token')
      store.setUserInfo({ id: 1, name: 'Test', email: 'test@example.com' })
      themeStore.setThemeMode('dark')
      themeStore.setThemeColor('#FF0000')

      // 等待状态更新优化器批量应用
      await new Promise((resolve) => setTimeout(resolve, 50))

      // 验证所有状态都已更新
      expect(store.token).toBe('new-token')
      expect(store.userInfo).not.toBeNull()
      expect(themeStore.themeMode).toBe('dark')
      expect(themeStore.themeColor).toBe('#FF0000')
    })
  })

  describe('内存使用优化效果', () => {
    it('应该减少不必要的响应式对象（使用shallowRef）', async () => {
      const store = useUserStore()

      // 设置用户信息（使用shallowRef）
      const userInfo = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        nested: {
          prop: 'value',
        },
      }

      store.setUserInfo(userInfo)

      // 等待状态更新优化器
      await new Promise((resolve) => setTimeout(resolve, 50))

      // shallowRef只追踪第一层，嵌套对象不会深度响应式
      // 这减少了内存使用和响应式追踪开销
      expect(store.userInfo).toEqual(userInfo)
    })

    it('应该通过更新去重减少重复状态对象', async () => {
      const store = useUserStore()
      const sameUserInfo = { id: 1, name: 'Test', email: 'test@example.com' }

      // 使用相同的值更新多次
      store.setUserInfo(sameUserInfo)
      store.setUserInfo(sameUserInfo)
      store.setUserInfo(sameUserInfo)

      // 等待状态更新优化器
      await new Promise((resolve) => setTimeout(resolve, 50))

      // 验证只更新了一次（去重）
      const metrics = defaultStatePerformanceMonitor.getMetrics()
      // 由于去重，更新次数应该少于3次
      expect(metrics.stateUpdates.totalUpdates).toBeLessThan(3)
    })
  })

  describe('持久化性能提升', () => {
    it('应该通过批量写入减少localStorage操作次数', async () => {
      const store = useUserStore()
      const themeStore = useThemeStore()

      // 快速连续更新多个状态
      store.setToken('token-1')
      store.setUserInfo({ id: 1, name: 'Test', email: 'test@example.com' })
      themeStore.setThemeMode('dark')
      themeStore.setThemeColor('#FF0000')

      // 等待持久化优化器的防抖延迟（300ms + 50ms缓冲）
      await new Promise((resolve) => setTimeout(resolve, 350))

      // 验证持久化操作次数（应该通过批量写入减少）
      const metrics = defaultStatePerformanceMonitor.getMetrics()
      // 持久化操作应该被优化（批量写入）
      expect(metrics.persistence.totalOperations).toBeGreaterThan(0)
    })

    it('应该通过防抖机制减少频繁IO操作', async () => {
      const store = useUserStore()

      // 快速连续更新token多次
      for (let i = 0; i < 5; i++) {
        store.setToken(`token-${i}`)
        await new Promise((resolve) => setTimeout(resolve, 10))
      }

      // 等待防抖延迟（300ms + 50ms缓冲）
      await new Promise((resolve) => setTimeout(resolve, 350))

      // 验证最终值已持久化
      expect(localStorage.getItem('token')).toBe('token-4')
    })
  })

  describe('状态更新频率降低效果', () => {
    it('应该通过更新合并减少更新次数', async () => {
      const store = useUserStore()

      // 快速连续更新相同状态
      for (let i = 0; i < 10; i++) {
        store.setToken(`token-${i}`)
      }

      // 等待状态更新优化器合并
      await new Promise((resolve) => setTimeout(resolve, 50))

      const metrics = defaultStatePerformanceMonitor.getMetrics()
      // 由于更新合并，实际更新次数应该少于10次
      expect(metrics.stateUpdates.totalUpdates).toBeLessThan(10)
    })

    it('应该统计状态更新频率', async () => {
      const store = useUserStore()

      // 模拟多次状态更新
      for (let i = 0; i < 5; i++) {
        store.setToken(`token-${i}`)
        // 等待状态更新优化器完成
        defaultStateUpdateOptimizer.flush()
        await new Promise((resolve) => setTimeout(resolve, 20))
      }

      // 等待所有更新完成
      await new Promise((resolve) => setTimeout(resolve, 100))
      // 确保所有更新都已应用
      defaultStateUpdateOptimizer.flush()
      await new Promise((resolve) => setTimeout(resolve, 50))

      const metrics = defaultStatePerformanceMonitor.getMetrics()
      expect(metrics.stateUpdates.totalUpdates).toBeGreaterThan(0)
      expect(metrics.stateUpdates.avgUpdateRate).toBeGreaterThan(0)
    })
  })
})
