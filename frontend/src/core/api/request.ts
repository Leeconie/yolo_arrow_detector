/**
 * @fileoverview HTTP请求封装
 * @module core/api/request
 * @author HeZaoCha
 * @date 2026-01-08
 * @description 基于Axios封装统一的HTTP请求方法，提供请求拦截、响应拦截、错误处理、请求取消、请求重试等能力
 * @dependencies axios, element-plus, @/stores/modules/user, @/types/api, @/core/config/constants
 */

import { API_CONSTANTS, APIFOX_CONFIG, SECURITY_CONSTANTS } from '@/core/config/constants'
import { logger } from '@/core/logger'
import { useUserStore } from '@/stores/modules/user'
import type { ApiResponse, RequestConfig } from '@/types/api'
import { ErrorCode } from '@/types/api'
import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { defaultCacheManager } from './cache'
import {
  getBusinessErrorMessage,
  getHttpErrorMessage,
  getNetworkErrorMessage,
  getNetworkErrorType,
} from './error-messages'
import { defaultPerformanceMonitor } from './performance-monitor'
import { defaultRequestQueue, RequestPriority } from './request-queue'
import { csrfTokenCache, tokenCache } from './token-cache'
import { checkAndRefreshToken } from './token-refresh'

/**
 * 扩展的Axios请求配置接口
 */
interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  /** 跳过缓存标志 */
  skipCache?: boolean
  /** 请求ID（用于性能监控） */
  __requestId?: string
  /** 请求优先级 */
  priority?: RequestPriority
}

/**
 * 创建axios实例
 * @description 配置基础URL、超时时间、请求头等
 * 如果启用Mock服务，使用API FOX Mock服务地址
 */
/**
 * 获取API基础URL
 * @description 根据环境配置返回正确的API基础URL
 * - 开发/测试环境：如果启用Mock，使用相对路径通过Vite代理转发（解决CORS问题）
 * - 生产环境或禁用Mock：使用实际API地址
 */
function getBaseURL(): string {
  // 开发/测试环境：如果启用Mock，使用相对路径通过Vite代理转发
  // 这样可以避免CORS问题，因为请求会通过Vite代理转发到Mock服务
  if (APIFOX_CONFIG.ENABLE_MOCK && (import.meta.env.DEV || import.meta.env.MODE === 'test')) {
    return '/api' // 使用相对路径，通过Vite代理转发到Mock服务
  }
  // 生产环境或禁用Mock：使用实际API地址
  return import.meta.env.VITE_API_BASE_URL || '/api'
}

const service: AxiosInstance = axios.create({
  baseURL: getBaseURL(),
  timeout: API_CONSTANTS.TIMEOUT,
  headers: {
    'Content-Type': 'application/json;charset=UTF-8',
    // 安全请求头配置
    'X-Requested-With': 'XMLHttpRequest', // 标识AJAX请求
  },
  // 请求凭证配置（如果需要发送Cookie）
  withCredentials: false, // 默认不发送Cookie，根据实际需求配置
})

/**
 * 计算指数退避延迟时间
 * @param retryCount 当前重试次数（从0开始）
 * @returns 延迟时间（毫秒）
 * @description 使用指数退避算法：delay = min(base * 2^retryCount, maxDelay)
 */
function calculateRetryDelay(retryCount: number): number {
  const delay = API_CONSTANTS.RETRY_DELAY_BASE * Math.pow(2, retryCount)
  return Math.min(delay, API_CONSTANTS.RETRY_MAX_DELAY)
}

/**
 * 判断错误是否应该重试
 * @param error 错误对象
 * @returns 是否应该重试
 * @description 网络错误、超时错误、5xx服务器错误应该重试
 */
function shouldRetry(error: unknown): boolean {
  const axiosError = error as AxiosError
  // 如果请求被取消，不重试
  if (axios.isCancel(error)) {
    return false
  }
  // 如果请求被AbortSignal取消，不重试
  if (axiosError.code === 'ERR_CANCELED' || axiosError.message === 'canceled') {
    return false
  }
  // 网络错误（无响应）应该重试
  if (!axiosError.response) {
    return true
  }
  // 5xx服务器错误应该重试
  const status = axiosError.response.status
  if (status >= 500 && status < 600) {
    return true
  }
  // 408请求超时应该重试
  if (status === ErrorCode.TIMEOUT) {
    return true
  }
  return false
}

