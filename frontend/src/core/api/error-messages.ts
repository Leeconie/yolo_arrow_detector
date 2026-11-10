/**
 * @fileoverview 错误消息映射表
 * @module core/api/error-messages
 * @description 定义统一的错误消息映射，提供友好的错误提示
 * @author HeZaoCha
 * @date 2026-01-10
 */

import { ErrorCode } from '@/types/api'
import { containsTechnicalTerms } from './user-friendly-errors'

/**
 * 错误消息映射表
 * @description 根据错误码返回友好的错误消息
 */
export const ERROR_MESSAGES: Record<number, string> = {
  [ErrorCode.UNAUTHORIZED]: '登录已过期，请重新登录',
  [ErrorCode.FORBIDDEN]: '您没有权限访问该资源',
  [ErrorCode.NOT_FOUND]: '请求的资源不存在',
  [ErrorCode.SERVER_ERROR]: '服务器内部错误，请稍后重试',
  [ErrorCode.TIMEOUT]: '请求超时，请检查网络连接后重试',
  [ErrorCode.NETWORK_ERROR]: '网络连接失败，请检查网络设置',
}

/**
 * 网络错误类型
 */
export enum NetworkErrorType {
  /** 网络断开 */
  OFFLINE = 'offline',
  /** 请求超时 */
  TIMEOUT = 'timeout',
  /** DNS解析失败 */
  DNS_FAILED = 'dns_failed',
  /** 连接被拒绝 */
  CONNECTION_REFUSED = 'connection_refused',
  /** 其他网络错误 */
  UNKNOWN = 'unknown',
}

/**
 * 获取网络错误类型
 * @param error Axios错误对象
 * @returns 网络错误类型
 */
export function getNetworkErrorType(error: { code?: string; message?: string }): NetworkErrorType {
  const code = error.code
  const message = error.message?.toLowerCase() || ''

  // 请求超时
  if (code === 'ECONNABORTED' || code === 'ETIMEDOUT' || message.includes('timeout')) {
    return NetworkErrorType.TIMEOUT
  }

  // DNS解析失败
  if (code === 'ENOTFOUND' || code === 'EAI_AGAIN' || message.includes('dns')) {
    return NetworkErrorType.DNS_FAILED
  }

  // 连接被拒绝
  if (code === 'ECONNREFUSED' || message.includes('connection refused')) {
    return NetworkErrorType.CONNECTION_REFUSED
  }

  // 网络断开
  if (code === 'ERR_NETWORK' || message.includes('network error') || !navigator.onLine) {
    return NetworkErrorType.OFFLINE
  }

  return NetworkErrorType.UNKNOWN
}

/**
 * 获取网络错误消息
 * @param errorType 网络错误类型
 * @returns 友好的错误消息
 */
export function getNetworkErrorMessage(errorType: NetworkErrorType): string {
  const messages: Record<NetworkErrorType, string> = {
    [NetworkErrorType.OFFLINE]: '网络连接已断开，请检查网络设置后重试',
    [NetworkErrorType.TIMEOUT]: '请求超时，请检查网络连接后重试',
    [NetworkErrorType.DNS_FAILED]: '无法解析服务器地址，请检查网络设置',
    [NetworkErrorType.CONNECTION_REFUSED]: '服务器连接被拒绝，请稍后重试',
    [NetworkErrorType.UNKNOWN]: '网络错误，请检查网络连接',
  }

  return messages[errorType] || messages[NetworkErrorType.UNKNOWN]
}

/**
 * 获取HTTP状态码对应的错误消息
 * @param status HTTP状态码
 * @param defaultMessage 默认错误消息
 * @returns 友好的错误消息
 */
export function getHttpErrorMessage(status: number, defaultMessage?: string): string {
  // 优先使用映射表中的消息
  if (ERROR_MESSAGES[status]) {
    return ERROR_MESSAGES[status]
  }

  // 如果提供了默认消息，检查并清理技术术语
  if (defaultMessage) {
    if (containsTechnicalTerms(defaultMessage)) {
      // 包含技术术语，使用通用消息（包含状态码）
      if (status >= 400 && status < 500) {
        return `请求错误 (${status})，请检查请求参数`
      }
      if (status >= 500 && status < 600) {
        return `服务器错误 (${status})，请稍后重试`
      }
      return `请求失败 (${status})`
    }
    // 不包含技术术语，直接使用
    return defaultMessage
  }

  // 4xx客户端错误
  if (status >= 400 && status < 500) {
    return `请求错误 (${status})，请检查请求参数`
  }

  // 5xx服务器错误
  if (status >= 500 && status < 600) {
    return `服务器错误 (${status})，请稍后重试`
  }

  return `请求失败 (${status})`
}

/**
 * 获取业务错误消息
 * @param code 业务错误码
 * @param message 服务器返回的错误消息
 * @returns 友好的错误消息
 */
export function getBusinessErrorMessage(code: number, message?: string): string {
  // 优先使用映射表中的消息
  if (ERROR_MESSAGES[code]) {
    return ERROR_MESSAGES[code]
  }

  // 如果提供了消息，检查并清理技术术语
  if (message) {
    if (containsTechnicalTerms(message)) {
      // 包含技术术语，使用通用消息
      return '操作失败，请稍后重试'
    }
    // 不包含技术术语，直接使用
    return message
  }

  // 使用默认消息
  return '操作失败，请稍后重试'
}
