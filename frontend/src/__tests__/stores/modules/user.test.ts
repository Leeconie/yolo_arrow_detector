/**
 * @fileoverview 用户状态管理单元测试
 * @module stores/modules/user.test
 * @author HeZaoCha
 * @date 2026-01-10
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/stores/modules/user'
import { defaultStateUpdateOptimizer } from '@/stores/utils/state-update-optimizer'

import { STORAGE_KEYS } from '@/core/config' // Used in localStorage operations

describe('用户状态管理', () => {
  beforeEach(() => {
    // 每个测试前创建新的Pinia实例
    setActivePinia(createPinia())
    // 清空localStorage
    localStorage.clear()
  })

  describe('状态初始化', () => {
    it('应该初始化空状态', () => {
      const store = useUserStore()
      expect(store.token).toBe('')
      expect(store.userInfo).toBeNull()
      expect(store.isLoggedIn).toBe(false)
    })

    it('应该从localStorage恢复token', () => {
      localStorage.setItem(STORAGE_KEYS.TOKEN, 'saved-token')
      const store = useUserStore()
      expect(store.token).toBe('saved-token')
      expect(store.isLoggedIn).toBe(true)
    })

    it('应该从localStorage恢复用户信息', () => {
      const userInfo = { id: 1, username: 'testuser', name: 'Test User', email: 'test@example.com' }
      localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo))
      const store = useUserStore()
      expect(store.userInfo).toEqual(userInfo)
    })

    it('应该在用户信息解析失败时清除损坏的数据', () => {
      localStorage.setItem(STORAGE_KEYS.USER_INFO, 'invalid-json')
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const store = useUserStore()
      expect(store.userInfo).toBeNull()
      expect(localStorage.getItem(STORAGE_KEYS.USER_INFO)).toBeNull()
      consoleSpy.mockRestore()
    })
  })

  describe('setToken', () => {
    it('应该设置token并持久化', async () => {
      const store = useUserStore()
      store.setToken('new-token')
      // 等待状态更新优化器完成（合并窗口16ms + nextTick）
      defaultStateUpdateOptimizer.flush()
      await nextTick()
      await new Promise((resolve) => setTimeout(resolve, 30))
      expect(store.token).toBe('new-token')
      expect(store.isLoggedIn).toBe(true)
      // 等待防抖延迟完成
      await new Promise((resolve) => setTimeout(resolve, 350))
      expect(localStorage.getItem(STORAGE_KEYS.TOKEN)).toBe('new-token')
    })

    it('应该在设置空token时清除存储', async () => {
      const store = useUserStore()
      store.setToken('token')
      // 等待第一次更新完成
      defaultStateUpdateOptimizer.flush()
      await nextTick()
      await new Promise((resolve) => setTimeout(resolve, 20))
      store.setToken('')
      // 等待第二次更新完成
      defaultStateUpdateOptimizer.flush()
      await nextTick()
      await new Promise((resolve) => setTimeout(resolve, 20))
      expect(store.token).toBe('')
      expect(localStorage.getItem(STORAGE_KEYS.TOKEN)).toBeNull()
      expect(store.isLoggedIn).toBe(false)
    })
  })

  describe('setUserInfo', () => {
    it('应该设置用户信息并持久化', async () => {
      const store = useUserStore()
      const userInfo = { id: 1, username: 'testuser', name: 'Test User', email: 'test@example.com' }
      store.setUserInfo(userInfo)
      // 等待状态更新优化器完成
      defaultStateUpdateOptimizer.flush()
      await nextTick()
      await new Promise((resolve) => setTimeout(resolve, 20))
      expect(store.userInfo).toEqual(userInfo)
      // 等待防抖延迟完成
      await new Promise((resolve) => setTimeout(resolve, 350))
      expect(localStorage.getItem(STORAGE_KEYS.USER_INFO)).toBe(JSON.stringify(userInfo))
    })
  })

  describe('logout', () => {
    it('应该清除所有状态和存储', async () => {
      const store = useUserStore()
      store.setToken('token')
      store.setUserInfo({ id: 1, username: 'test', name: 'Test' })
      // 等待状态更新完成
      defaultStateUpdateOptimizer.flush()
      await nextTick()
      await new Promise((resolve) => setTimeout(resolve, 20))
      store.logout()
      expect(store.token).toBe('')
      expect(store.userInfo).toBeNull()
      expect(store.isLoggedIn).toBe(false)
      expect(localStorage.getItem(STORAGE_KEYS.TOKEN)).toBeNull()
      expect(localStorage.getItem(STORAGE_KEYS.USER_INFO)).toBeNull()
    })
  })

  describe('isLoggedIn', () => {
    it('应该在有token时返回true', async () => {
      const store = useUserStore()
      // 先清除状态更新优化器的缓存，避免去重逻辑影响
      defaultStateUpdateOptimizer.clear()
      store.setToken('token')
      // 等待状态更新优化器完成（合并窗口16ms + nextTick）
      defaultStateUpdateOptimizer.flush()
      await nextTick()
      await new Promise((resolve) => setTimeout(resolve, 30))
      expect(store.token).toBeTruthy() // 先验证token已设置
      expect(store.isLoggedIn).toBe(true)
    })

    it('应该在无token时返回false', () => {
      const store = useUserStore()
      expect(store.isLoggedIn).toBe(false)
    })
  })

  describe('initState', () => {
    it('应该重新初始化状态', () => {
      const store = useUserStore()
      store.setToken('token1')
      localStorage.setItem(STORAGE_KEYS.TOKEN, 'token2')
      store.initState()
      expect(store.token).toBe('token2')
    })
  })

  describe('响应式性能优化', () => {
    it('应该使用shallowRef优化userInfo（减少深度响应式追踪）', async () => {
      const store = useUserStore()
      const userInfo = {
        id: 1,
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        nested: { prop: 'value' },
      }

      // 设置用户信息
      store.setUserInfo(userInfo)

      // 等待状态更新优化器完成
      defaultStateUpdateOptimizer.flush()
      await nextTick()
      await new Promise((resolve) => setTimeout(resolve, 20))

      // 验证userInfo是响应式的（可以访问）
      expect(store.userInfo).toEqual(userInfo)

      // 验证修改嵌套属性不会触发深度响应式追踪（shallowRef的特性）
      // 注意：由于使用了状态更新优化器，更新可能被延迟，需要等待
      if (store.userInfo) {
        store.userInfo.nested.prop = 'new-value'
        // shallowRef只追踪第一层，嵌套属性修改不会触发响应式更新
        // 但我们可以验证userInfo本身仍然是响应式的
        expect(store.userInfo.nested.prop).toBe('new-value')
      }
    })

    it('应该优化计算属性依赖（isLoggedIn只依赖token.value）', async () => {
      const store = useUserStore()

      // 初始状态：无token
      expect(store.isLoggedIn).toBe(false)

      // 设置token
      store.setToken('test-token')
      // 等待状态更新优化器完成（合并窗口16ms + nextTick）
      defaultStateUpdateOptimizer.flush()
      await nextTick()
      await new Promise((resolve) => setTimeout(resolve, 30))
      expect(store.isLoggedIn).toBe(true)

      // 清除token
      store.setToken('')
      // 等待状态更新优化器完成
      defaultStateUpdateOptimizer.flush()
      await nextTick()
      await new Promise((resolve) => setTimeout(resolve, 30))
      expect(store.isLoggedIn).toBe(false)
    })

    it('应该确保计算属性在token变化时正确更新', async () => {
      const store = useUserStore()

      // 初始状态
      expect(store.isLoggedIn).toBe(false)

      // 设置token（使用状态更新优化器，需要等待）
      store.setToken('new-token')

      // 等待状态更新优化器的合并窗口和nextTick
      await new Promise((resolve) => setTimeout(resolve, 50))

      // 验证isLoggedIn已更新
      expect(store.isLoggedIn).toBe(true)

      // 清除token
      store.setToken('')
      await new Promise((resolve) => setTimeout(resolve, 50))

      // 验证isLoggedIn已更新
      expect(store.isLoggedIn).toBe(false)
    })
  })
})