/**
 * 请求拦截器
 * @description 在请求发送前添加token、设置请求头、添加API FOX Mock Token等
 * 性能优化：使用Token缓存、CSRF Token缓存，减少重复获取
 */
service.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const interceptorStartTime = performance.now()

    // 性能监控：开始请求计时
    const requestId = `${Date.now()}-${Math.random()}`
    defaultPerformanceMonitor.startRequest(requestId, config.url, config.method)

    // 记录请求日志
    logger.debug('发起HTTP请求', {
      context: {
        module: 'api',
        function: 'request.interceptor',
        requestId,
      },
      data: {
        method: config.method,
        url: config.url,
        baseURL: config.baseURL,
        hasData: !!config.data,
        hasParams: !!config.params,
      },
    })

    // 处理FormData：如果是FormData，删除默认的Content-Type，让浏览器自动设置multipart/form-data
    // 这是关键：FormData需要浏览器自动设置Content-Type和boundary，不能手动设置
    if (config.data instanceof FormData) {
      // 删除默认的Content-Type，让axios自动设置multipart/form-data
      delete config.headers['Content-Type']
    }

    // 从Token缓存获取token（性能优化：减少重复获取）
    const token = await tokenCache.getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 如果启用Mock服务且使用云端Mock且启用Token鉴权，添加API FOX Token到请求头
    // 根据 Apifox 云端 Mock 文档：https://docs.apifox.com/cloud-mock
    // Token鉴权仅适用于云端Mock，本地Mock不需要Token
    // Token鉴权可以通过项目设置开启/关闭，通过环境变量 VITE_ENABLE_MOCK_TOKEN_AUTH 控制
    // 当关闭Token鉴权时（默认），不需要在请求中添加 apifoxToken
    // 当开启Token鉴权时，需要在请求头中添加 apifoxToken
    if (
      APIFOX_CONFIG.ENABLE_MOCK &&
      APIFOX_CONFIG.MOCK_TYPE === 'cloud' &&
      APIFOX_CONFIG.ENABLE_MOCK_TOKEN_AUTH &&
      APIFOX_CONFIG.MOCK_TOKEN
    ) {
      config.headers.apifoxToken = APIFOX_CONFIG.MOCK_TOKEN
    }

    // 添加CSRF Token（性能优化：使用缓存，减少重复生成）
    if (SECURITY_CONSTANTS.ENABLE_CSRF) {
      const csrfToken = csrfTokenCache.getToken()
      if (csrfToken) {
        // 优先使用自定义Header
        config.headers[SECURITY_CONSTANTS.CSRF_TOKEN_HEADER] = csrfToken
        // 同时设置备用Header（某些框架使用X-XSRF-TOKEN）
        config.headers[SECURITY_CONSTANTS.CSRF_TOKEN_HEADER_ALT] = csrfToken
      }
    }

    // 添加时间戳，防止缓存（仅对需要防缓存的GET请求添加，性能优化：条件判断）
    // 如果请求配置了skipCache，则不添加时间戳（允许缓存）
    const extendedConfig = config as ExtendedAxiosRequestConfig
    if ((config.method === 'get' || config.method === 'GET') && !extendedConfig.skipCache) {
      config.params = {
        ...config.params,
        _t: Date.now(),
      }
    }

    // 性能监控：记录拦截器耗时
    const interceptorTime = performance.now() - interceptorStartTime
    defaultPerformanceMonitor.recordInterceptorTime(requestId, interceptorTime)

    // 将requestId存储到config中，供响应拦截器使用
    extendedConfig.__requestId = requestId

    return config
  },
  (error: unknown) => {
    // 记录请求拦截器错误
    logger.error('请求拦截器错误', {
      context: {
        module: 'api',
        function: 'request.interceptor',
      },
      error: error instanceof Error ? error : new Error(String(error)),
      data: error,
    })
    return Promise.reject(error)
  },
)

/**
 * 响应拦截器
 * @description 统一处理响应数据、错误处理等
 * 性能优化：集成缓存、性能监控
 */
