/**
 * @fileoverview 主题状态管理单元测试
 * @module stores/modules/theme.test
 * @author HeZaoCha
 * @date 2026-01-10
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import { useThemeStore } from '@/stores/modules/theme'
import { STORAGE_KEYS, UI_CONSTANTS } from '@/core/config'
import { defaultStateUpdateOptimizer } from '@/stores/utils/state-update-optimizer'

describe('主题状态管理', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    // 重置DOM
    document.documentElement.className = ''
    // 清理状态更新优化器，避免测试间状态污染
    defaultStateUpdateOptimizer.clear()
  })

  describe('状态初始化', () => {
    it('应该使用默认主题模式', () => {
      const store = useThemeStore()
      expect(store.themeMode).toBe(UI_CONSTANTS.DEFAULT_THEME_MODE)
    })

    it('应该从localStorage恢复主题模式', () => {
      localStorage.setItem(STORAGE_KEYS.THEME_MODE, 'dark')
      const store = useThemeStore()
      expect(store.themeMode).toBe('dark')
    })

    it('应该使用默认主题颜色', () => {
      const store = useThemeStore()
      expect(store.themeColor).toBe(UI_CONSTANTS.DEFAULT_THEME_COLOR)
    })

    it('应该从localStorage恢复主题颜色', () => {
      localStorage.setItem(STORAGE_KEYS.THEME_COLOR, '#FF0000')
      const store = useThemeStore()
      expect(store.themeColor).toBe('#FF0000')
    })

    it('应该在初始化时应用主题到DOM', () => {
      localStorage.setItem(STORAGE_KEYS.THEME_MODE, 'dark')
      useThemeStore()
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
  })

  describe('toggleTheme', () => {
    it('应该在light和dark之间切换', async () => {
      const store = useThemeStore()
      expect(store.themeMode).toBe('light')
      store.toggleTheme()

      // 等待状态更新优化器的nextTick
      await nextTick()
      await new Promise((resolve) => setTimeout(resolve, 20))

      expect(store.themeMode).toBe('dark')

      // 等待防抖写入完成
      await new Promise((resolve) => setTimeout(resolve, 350))
      expect(localStorage.getItem(STORAGE_KEYS.THEME_MODE)).toBe('dark')

      store.toggleTheme()
      await nextTick()
      await new Promise((resolve) => setTimeout(resolve, 20))

      expect(store.themeMode).toBe('light')

      // 等待防抖写入完成
      await new Promise((resolve) => setTimeout(resolve, 350))
      expect(localStorage.getItem(STORAGE_KEYS.THEME_MODE)).toBe('light')
    })

    it('应该在切换时更新DOM类', async () => {
      const store = useThemeStore()
      store.toggleTheme()

      // 等待状态更新优化器的nextTick和DOM更新
      await nextTick()
      await new Promise((resolve) => setTimeout(resolve, 20))

      expect(document.documentElement.classList.contains('dark')).toBe(true)

      store.toggleTheme()
      await nextTick()
      await new Promise((resolve) => setTimeout(resolve, 20))

      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
  })

  describe('setThemeMode', () => {
    it('应该设置主题模式并持久化', async () => {
      const store = useThemeStore()
      store.setThemeMode('dark')

      // 等待状态更新优化器的nextTick
      await nextTick()
      await new Promise((resolve) => setTimeout(resolve, 20))

      expect(store.themeMode).toBe('dark')

      // 等待防抖写入完成
      await new Promise((resolve) => setTimeout(resolve, 350))
      expect(localStorage.getItem(STORAGE_KEYS.THEME_MODE)).toBe('dark')
    })

    it('应该更新DOM类', async () => {
      const store = useThemeStore()

      // 确保初始状态是light
      document.documentElement.classList.remove('dark')

      store.setThemeMode('dark')

      // flush() 会调度更新，需要在 nextTick 中执行
      defaultStateUpdateOptimizer.flush()
      // 等待nextTick完成
      await nextTick()
      // 再次等待确保更新完成
      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(document.documentElement.classList.contains('dark')).toBe(true)

      store.setThemeMode('light')
      // 等待状态更新优化器完成
      defaultStateUpdateOptimizer.flush()
      await nextTick()
      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
  })

  describe('setThemeColor', () => {
    it('应该设置主题颜色并持久化', async () => {
      const store = useThemeStore()
      store.setThemeColor('#FF0000')

      // 等待状态更新优化器的nextTick
      await nextTick()
      await new Promise((resolve) => setTimeout(resolve, 20))

      expect(store.themeColor).toBe('#FF0000')

      // 等待防抖写入完成
      await new Promise((resolve) => setTimeout(resolve, 350))
      expect(localStorage.getItem(STORAGE_KEYS.THEME_COLOR)).toBe('#FF0000')
    })
  })

  describe('initTheme', () => {
    it('应该重新应用主题到DOM', async () => {
      const store = useThemeStore()
      store.setThemeMode('dark')

      // flush() 会调度更新，需要在 nextTick 中执行
      defaultStateUpdateOptimizer.flush()
      await nextTick()
      // 再次等待确保更新完成
      await new Promise((resolve) => setTimeout(resolve, 50))

      // 验证主题已应用
      expect(document.documentElement.classList.contains('dark')).toBe(true)

      // 移除DOM类
      document.documentElement.classList.remove('dark')
      expect(document.documentElement.classList.contains('dark')).toBe(false)

      // 重新初始化主题（initTheme是同步的，直接应用DOM类）
      store.initTheme()

      // initTheme是同步的，但为了确保DOM更新，等待一下
      await nextTick()

      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
  })
})
