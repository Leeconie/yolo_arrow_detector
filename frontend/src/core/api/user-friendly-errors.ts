/**
 * @fileoverview 用户友好的错误消息处理
 * @module core/api/user-friendly-errors
 * @description 将技术性错误转换为用户友好的消息，避免暴露技术细节
 * @author HeZaoCha
 * @date 2026-01-10
 */

import { envConfig } from '@/core/config/env'

/**
 * 文件上传错误类型
 */
export enum FileUploadErrorType {
  /** 文件大小超限 */
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  /** 文件格式不支持 */
  FILE_FORMAT_INVALID = 'FILE_FORMAT_INVALID',
  /** 网络错误 */
  NETWORK_ERROR = 'NETWORK_ERROR',
  /** 服务器错误 */
  SERVER_ERROR = 'SERVER_ERROR',
  /** 未知错误 */
  UNKNOWN = 'UNKNOWN',
}

/**
 * 获取文件上传错误类型
 * @param error 错误对象
 * @returns 错误类型
 */
export function getFileUploadErrorType(error: unknown): FileUploadErrorType {
  const axiosError = error as {
    response?: {
      status?: number
      data?: {
        ErrorCode?: string
        ErrorMessage?: string
      }
    }
    code?: string
    message?: string
  }

  // 检查是否是文件大小超限错误
  if (
    axiosError.response?.data?.ErrorCode === 'EntityTooLarge' ||
    axiosError.response?.status === 413 ||
    axiosError.message?.includes('payload size exceeds') ||
    axiosError.message?.includes('EntityTooLarge')
  ) {
    return FileUploadErrorType.FILE_TOO_LARGE
  }

  // 检查是否是文件格式错误
  if (
    axiosError.response?.status === 415 ||
    axiosError.message?.includes('Unsupported Media Type') ||
    axiosError.message?.includes('file format')
  ) {
    return FileUploadErrorType.FILE_FORMAT_INVALID
  }

  // 检查是否是网络错误
  if (
    axiosError.code === 'ERR_NETWORK' ||
    axiosError.code === 'ECONNABORTED' ||
    axiosError.message?.includes('network') ||
    axiosError.message?.includes('timeout')
  ) {
    return FileUploadErrorType.NETWORK_ERROR
  }

  // 检查是否是服务器错误
  if (
    axiosError.response?.status &&
    axiosError.response.status >= 500 &&
    axiosError.response.status < 600
  ) {
    return FileUploadErrorType.SERVER_ERROR
  }

  return FileUploadErrorType.UNKNOWN
}

/**
 * 获取用户友好的文件上传错误消息
 * @param error 错误对象
 * @param fileSize 文件大小（字节）
 * @param maxSize 最大文件大小（字节）
 * @returns 用户友好的错误消息
 */
export function getUserFriendlyUploadError(
  error: unknown,
  fileSize?: number,
  maxSize?: number,
): string {
  const errorType = getFileUploadErrorType(error)
  const axiosError = error as {
    response?: {
      data?: {
        ErrorMessage?: string
      }
    }
  }

  switch (errorType) {
    case FileUploadErrorType.FILE_TOO_LARGE: {
      // 计算文件大小（MB）
      const fileSizeMB = fileSize ? (fileSize / 1024 / 1024).toFixed(2) : '未知'
      const maxSizeMB = maxSize ? (maxSize / 1024 / 1024).toFixed(0) : '512'

      // 生产环境：只显示用户友好的消息
      if (envConfig.isProd) {
        return `文件大小超过限制（${maxSizeMB}MB）。请选择较小的文件后重试。`
      }

      // 开发/测试环境：提供更详细的信息（但不暴露技术细节）
      return (
        `文件大小超过限制（${maxSizeMB}MB）。\n\n` +
        `当前文件大小：${fileSizeMB}MB\n\n` +
        `请选择小于${maxSizeMB}MB的文件后重试。`
      )
    }

    case FileUploadErrorType.FILE_FORMAT_INVALID: {
      return '不支持的文件格式。请选择支持的文件格式后重试。'
    }

    case FileUploadErrorType.NETWORK_ERROR: {
      return '网络连接失败，请检查网络设置后重试。'
    }

    case FileUploadErrorType.SERVER_ERROR: {
      return '服务器暂时无法处理请求，请稍后重试。'
    }

    default: {
      // 尝试从错误消息中提取有用信息（但不暴露技术细节）
      const errorMessage = axiosError.response?.data?.ErrorMessage || ''

      // 如果错误消息包含技术术语，使用通用消息
      if (
        errorMessage.includes('Mock') ||
        errorMessage.includes('mock') ||
        errorMessage.includes('EntityTooLarge') ||
        errorMessage.includes('payload size')
      ) {
        return '上传失败，请稍后重试。如问题持续，请联系技术支持。'
      }

      // 如果错误消息看起来用户友好，直接使用
      if (errorMessage && errorMessage.length < 100 && !errorMessage.includes('ErrorCode')) {
        return errorMessage
      }

      return '上传失败，请稍后重试。如问题持续，请联系技术支持。'
    }
  }
}