service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<unknown>>) => {
    const responseStartTime = performance.now()
    const responseConfig = response.config as ExtendedAxiosRequestConfig
    const requestId = responseConfig.__requestId

    const res = response.data

    // 如果响应码不是200，视为错误
    if (res.code !== 200) {
      // 性能监控：记录失败请求
      if (requestId) {
        defaultPerformanceMonitor.endRequest(requestId, false)
      }

      // 获取友好的错误消息
      const errorMessage = getBusinessErrorMessage(res.code, res.message)

      // 记录业务错误日志
      logger.warn('API业务错误', {
        context: {
          module: 'api',
          function: 'response.interceptor',
          requestId,
        },
        data: {
          code: res.code,
          message: res.message,
          url: response.config.url,
          method: response.config.method,
        },
      })

      // 显示错误消息
      ElMessage.error(errorMessage)

      // 特殊错误码处理
      if (res.code === ErrorCode.UNAUTHORIZED) {
        // 401未授权，清除Token缓存并尝试刷新Token
        tokenCache.clear()
        const userStore = useUserStore()
        if (userStore.token) {
          // 尝试刷新Token（异步处理）
          import('./token-refresh')
            .then(({ refreshToken }) => refreshToken())
            .catch(() => {
              // 刷新失败，立即清除Token并跳转登录（不使用setTimeout，避免安全问题）
              userStore.logout()
              // 使用window.location.href立即跳转，确保用户无法继续操作
              window.location.href = '/login'
            })
        } else {
          // 没有Token，立即跳转登录
          userStore.logout()
          // 使用window.location.href立即跳转，确保用户无法继续操作
          window.location.href = '/login'
        }
      } else if (res.code === ErrorCode.FORBIDDEN) {
        // 403无权限，提示用户
        ElMessageBox.alert(errorMessage, '权限不足', {
          type: 'warning',
        })
      }

      return Promise.reject(new Error(errorMessage))
    }

    // 记录成功响应日志
    const responseTime = performance.now() - responseStartTime
    logger.debug('API请求成功', {
      context: {
        module: 'api',
        function: 'response.interceptor',
        requestId,
      },
      data: {
        url: response.config.url,
        method: response.config.method,
        status: response.status,
        responseTime: `${responseTime.toFixed(2)}ms`,
      },
    })

    // 性能监控：记录响应处理耗时
    if (requestId) {
      defaultPerformanceMonitor.recordResponseTime(requestId, responseTime)
      defaultPerformanceMonitor.endRequest(requestId, true)
    }

    // 返回数据部分 - 拦截器会将其转换为 Promise<T>
    return res.data as unknown as AxiosResponse<unknown>
  },
  async (error: unknown) => {
    // 记录响应拦截器错误
    logger.error('响应拦截器错误', {
      context: {
        module: 'api',
        function: 'response.interceptor',
      },
      error: error instanceof Error ? error : new Error(String(error)),
      data: error,
    })

    // 性能监控：记录失败请求
    const axiosError = error as AxiosError<{ message?: string }>
    const errorConfig = axiosError.config as ExtendedAxiosRequestConfig | undefined
    const requestId = errorConfig?.__requestId
    if (requestId) {
      defaultPerformanceMonitor.endRequest(requestId, false)
    }

    let message = '请求失败'

    // 复用UserStore实例，避免重复获取
    const userStore = useUserStore()

    if (axiosError.response) {
      // 服务器返回了错误响应
      const { status, data } = axiosError.response

      // 记录HTTP错误日志
      logger.warn('API请求HTTP错误', {
        context: {
          module: 'api',
          function: 'response.errorHandler',
          requestId,
        },
        data: {
          status,
          statusText: axiosError.response.statusText,
          url: axiosError.config?.url,
          method: axiosError.config?.method,
          message: data?.message,
          errorCode: (data as { ErrorCode?: string })?.ErrorCode,
          errorMessage: (data as { ErrorMessage?: string })?.ErrorMessage,
        },
      })

      // 特殊处理：EntityTooLarge错误（文件大小限制）
      // 使用用户友好的错误消息，不暴露技术细节
      if ((data as { ErrorCode?: string })?.ErrorCode === 'EntityTooLarge') {
        const { getUserFriendlyUploadError } = await import('./user-friendly-errors')
        // 尝试从请求配置中获取文件大小信息（如果可用）
        const requestData = axiosError.config?.data
        let fileSize: number | undefined
        if (requestData instanceof FormData) {
          // 尝试从FormData中获取文件大小
          const archerVideo = requestData.get('archerVideo') as File | null
          const targetVideo = requestData.get('targetVideo') as File | null
          const videoFile = requestData.get('file') as File | null
          if (archerVideo || targetVideo) {
            fileSize = (archerVideo?.size || 0) + (targetVideo?.size || 0)
          } else if (videoFile) {
            fileSize = videoFile.size
          }
        }
        // 使用512MB作为最大文件大小限制
        const maxSize = 512 * 1024 * 1024 // 512MB
        message = getUserFriendlyUploadError(axiosError, fileSize, maxSize)
      } else {
        // 获取友好的HTTP错误消息
        message = getHttpErrorMessage(status, data?.message)
      }

      // 特殊错误码处理
      if (status === ErrorCode.UNAUTHORIZED) {
        if (userStore.token) {
          // 尝试刷新Token（异步处理，不阻塞错误处理）
          // 使用已导入的checkAndRefreshToken函数（已在文件顶部导入）
          checkAndRefreshToken()
            .then(() => {
              // 刷新成功，Token已更新，可以继续使用
            })
            .catch(() => {
              // 刷新失败，立即清除Token并跳转登录（不使用setTimeout，避免安全问题）
              userStore.logout()
              // 使用window.location.href立即跳转，确保用户无法继续操作
              window.location.href = '/login'
            })
        } else {
          // 没有Token，立即跳转登录
          userStore.logout()
          window.location.href = '/login'
        }
      } else if (status === ErrorCode.FORBIDDEN) {
        ElMessageBox.alert(message, '权限不足', {
          type: 'warning',
        })
      }
    } else if (axiosError.request) {
      // 请求已发出但没有收到响应 - 网络错误
      const networkErrorType = getNetworkErrorType(axiosError)
      message = getNetworkErrorMessage(networkErrorType)

      // 记录网络错误日志
      logger.error('API请求网络错误', {
        context: {
          module: 'api',
          function: 'response.errorHandler',
          requestId,
        },
        error: axiosError instanceof Error ? axiosError : new Error(message),
        data: {
          networkErrorType,
          url: axiosError.config?.url,
          method: axiosError.config?.method,
          offline: !navigator.onLine,
        },
      })

      // 如果是网络断开，提供更详细的提示
      if (networkErrorType === 'offline' && !navigator.onLine) {
        message = '网络连接已断开，请检查网络设置后重试'
      }
    } else {
      // 请求配置错误
      message = axiosError.message || '请求配置错误，请检查请求参数'

      // 记录配置错误日志
      logger.error('API请求配置错误', {
        context: {
          module: 'api',
          function: 'response.errorHandler',
          requestId,
        },
        error: axiosError instanceof Error ? axiosError : new Error(message),
        data: {
          url: axiosError.config?.url,
          method: axiosError.config?.method,
        },
      })
    }

    ElMessage.error(message)
    return Promise.reject(error)
  },
)

