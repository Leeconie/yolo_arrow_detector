/**
 * @fileoverview 主题状态管理
 * @module stores/modules/theme
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 管理主题相关的状态，包括主题模式、主题色等
 * @dependencies pinia, vue, @/core/config
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { STORAGE_KEYS, UI_CONSTANTS } from '@/core/config'
import { defaultPersistenceOptimizer } from '../utils/persistence-optimizer'
import { defaultStateUpdateOptimizer } from '../utils/state-update-optimizer'

/**
 * 主题模式类型
 */
export type ThemeMode = 'light' | 'dark'

/**
 * 主题状态Store
 */
export const useThemeStore = defineStore('theme', () => {
  /**
   * 主题模式（light/dark）
   */
  const themeMode = ref<ThemeMode>(
    (localStorage.getItem(STORAGE_KEYS.THEME_MODE) as ThemeMode) || UI_CONSTANTS.DEFAULT_THEME_MODE,
  )

  /**
   * 主题颜色
   */
  const themeColor = ref<string>(
    localStorage.getItem(STORAGE_KEYS.THEME_COLOR) || UI_CONSTANTS.DEFAULT_THEME_COLOR,
  )

  /**
   * 切换主题模式
   * @description 在light和dark之间切换，并持久化到localStorage
   * 性能优化：使用状态更新优化器合并频繁更新，使用防抖写入减少IO操作
   */
  const toggleTheme = () => {
    const newMode: ThemeMode = themeMode.value === 'light' ? 'dark' : 'light'

    // 性能优化：使用状态更新优化器合并频繁更新
    defaultStateUpdateOptimizer.scheduleUpdate(
      'themeMode',
      () => {
        themeMode.value = newMode
        // 性能优化：使用防抖写入
        defaultPersistenceOptimizer.debounceWrite(STORAGE_KEYS.THEME_MODE, newMode)
        // 更新HTML根元素的class，用于CSS变量切换
        document.documentElement.classList.toggle('dark', newMode === 'dark')
      },
      newMode, // 传入值用于去重检查
    )
  }

  /**
   * 设置主题模式
   * @param mode 主题模式
   * @description 性能优化：使用状态更新优化器合并频繁更新，使用防抖写入减少IO操作
   */
  const setThemeMode = (mode: ThemeMode) => {
    // 性能优化：使用状态更新优化器合并频繁更新，避免重复更新相同值
    defaultStateUpdateOptimizer.scheduleUpdate(
      'themeMode',
      () => {
        themeMode.value = mode
        // 性能优化：使用防抖写入
        defaultPersistenceOptimizer.debounceWrite(STORAGE_KEYS.THEME_MODE, mode)
        document.documentElement.classList.toggle('dark', mode === 'dark')
      },
      mode, // 传入值用于去重检查
    )
  }

  /**
   * 设置主题颜色
   * @param color 主题颜色
   * @description 性能优化：使用状态更新优化器合并频繁更新，使用防抖写入减少IO操作
   */
  const setThemeColor = (color: string) => {
    // 性能优化：使用状态更新优化器合并频繁更新，避免重复更新相同值
    defaultStateUpdateOptimizer.scheduleUpdate(
      'themeColor',
      () => {
        themeColor.value = color
        // 性能优化：使用防抖写入
        defaultPersistenceOptimizer.debounceWrite(STORAGE_KEYS.THEME_COLOR, color)
      },
      color, // 传入值用于去重检查
    )
  }

  /**
   * 初始化主题
   * @description 从localStorage恢复主题设置，并应用到页面
   */
  const initTheme = () => {
    // 应用主题模式到HTML根元素
    document.documentElement.classList.toggle('dark', themeMode.value === 'dark')
  }

  // 初始化主题
  initTheme()

  return {
    // 状态
    themeMode,
    themeColor,
    // 方法
    toggleTheme,
    setThemeMode,
    setThemeColor,
    initTheme,
  }
})
