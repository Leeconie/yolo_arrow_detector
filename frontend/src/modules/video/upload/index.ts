/**
 * @fileoverview 视频上传模块入口文件
 * @module modules/video/upload
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 统一导出视频上传模块的公共API
 */

export { default as UploadPage } from './page/UploadPage.vue'
export { default as VideoUploader } from './components/VideoUploader.vue'
export { default as TypeSelector } from './components/TypeSelector.vue'
export { useVideoUpload } from './composables/useVideoUpload'
export * from './types/uploadTypes'
export * from './api/uploadApi'
