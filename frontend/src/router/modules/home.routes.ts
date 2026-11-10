/**
 * @fileoverview 首页模块路由配置
 * @module router/modules/home
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 定义首页相关的路由
 * @dependencies vue-router
 */

import type { RouteRecordRaw } from 'vue-router'

/**
 * 首页模块路由配置
 */
const homeRoutes: RouteRecordRaw[] = [
  // 根路径重定向到首页
  {
    path: '/',
    name: 'HomePage',
    redirect: '/home',
    meta: {
      hidden: true,
      title: '首页',
      requiresAuth: false,
    },
  },
  // 首页
  {
    path: '/home',
    name: 'HomeIndex',
    component: () => import('@/views/home/HomeIndex.vue'),
    meta: {
      title: '首页',
      requiresAuth: true,
    },
  },
]

export default homeRoutes
