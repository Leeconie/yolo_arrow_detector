/**
 * @fileoverview Store统一导出
 * @module stores
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 统一导出所有Store模块
 * @dependencies pinia
 */

import { createPinia } from 'pinia'

/**
 * 创建Pinia实例
 */
const pinia = createPinia()

export default pinia

// 导出所有Store模块
export { useUserStore } from './modules/user'
export { useThemeStore } from './modules/theme'
export { useAppStore } from './modules/app'
