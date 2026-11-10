/**
 * @fileoverview 用户模块路由配置
 * @module router/modules/user
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 定义用户相关的路由，包括个人中心等
 * @dependencies vue-router
 */

import type { RouteRecordRaw } from 'vue-router'

/**
 * 用户模块路由配置
 */
const userRoutes: RouteRecordRaw[] = [
  // 个人中心
  {
    path: '/profile',
    name: 'UserProfile',
    component: () => import('@/views/user/UserProfile.vue'),
    meta: {
      title: '个人中心',
      requiresAuth: true,
    },
  },
]

export default userRoutes
