/**
 * @fileoverview 射箭分析模块路由配置
 * @module router/modules/archery
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 定义射箭分析相关的路由
 * @dependencies vue-router
 */

import type { RouteRecordRaw } from 'vue-router'

/**
 * 射箭分析模块路由配置
 */
const archeryRoutes: RouteRecordRaw[] = [
  // 射箭分析主页面
  {
    path: '/archery',
    name: 'ArcheryIndex',
    component: () => import('@/views/archery-analysis/ArcheryIndex.vue'),
    meta: {
      title: '射箭分析',
      requiresAuth: true,
    },
  },
  // AI 视频识别（真实调用 backend/ 的 YOLO 服务）
  // requiresAuth 设为 false：这是前后端联调的入口页，避免被登录守卫拦在外面
  {
    path: '/ai-analysis',
    name: 'AiAnalysis',
    component: () => import('@/views/ai-analysis/AiAnalysis.vue'),
    meta: {
      title: 'AI 视频识别',
      requiresAuth: false,
    },
  },
]

export default archeryRoutes