/**
 * 执行带重试的请求
 * @template T 响应数据类型
 * @param requestFn 请求函数
 * @param config 请求配置
 * @param retryCount 当前重试次数（内部使用）
 * @returns Promise<T>
 * @description 实现指数退避重试机制
 */

async function executeWithRetry<T>(
  requestFn: () => Promise<T>,
  config?: RequestConfig,
  retryCount = 0,
): Promise<T> {
  try {
    return await requestFn()
  } catch (error) {
    // 如果配置了skipRetry，直接抛出错误
    if (config?.skipRetry) {
      throw error
    }

    // 如果请求被取消，直接抛出错误
    if (axios.isCancel(error) || (error as AxiosError).code === 'ERR_CANCELED') {
      throw error
    }

    // 获取重试次数（优先使用配置中的，否则使用默认值）
    const maxRetryCount = config?.retryCount ?? API_CONSTANTS.RETRY_COUNT

    // 判断是否应该重试
    if (retryCount < maxRetryCount && shouldRetry(error)) {
      // 计算延迟时间（指数退避）
      const delay = calculateRetryDelay(retryCount)

      // 记录重试日志
      logger.debug(`请求失败，${delay}ms后进行第${retryCount + 1}次重试`, {
        context: {
          module: 'api',
          function: 'executeWithRetry',
        },
        data: {
          retryCount: retryCount + 1,
          delay,
        },
      })

      // 等待延迟时间后重试
      await new Promise((resolve) => setTimeout(resolve, delay))

      // 递归重试
      return executeWithRetry(requestFn, config, retryCount + 1)
    }

    // 重试次数已用完或不应该重试，抛出错误
    throw error
  }
}

