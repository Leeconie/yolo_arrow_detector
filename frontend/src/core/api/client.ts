/**
 * @fileoverview API客户端统一管理
 * @module core/api/client
 * @author HeZaoCha
 * @date 2026-01-11
 * @description 统一的API客户端，处理请求拦截、响应处理、错误处理等
 * @dependencies axios, vue, element-plus
 */

import axios, { AxiosError } from 'axios'
import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'
import { ElMessage } from 'element-plus'
import { logger } from '../logger'
import { getStorage, removeStorage } from '@/utils/storage'
import { useRouter } from 'vue-router'

export interface ApiConfig {
  baseURL: string
  timeout?: number
  retries?: number
  retryDelay?: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  timestamp?: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface PaginatedResponse<T = any> extends Omit<ApiResponse<T>, 'data'> {
  data: {
    list: T[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

/**
 * API客户端类
 * 提供统一的API调用接口和错误处理
 */
export class ApiClient {
  private instance: AxiosInstance
  private config: ApiConfig
  private router = useRouter()

  constructor(config: ApiConfig) {
    this.config = {
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      ...config,
    }

    this.instance = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  /**
   * 设置请求和响应拦截器
   */
  private setupInterceptors(): void {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // 添加认证头
        const token = getStorage<string>('auth_token')
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`
        }

        // 添加请求ID用于追踪
        if (config.headers) {
          config.headers['X-Request-ID'] = this.generateRequestId()
        }

        // 记录请求日志
        logger.debug('API请求发起', {
          context: { module: 'api.client', function: 'request' },
          data: {
            method: config.method?.toUpperCase(),
            url: config.url,
            headers: config.headers,
          },
        })

        return config
      },
      (error: AxiosError) => {
        logger.error('请求拦截器错误', {
          context: { module: 'api.client', function: 'request' },
          error: error instanceof Error ? error : new Error(String(error)),
        })
        return Promise.reject(error)
      },
    )

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        const { data, status } = response

        // 记录响应日志
        logger.debug('API响应成功', {
          context: { module: 'api.client', function: 'response' },
          data: {
            status,
            url: response.config.url,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            duration: Date.now() - (response.config as any).startTime,
          },
        })

        // 统一处理业务错误
        if (data && typeof data.code === 'number' && data.code !== 200) {
          return this.handleBusinessError(data, response)
        }

        return response
      },
      (error: AxiosError) => {
        return this.handleHttpError(error)
      },
    )
  }

  /**
   * 处理业务错误
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleBusinessError(data: any, response: AxiosResponse): Promise<any> {
    const { code, message } = data

    logger.warn('业务错误', {
      context: { module: 'api.client', function: 'businessError' },
      data: { code, message, url: response.config.url },
    })

    // 根据错误码处理不同情况
    switch (code) {
      case 401:
        // 未授权，清除token并跳转登录
        removeStorage('auth_token')
        ElMessage.warning('登录已过期，请重新登录')
        this.router.push('/login')
        break
      case 403:
        ElMessage.error('权限不足')
        break
      case 404:
        ElMessage.error('请求的资源不存在')
        break
      case 429:
        ElMessage.warning('请求过于频繁，请稍后再试')
        break
      case 500:
        ElMessage.error('服务器内部错误')
        break
      default:
        ElMessage.error(message || '操作失败')
    }

    return Promise.reject(new Error(message || '业务错误'))
  }

  /**
   * 处理HTTP错误
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async handleHttpError(error: AxiosError): Promise<any> {
    const { response, config } = error

    logger.error('HTTP错误', {
      context: { module: 'api.client', function: 'httpError' },
      error: error instanceof Error ? error : new Error(String(error)),
      data: {
        status: response?.status,
        url: config?.url,
        method: config?.method,
      },
    })

    if (!response) {
      // 网络错误
      ElMessage.error('网络连接失败，请检查网络设置')
      return Promise.reject(error)
    }

    const { status } = response

    switch (status) {
      case 401:
        removeStorage('auth_token')
        ElMessage.warning('登录已过期，请重新登录')
        this.router.push('/login')
        break
      case 403:
        ElMessage.error('权限不足')
        break
      case 404:
        ElMessage.error('请求的资源不存在')
        break
      case 408:
        ElMessage.error('请求超时，请重试')
        break
      case 429:
        ElMessage.warning('请求过于频繁，请稍后再试')
        break
      case 500:
        ElMessage.error('服务器内部错误')
        break
      case 502:
      case 503:
      case 504:
        ElMessage.error('服务器暂时不可用，请稍后重试')
        break
      default:
        ElMessage.error(`请求失败 (${status})`)
    }

    return Promise.reject(error)
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * GET请求
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.get(url, config)
    return response.data
  }

  /**
   * POST请求
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async post<T = any>(
    url: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const response = await this.instance.post(url, data, config)
    return response.data
  }

  /**
   * PUT请求
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async put<T = any>(
    url: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const response = await this.instance.put(url, data, config)
    return response.data
  }

  /**
   * DELETE请求
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.delete(url, config)
    return response.data
  }

  /**
   * PATCH请求
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async patch<T = any>(
    url: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const response = await this.instance.patch(url, data, config)
    return response.data
  }

  /**
   * 文件上传
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async upload<T = any>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void,
  ): Promise<ApiResponse<T>> {
    const formData = new FormData()
    formData.append('file', file)

    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }

    if (onProgress) {
      config.onUploadProgress = (progressEvent) => {
        if (progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      }
    }

    const response = await this.instance.post(url, formData, config)
    return response.data
  }

  /**
   * 分片上传
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async uploadChunk<T = any>(
    url: string,
    chunk: Blob,
    chunkIndex: number,
    totalChunks: number,
    fileId: string,
    onProgress?: (progress: number) => void,
  ): Promise<ApiResponse<T>> {
    const formData = new FormData()
    formData.append('chunk', chunk)
    formData.append('chunkIndex', chunkIndex.toString())
    formData.append('totalChunks', totalChunks.toString())
    formData.append('fileId', fileId)

    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }

    if (onProgress) {
      config.onUploadProgress = (progressEvent) => {
        if (progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      }
    }

    const response = await this.instance.post(url, formData, config)
    return response.data
  }

  /**
   * 获取原始Axios实例（用于特殊需求）
   */
  getAxiosInstance(): AxiosInstance {
    return this.instance
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<ApiConfig>): void {
    this.config = { ...this.config, ...config }
    this.instance.defaults.baseURL = this.config.baseURL
    this.instance.defaults.timeout = this.config.timeout
  }
}

/**
 * 默认API客户端实例
 */
export const apiClient = new ApiClient({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
})

/**
 * Mock API客户端（用于开发测试）
 */
export const mockApiClient = new ApiClient({
  baseURL: 'http://localhost:3001/api/v1',
})

// 导出类型
export type { AxiosRequestConfig, AxiosResponse, AxiosError }
