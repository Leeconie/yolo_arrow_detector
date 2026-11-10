/**
 * @fileoverview API类型定义
 * @module core/api/types
 * @author HeZaoCha
 * @date 2026-01-10
 * @description API模块内部使用的类型定义
 */

import type { RequestConfig, HttpMethod } from '@/types/api'

/**
 * 请求配置扩展类型
 */
export interface ExtendedRequestConfig extends RequestConfig {
  /** 请求方法 */
  method?: HttpMethod
  /** 请求URL */
  url: string
  /** 请求参数 */
  params?: Record<string, unknown>
  /** 请求体数据 */
  data?: unknown
  /** 请求头 */
  headers?: Record<string, string>
}

/**
 * 请求拦截器配置类型
 */
export interface RequestInterceptorConfig {
  /** 是否添加token */
  addToken?: boolean
  /** 是否添加时间戳 */
  addTimestamp?: boolean
}

/**
 * 响应拦截器配置类型
 */
export interface ResponseInterceptorConfig {
  /** 是否自动处理错误 */
  autoHandleError?: boolean
  /** 是否自动格式化数据 */
  autoFormatData?: boolean
}