/**
 * GET请求
 * @template T 响应数据类型
 * @param url 请求URL
 * @param params 请求参数
 * @param config 请求配置（支持signal取消、retryCount重试、skipCache跳过缓存等）
 * @returns Promise<T>
 * @description 性能优化：支持请求缓存、并发控制、请求去重
 * @example
 * ```typescript
 * // 基础使用（自动缓存）
 * const userInfo = await request.get<UserInfo>('/api/user/info', { id: 1 })
 *
 * // 带取消功能
 * const controller = new AbortController()
 * const promise = request.get<UserInfo>('/api/user/info', { id: 1 }, { signal: controller.signal })
 * // 取消请求
 * controller.abort()
 *
 * // 带重试功能
 * const result = await request.get<UserInfo>('/api/user/info', { id: 1 }, { retryCount: 3 })
 *
 * // 跳过缓存
 * const result = await request.get<UserInfo>('/api/user/info', { id: 1 }, { skipCache: true })
 * ```
 */
export function get<T = unknown>(
  url: string,
  params?: Record<string, unknown>,
  config?: RequestConfig,
): Promise<T> {
  // 检查缓存（如果未配置skipCache）
  if (!config?.skipCache) {
    const cached = defaultCacheManager.get<T>('GET', url, params)
    if (cached !== null) {
      defaultPerformanceMonitor.recordCacheHit()
      return Promise.resolve(cached)
    }
    defaultPerformanceMonitor.recordCacheMiss()
  }

  const requestFn = () => {
    const networkStartTime = performance.now()
    return service
      .get<ApiResponse<T>>(url, {
        params,
        signal: config?.signal, // 支持AbortSignal取消请求
        timeout: config?.timeout,
        skipCache: config?.skipCache, // 传递给拦截器
        ...config,
      } as AxiosRequestConfig)
      .then((response) => {
        // 性能监控：记录网络请求耗时
        // 注意：响应拦截器可能返回res.data，而不是完整的AxiosResponse
        // 因此需要检查response.config是否存在
        const responseConfig = (response as { config?: ExtendedAxiosRequestConfig })?.config
        const requestId = responseConfig?.__requestId
        if (requestId) {
          const networkTime = performance.now() - networkStartTime
          defaultPerformanceMonitor.recordNetworkTime(requestId, networkTime)
        }

        const data = response as unknown as T

        // 存储到缓存（如果未配置skipCache）
        if (!config?.skipCache && params) {
          defaultCacheManager.set('GET', url, params, data)
        }

        return data
      })
  }

  // 使用请求队列执行请求（支持并发控制和去重）
  // 使用executeWithRetry包装requestFn以实现重试功能
  const priority = (config as ExtendedAxiosRequestConfig)?.priority ?? RequestPriority.NORMAL
  const wrappedRequestFn = () => executeWithRetry(requestFn, config)
  return defaultRequestQueue.execute(wrappedRequestFn, priority, 'GET', url, params)
}

/**
 * POST请求
 * @template T 响应数据类型
 * @param url 请求URL
 * @param data 请求体数据
 * @param config 请求配置（支持signal取消、retryCount重试、priority优先级等）
 * @returns Promise<T>
 * @description 性能优化：支持并发控制、请求去重
 * @example
 * ```typescript
 * // 基础使用
 * const result = await request.post<CreateResult>('/api/user', userData)
 *
 * // 带取消功能
 * const controller = new AbortController()
 * const promise = request.post<CreateResult>('/api/user', userData, { signal: controller.signal })
 * controller.abort()
 *
 * // 高优先级请求
 * const result = await request.post<CreateResult>('/api/user', userData, { priority: 1 })
 * ```
 */
export function post<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
  const requestFn = () => {
    const networkStartTime = performance.now()
    return service
      .post<ApiResponse<T>>(url, data, {
        signal: config?.signal, // 支持AbortSignal取消请求
        timeout: config?.timeout,
        ...config,
      } as AxiosRequestConfig)
      .then((response) => {
        // 性能监控：记录网络请求耗时
        // 注意：响应拦截器可能返回res.data，而不是完整的AxiosResponse
        // 因此需要检查response.config是否存在
        const responseConfig = (response as { config?: ExtendedAxiosRequestConfig })?.config
        const requestId = responseConfig?.__requestId
        if (requestId) {
          const networkTime = performance.now() - networkStartTime
          defaultPerformanceMonitor.recordNetworkTime(requestId, networkTime)
        }

        return response as unknown as T
      })
  }

  // 使用请求队列执行请求（支持并发控制和去重）
  // 使用executeWithRetry包装requestFn以实现重试功能
  const priority = (config as ExtendedAxiosRequestConfig)?.priority ?? RequestPriority.NORMAL
  const wrappedRequestFn = () => executeWithRetry(requestFn, config)
  return defaultRequestQueue.execute(
    wrappedRequestFn,
    priority,
    'POST',
    url,
    data as Record<string, unknown>,
  )
}

