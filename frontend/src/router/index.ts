/**
 * @fileoverview 路由配置入口
 * @module router
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 创建路由实例并配置路由守卫
 * @dependencies vue-router, @/router/modules/routes, @/router/guards
 */

import { createRouter, createWebHistory } from 'vue-router'
import routes from './modules/routes'
import { setupAuthGuard } from './guards'

/**
 * 创建路由实例
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// 设置路由守卫
setupAuthGuard(router)

export default router
