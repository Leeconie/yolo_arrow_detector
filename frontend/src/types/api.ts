/**
 * @fileoverview API类型定义
 * @module types/api
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 定义API请求和响应的类型，包括统一响应格式、错误类型、请求配置等
 */

/**
 * API响应统一格式
 * @template T 响应数据类型
 */
export interface ApiResponse<T = unknown> {
  /** 状态码，200表示成功 */
  code: number
  /** 消息描述 */
  message: string
  /** 数据内容 */
  data: T
  /** 时间戳（可选） */
  timestamp?: number
}

/**
 * API错误类型
 */
export interface ApiError {
  /** 错误码 */
  code: number
  /** 错误消息 */
  message: string
  /** 错误详情（可选） */
  details?: unknown
}

/**
 * 请求配置类型
 */
export interface RequestConfig {
  /** 请求超时时间（毫秒） */
  timeout?: number
  /** 是否显示加载提示 */
  showLoading?: boolean
  /** 是否显示错误提示 */
  showError?: boolean
  /** 请求重试次数（0表示不重试） */
  retryCount?: number
  /** 请求取消信号 */
  signal?: AbortSignal
  /** 是否跳过重试（用于某些特殊场景） */
  skipRetry?: boolean
  /** 是否跳过缓存（用于强制刷新） */
  skipCache?: boolean
  /** 请求优先级（1=高优先级，2=普通优先级） */
  priority?: number
}

/**
 * HTTP方法类型
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

/**
 * 错误码枚举
 */
export enum ErrorCode {
  /** 成功 */
  SUCCESS = 200,
  /** 未授权 */
  UNAUTHORIZED = 401,
  /** 无权限 */
  FORBIDDEN = 403,
  /** 资源不存在 */
  NOT_FOUND = 404,
  /** 服务器错误 */
  SERVER_ERROR = 500,
  /** 网络错误 */
  NETWORK_ERROR = 0,
  /** 请求超时 */
  TIMEOUT = 408,
}
