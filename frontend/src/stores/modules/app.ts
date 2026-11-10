/**
 * @fileoverview 应用状态管理
 * @module stores/modules/app
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 管理应用全局状态，包括loading、菜单状态等
 * @dependencies pinia, vue
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 应用状态Store
 */
export const useAppStore = defineStore('app', () => {
  /**
   * 全局加载状态
   */
  const loading = ref<boolean>(false)

  /**
   * 菜单折叠状态
   */
  const menuCollapsed = ref<boolean>(false)

  /**
   * 设置加载状态
   * @param value 加载状态值
   */
  const setLoading = (value: boolean) => {
    loading.value = value
  }

  /**
   * 切换菜单折叠状态
   */
  const toggleMenu = () => {
    menuCollapsed.value = !menuCollapsed.value
  }

  /**
   * 设置菜单折叠状态
   * @param value 折叠状态值
   */
  const setMenuCollapsed = (value: boolean) => {
    menuCollapsed.value = value
  }

  return {
    // 状态
    loading,
    menuCollapsed,
    // 方法
    setLoading,
    toggleMenu,
    setMenuCollapsed,
  }
})
