/**
 * @fileoverview API模块统一导出
 * @module core/api
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 统一导出API相关功能，包括请求方法和类型定义
 */

export { default as request, get, post, put, del as delete } from './request'
export * from './types'
// 导出业务API
export * from './archery'
export * from './user'
export * from '@/types/api'

// 业务API导出
// export * as archeryApi from './archery' // 导出射箭分析API（如果存在）
export * as userApi from './user' // 导出用户API

// 性能优化相关导出
export { defaultCacheManager, CacheManager } from './cache'
export { defaultRequestQueue, RequestQueue, RequestPriority } from './request-queue'
export { defaultPerformanceMonitor, PerformanceMonitor } from './performance-monitor'
export { tokenCache, csrfTokenCache } from './token-cache'

// 视频上传相关函数
export { validateVideoFile, uploadVideoChunk } from './video-upload'
