/**
 * @fileoverview 视频上传模块路由配置
 * @module router/modules/video
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 定义视频上传相关的路由
 * @dependencies vue-router
 */

import type { RouteRecordRaw } from 'vue-router'

/**
 * 视频上传模块路由配置
 */
const videoRoutes: RouteRecordRaw[] = [
  // 视频上传页面
  {
    path: '/video/upload',
    name: 'VideoUpload',
    component: () => import('@/modules/video/upload/page/UploadPage.vue'),
    meta: {
      title: '视频上传',
      requiresAuth: true,
    },
  },
  // 批量上传页面
  {
    path: '/video/batch-upload',
    name: 'BatchVideoUpload',
    component: () => import('@/modules/video/upload/page/BatchUploadPage.vue'),
    meta: {
      title: '批量上传',
      requiresAuth: true,
    },
  },
]

export default videoRoutes
