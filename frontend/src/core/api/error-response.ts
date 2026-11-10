/**
 * @fileoverview 错误响应标准化
 * @module core/api/error-response
 * @description 提供标准化的错误响应格式，确保错误信息不泄露敏感信息
 * @author HeZaoCha
 * @date 2026-01-10
 * @see {@link https://owasp.org/www-community/vulnerabilities/Information_exposure OWASP Information Exposure}
 */

import { envConfig } from '@/core/config/env'

/**
 * 创建标准化的错误响应
 * @param code 错误码（HTTP状态码或业务错误码）
 * @param message 错误消息（用户友好，不包含敏感信息）
 * @param details 详细信息（仅开发环境包含，生产环境自动排除）
 * @returns 标准化的错误响应对象
 * @description
 * 创建标准化的错误响应，确保：
 * - 错误消息用户友好，不暴露技术细节
 * - 详细信息仅在开发环境包含，生产环境自动排除
 * - 包含时间戳，便于问题追踪
 * @example
 * ```typescript
 * const response = createErrorResponse(400, '文件大小超过限制', {
 *   fileSize: 1024 * 1024 * 1024,
 *   maxSize: 512 * 1024 * 1024
 * })
 * // 开发环境：包含details字段
 * // 生产环境：不包含details字段
 * ```
 */
export function createErrorResponse(
  code: number,
  message: string,
  details?: unknown,
): {
  code: number
  message: string
  data: null
  timestamp: number
  details?: unknown
} {
  const response: {
    code: number
    message: string
    data: null
    timestamp: number
    details?: unknown
  } = {
    code,
    message,
    data: null,
    timestamp: Date.now(),
  }

  // 仅在开发环境包含详细信息
  if (envConfig.isDev && details) {
    response.details = details
  }

  return response
}

/**
 * 创建文件上传错误响应
 * @param code 错误码（HTTP状态码或业务错误码）
 * @param message 错误消息（用户友好）
 * @param fileInfo 文件信息（仅包含文件名、大小、类型，不包含路径、内容等敏感信息）
 * @returns 标准化的错误响应对象
 * @description
 * 专门用于文件上传错误的响应创建，确保：
 * - 不包含文件路径、内容等敏感信息
 * - 仅包含必要的文件元数据（文件名、大小、类型）
 * - 详细信息仅在开发环境包含
 * @example
 * ```typescript
 * const response = createFileUploadErrorResponse(400, '文件格式不支持', {
 *   fileName: 'video.mp4',
 *   fileSize: 1024 * 1024,
 *   fileType: 'video/mp4'
 * })
 * ```
 */
export function createFileUploadErrorResponse(
  code: number,
  message: string,
  fileInfo?: {
    fileName?: string
    fileSize?: number
    fileType?: string
  },
): ReturnType<typeof createErrorResponse> {
  const details = fileInfo
    ? {
        fileName: fileInfo.fileName,
        fileSize: fileInfo.fileSize,
        fileType: fileInfo.fileType,
        // 不包含文件路径、内容等敏感信息
      }
    : undefined

  return createErrorResponse(code, message, details)
}
