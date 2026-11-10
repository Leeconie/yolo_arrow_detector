/**
 * @fileoverview 应用状态管理单元测试
 * @module stores/modules/app.test
 * @author HeZaoCha
 * @date 2026-01-10
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAppStore } from '@/stores/modules/app'

describe('应用状态管理', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('状态初始化', () => {
    it('应该初始化默认状态', () => {
      const store = useAppStore()
      expect(store.loading).toBe(false)
      expect(store.menuCollapsed).toBe(false)
    })
  })

  describe('setLoading', () => {
    it('应该设置加载状态', () => {
      const store = useAppStore()
      store.setLoading(true)
      expect(store.loading).toBe(true)
      store.setLoading(false)
      expect(store.loading).toBe(false)
    })
  })

  describe('toggleMenu', () => {
    it('应该切换菜单折叠状态', () => {
      const store = useAppStore()
      expect(store.menuCollapsed).toBe(false)
      store.toggleMenu()
      expect(store.menuCollapsed).toBe(true)
      store.toggleMenu()
      expect(store.menuCollapsed).toBe(false)
    })
  })

  describe('setMenuCollapsed', () => {
    it('应该设置菜单折叠状态', () => {
      const store = useAppStore()
      store.setMenuCollapsed(true)
      expect(store.menuCollapsed).toBe(true)
      store.setMenuCollapsed(false)
      expect(store.menuCollapsed).toBe(false)
    })
  })
})