/**
 * PUT请求
 * @template T 响应数据类型
 * @param url 请求URL
 * @param data 请求体数据
 * @param config 请求配置（支持signal取消、retryCount重试、priority优先级等）
 * @returns Promise<T>
 * @description 性能优化：支持并发控制、请求去重
 * @example
 * ```typescript
 * const result = await request.put<UpdateResult>('/api/user/1', userData)
 * ```
 */
export function put<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
  const requestFn = () => {
    const networkStartTime = performance.now()
    return service
      .put<ApiResponse<T>>(url, data, {
        signal: config?.signal, // 支持AbortSignal取消请求
        timeout: config?.timeout,
        ...config,
      } as AxiosRequestConfig)
      .then((response) => {
        // 性能监控：记录网络请求耗时
        // 注意：响应拦截器可能返回res.data，而不是完整的AxiosResponse
        // 因此需要检查response.config是否存在
        const responseConfig = (response as { config?: ExtendedAxiosRequestConfig })?.config
        const requestId = responseConfig?.__requestId
        if (requestId) {
          const networkTime = performance.now() - networkStartTime
          defaultPerformanceMonitor.recordNetworkTime(requestId, networkTime)
        }

        // 响应拦截器返回的是res.data，所以response实际上是数据本身
        return response as unknown as T
      })
  }

  // 使用请求队列执行请求（支持并发控制和去重）
  // 使用executeWithRetry包装requestFn以实现重试功能
  const priority = (config as ExtendedAxiosRequestConfig)?.priority ?? RequestPriority.NORMAL
  const wrappedRequestFn = () => executeWithRetry(requestFn, config)
  return defaultRequestQueue.execute(
    wrappedRequestFn,
    priority,
    'PUT',
    url,
    data as Record<string, unknown>,
  )
}

/**
 * DELETE请求
 * @template T 响应数据类型
 * @param url 请求URL
 * @param config 请求配置（支持signal取消、retryCount重试、priority优先级等）
 * @returns Promise<T>
 * @description 性能优化：支持并发控制、请求去重
 * @example
 * ```typescript
 * await request.delete('/api/user/1')
 * ```
 */
export function del<T = unknown>(url: string, config?: RequestConfig): Promise<T> {
  const requestFn = () => {
    const networkStartTime = performance.now()
    return service
      .delete<ApiResponse<T>>(url, {
        signal: config?.signal, // 支持AbortSignal取消请求
        timeout: config?.timeout,
        ...config,
      } as AxiosRequestConfig)
      .then((response) => {
        // 性能监控：记录网络请求耗时
        // 注意：响应拦截器可能返回res.data，而不是完整的AxiosResponse
        // 因此需要检查response.config是否存在
        const responseConfig = (response as { config?: ExtendedAxiosRequestConfig })?.config
        const requestId = responseConfig?.__requestId
        if (requestId) {
          const networkTime = performance.now() - networkStartTime
          defaultPerformanceMonitor.recordNetworkTime(requestId, networkTime)
        }

        // 响应拦截器返回的是res.data，所以response实际上是数据本身
        return response as unknown as T
      })
  }

  // 使用请求队列执行请求（支持并发控制和去重）
  // 使用executeWithRetry包装requestFn以实现重试功能
  const priority = (config as ExtendedAxiosRequestConfig)?.priority ?? RequestPriority.NORMAL
  const wrappedRequestFn = () => executeWithRetry(requestFn, config)
  return defaultRequestQueue.execute(wrappedRequestFn, priority, 'DELETE', url)
}

/**
 * 创建AbortController的辅助函数
 * @returns AbortController实例
 * @description 用于创建请求取消控制器
 * @example
 * ```typescript
 * const controller = createAbortController()
 * const promise = request.get('/api/data', {}, { signal: controller.signal })
 * // 取消请求
 * controller.abort()
 * ```
 */
export function createAbortController(): AbortController {
  return new AbortController()
}

/**
 * 请求对象，包含所有HTTP方法
 */
const request = {
  get,
  post,
  put,
  delete: del,
  /** 创建AbortController的辅助函数 */
  createAbortController,
}

export default request