/**
 * 获取用户友好的错误消息（通用）
 * @param error 错误对象
 * @param context 上下文信息（可选）
 * @returns 用户友好的错误消息
 */
export function getUserFriendlyError(
  error: unknown,
  context?: {
    operation?: string
    fileSize?: number
    maxSize?: number
  },
): string {
  // 如果是文件上传相关错误，使用专门的处理函数
  if (context?.operation?.includes('upload') || context?.fileSize) {
    return getUserFriendlyUploadError(error, context.fileSize, context.maxSize)
  }

  const axiosError = error as {
    response?: {
      status?: number
      data?: {
        message?: string
        ErrorCode?: string
        ErrorMessage?: string
      }
    }
    message?: string
  }

  // 检查是否是已知的错误类型
  if (axiosError.response?.data?.ErrorCode) {
    const errorCode = axiosError.response.data.ErrorCode

    // 文件大小超限
    if (errorCode === 'EntityTooLarge') {
      return getUserFriendlyUploadError(error, context?.fileSize, context?.maxSize)
    }

    // 其他已知错误码
    if (errorCode === 'Unauthorized') {
      return '登录已过期，请重新登录。'
    }

    if (errorCode === 'Forbidden') {
      return '您没有权限执行此操作。'
    }
  }

  // HTTP状态码处理
  if (axiosError.response?.status) {
    const status = axiosError.response.status

    if (status === 400) {
      return '请求参数错误，请检查后重试。'
    }

    if (status === 401) {
      return '登录已过期，请重新登录。'
    }

    if (status === 403) {
      return '您没有权限执行此操作。'
    }

    if (status === 404) {
      return '请求的资源不存在。'
    }

    if (status === 413) {
      return getUserFriendlyUploadError(error, context?.fileSize, context?.maxSize)
    }

    if (status === 415) {
      return '不支持的文件格式，请选择支持的文件格式。'
    }

    if (status >= 500 && status < 600) {
      return '服务器暂时无法处理请求，请稍后重试。'
    }
  }

  // 网络错误
  if (axiosError.message?.includes('network') || axiosError.message?.includes('timeout')) {
    return '网络连接失败，请检查网络设置后重试。'
  }

  // 默认消息
  return '操作失败，请稍后重试。如问题持续，请联系技术支持。'
}

/**
 * 检查错误消息是否包含技术术语
 * @param message 错误消息
 * @returns 是否包含技术术语
 */
export function containsTechnicalTerms(message: string): boolean {
  const technicalTerms = [
    'Mock',
    'mock',
    'MOCK',
    'EntityTooLarge',
    'payload size',
    'ErrorCode',
    'ErrorMessage',
    'apifox',
    'Apifox',
    'API FOX',
    'VITE_',
    'ENV',
    'localhost',
    '127.0.0.1',
    'CORS',
    'cors',
    'proxy',
    'interceptor',
    'axios',
    'HTTP',
    'status code',
    'request failed',
  ]

  return technicalTerms.some((term) => message.toLowerCase().includes(term.toLowerCase()))
}

/**
 * 清理错误消息，移除技术术语
 * @param message 原始错误消息
 * @returns 清理后的错误消息
 */
export function sanitizeErrorMessage(message: string): string {
  if (!containsTechnicalTerms(message)) {
    return message
  }

  // 如果包含技术术语，返回通用消息
  return '操作失败，请稍后重试。如问题持续，请联系技术支持。'
}
