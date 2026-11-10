/**
 * @fileoverview 认证模块路由配置
 * @module router/modules/auth
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 定义认证相关的路由，包括登录、注册等
 * @dependencies vue-router
 */

import type { RouteRecordRaw } from 'vue-router'

/**
 * 认证模块路由配置
 */
const authRoutes: RouteRecordRaw[] = [
  // 登录页
  {
    path: '/login',
    name: 'LoginPage',
    component: () => import('@/views/auth/Login.vue'),
    meta: {
      title: '用户登录',
      requiresAuth: false,
    },
  },
  // 注册页
  {
    path: '/register',
    name: 'RegisterPage',
    component: () => import('@/views/auth/Register.vue'),
    meta: {
      title: '用户注册',
      requiresAuth: false,
    },
  },
]

export default authRoutes
