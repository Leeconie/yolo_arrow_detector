/**
 * @fileoverview 根路由配置
 * @module router/modules/routes
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 统一导入并导出所有模块的路由配置
 * @dependencies vue-router, ./auth.routes, ./user.routes, ./home.routes, ./archery.routes, ./video.routes
 */

import type { RouteRecordRaw } from 'vue-router'
import authRoutes from './auth.routes'
import userRoutes from './user.routes'
import homeRoutes from './home.routes'
import archeryRoutes from './archery.routes'
import videoRoutes from './video.routes'

/**
 * 基础路由配置
 * @description 定义应用的基础路由，包括首页、登录页、404页等
 */
const baseRoutes: RouteRecordRaw[] = [
  // 404页面
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFoundPage',
    component: () => import('@/views/NotFound.vue'),
    meta: {
      title: '页面不存在',
      requiresAuth: false,
    },
  },
]

/**
 * 导出所有路由
 * @description 合并基础路由和所有模块路由
 */
const routes: RouteRecordRaw[] = [
  ...authRoutes,
  ...homeRoutes,
  ...userRoutes,
  ...archeryRoutes,
  ...videoRoutes,
  // 分析历史路由
  {
    path: '/analysis/history',
    name: 'AnalysisHistory',
    component: () => import('@/views/history/HistoryPage.vue'),
    meta: {
      title: '分析历史',
      requiresAuth: true,
    },
  },
  // 技术指导路由
  {
    path: '/technique/guide',
    name: 'TechniqueGuide',
    component: () => import('@/views/technique/TechniqueGuide.vue'),
    meta: {
      title: '技术指导',
      requiresAuth: true,
    },
  },
  // 分析结果路由
  {
    path: '/analysis/result',
    name: 'AnalysisResult',
    component: () => import('@/views/analysis/AnalysisResult.vue'),
    meta: {
      title: '分析结果',
      requiresAuth: true,
    },
  },
  // 帮助页面路由
  {
    path: '/help',
    name: 'Help',
    component: () => import('@/views/help/Help.vue'),
    meta: {
      title: '使用帮助',
      requiresAuth: true,
    },
  },
  ...baseRoutes,
]

export default routes
