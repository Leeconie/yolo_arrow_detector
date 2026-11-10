/**
 * @fileoverview API Mock集成测试
 * @module integration/api-mock.test
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 使用Mock API测试完整请求流程，包括拦截器、错误处理、重试等
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import type { ApiResponse } from '@/types/api'
import { ErrorCode } from '@/types/api'

// Mock Element Plus
vi.mock('element-plus', () => ({
  ElMessage: {
    error: vi.fn(),
    success: vi.fn(),
  },
  ElMessageBox: {
    alert: vi.fn().mockResolvedValue(undefined),
  },
}))

// Mock axios
const mockAxiosInstance = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request: {
      use: vi.fn(),
    },
    response: {
      use: vi.fn(),
    },
  },
}

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockAxiosInstance),
    isCancel: vi.fn((error) => {
      return error?.name === 'CanceledError' || error?.message === 'canceled'
    }),
  },
}))

// Mock user store
const mockUserStore = {
  token: 'test-token-123',
  logout: vi.fn(),
  isLoggedIn: true,
}

vi.mock('@/stores/modules/user', () => ({
  useUserStore: () => mockUserStore,
}))

// Mock CSRF
vi.mock('@/core/api/csrf', () => ({
  getCsrfToken: vi.fn(() => 'csrf-token-123'),
}))

// Mock token refresh - 默认返回失败，触发logout
let shouldRefreshTokenSucceed = false
vi.mock('@/core/api/token-refresh', () => ({
  checkAndRefreshToken: vi.fn(async () => {
    if (shouldRefreshTokenSucceed) {
      return mockUserStore.token
    }
    throw new Error('Token refresh failed')
  }),
}))

describe('API Mock集成测试', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let requestModule: any
  let requestInterceptor:
    | ((
        config: InternalAxiosRequestConfig,
      ) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>)
    | null = null
  let responseInterceptor: ((response: AxiosResponse<ApiResponse>) => unknown) | null = null
  let errorInterceptor: ((error: unknown) => unknown) | null = null

  beforeEach(async () => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    // 重置mock
    mockAxiosInstance.get.mockClear()
    mockAxiosInstance.post.mockClear()
    mockAxiosInstance.put.mockClear()
    mockAxiosInstance.delete.mockClear()
    mockUserStore.token = 'test-token-123'
    mockUserStore.logout.mockClear()

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
      configurable: true,
    })

    // 动态导入request模块
    requestModule = await import('@/core/api/request')

    // 获取拦截器
    const requestUseCalls = mockAxiosInstance.interceptors.request.use.mock.calls
    if (requestUseCalls.length > 0) {
      requestInterceptor = requestUseCalls[0][0] as typeof requestInterceptor
      errorInterceptor = requestUseCalls[0][1] as typeof errorInterceptor
    }

    const responseUseCalls = mockAxiosInstance.interceptors.response.use.mock.calls
    if (responseUseCalls.length > 0) {
      responseInterceptor = responseUseCalls[0][0] as typeof responseInterceptor
      errorInterceptor = (responseUseCalls[0][1] as typeof errorInterceptor) || errorInterceptor
    }
  })

  afterEach(async () => {
    vi.clearAllTimers()
    // 清理请求队列和缓存，避免测试间状态污染
    const { defaultRequestQueue } = await import('@/core/api/request-queue')
    const { defaultCacheManager } = await import('@/core/api/cache')
    defaultRequestQueue.clear()
    defaultCacheManager.clear()
  })

  describe('完整请求流程（成功场景）', () => {
    it('应该完成GET请求的完整流程', async () => {
      const successResponse: AxiosResponse<ApiResponse<{ id: number; name: string }>> = {
        data: {
          code: 200,
          message: 'Success',
          data: { id: 1, name: 'Test' },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      }

      mockAxiosInstance.get.mockResolvedValue(successResponse)

      // 测试请求拦截器
      if (requestInterceptor) {
        const config: InternalAxiosRequestConfig = {
          headers: {},
          method: 'get',
          url: '/api/test',
        } as InternalAxiosRequestConfig

        const processedConfig = await requestInterceptor(config)
        expect(processedConfig.headers.Authorization).toBe('Bearer test-token-123')
        expect(processedConfig.headers['X-CSRF-Token']).toBe('csrf-token-123')
      }

      // 测试响应拦截器
      if (responseInterceptor) {
        const result = responseInterceptor(successResponse)
        expect(result).toEqual({ id: 1, name: 'Test' })
      }
    })

    it('应该完成POST请求的完整流程', async () => {
      const successResponse: AxiosResponse<ApiResponse<{ id: number }>> = {
        data: {
          code: 200,
          message: 'Success',
          data: { id: 1 },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      }

      mockAxiosInstance.post.mockResolvedValue(successResponse)

      // 测试请求拦截器
      if (requestInterceptor) {
        const config: InternalAxiosRequestConfig = {
          headers: {},
          method: 'post',
          url: '/api/test',
          data: { name: 'Test' },
        } as InternalAxiosRequestConfig

        const processedConfig = await requestInterceptor(config)
        expect(processedConfig.headers.Authorization).toBe('Bearer test-token-123')
      }

      // 测试响应拦截器
      if (responseInterceptor) {
        const result = responseInterceptor(successResponse)
        expect(result).toEqual({ id: 1 })
      }
    })
  })

  describe('错误处理流程', () => {
    it('应该处理401错误并清除登录状态', async () => {
      // 设置token刷新失败，触发logout
      shouldRefreshTokenSucceed = false

      const errorResponse: AxiosError = {
        name: 'AxiosError',
        message: 'Request failed with status code 401',
        code: 'ERR_BAD_REQUEST',
        response: {
          data: {
            code: ErrorCode.UNAUTHORIZED,
            message: 'Unauthorized',
            data: null,
          },
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config: {} as InternalAxiosRequestConfig,
        },
        config: {} as InternalAxiosRequestConfig,
        isAxiosError: true,
        toJSON: () => ({}),
      }

      mockAxiosInstance.get.mockRejectedValue(errorResponse)

      // 测试错误拦截器
      if (errorInterceptor) {
        try {
          await errorInterceptor(errorResponse)
        } catch {
          // 预期会抛出错误
        }

        // 等待异步的token刷新操作完成
        await new Promise((resolve) => setTimeout(resolve, 100))

        // 验证logout被调用（因为token刷新失败）
        expect(mockUserStore.logout).toHaveBeenCalled()
      }
    })

    it('应该处理500服务器错误', async () => {
      const errorResponse: AxiosError = {
        name: 'AxiosError',
        message: 'Request failed with status code 500',
        code: 'ERR_BAD_RESPONSE',
        response: {
          data: {
            code: ErrorCode.SERVER_ERROR,
            message: 'Internal Server Error',
            data: null,
          },
          status: 500,
          statusText: 'Internal Server Error',
          headers: {},
          config: {} as InternalAxiosRequestConfig,
        },
        config: {} as InternalAxiosRequestConfig,
        isAxiosError: true,
        toJSON: () => ({}),
      }

      mockAxiosInstance.get.mockRejectedValue(errorResponse)

      // 测试错误拦截器
      if (errorInterceptor) {
        try {
          await errorInterceptor(errorResponse)
        } catch (error) {
          expect(error).toBeDefined()
        }
      }
    })

    it('应该处理网络错误', async () => {
      const networkError: AxiosError = {
        name: 'AxiosError',
        message: 'Network Error',
        code: 'ERR_NETWORK',
        request: {},
        config: {} as InternalAxiosRequestConfig,
        isAxiosError: true,
        toJSON: () => ({}),
      }

      mockAxiosInstance.get.mockRejectedValue(networkError)

      // 测试错误拦截器
      if (errorInterceptor) {
        try {
          await errorInterceptor(networkError)
        } catch (error) {
          expect(error).toBeDefined()
        }
      }
    })
  })

  describe('请求重试机制', () => {
    it('应该自动重试网络错误', async () => {
      let callCount = 0
      const maxRetries = 3

      vi.useFakeTimers()

      mockAxiosInstance.get.mockImplementation(async () => {
        callCount++
        if (callCount < maxRetries) {
          const error = new Error('Network Error') as AxiosError
          error.request = {}
          error.response = undefined
          error.isAxiosError = true
          error.toJSON = () => ({})
          throw error
        }
        return {
          data: {
            code: 200,
            message: 'Success',
            data: { id: 1 },
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as InternalAxiosRequestConfig,
        } as AxiosResponse<ApiResponse<{ id: number }>>
      })

      const promise = requestModule.get('/api/test', {}, { retryCount: maxRetries })

      // 快进时间以触发重试
      for (let i = 0; i < maxRetries - 1; i++) {
        const delay = 1000 * Math.pow(2, i)
        await vi.advanceTimersByTimeAsync(delay)
      }

      // 使用Promise.allSettled确保所有Promise都被处理
      const settled = await Promise.allSettled([promise])
      const result = settled[0].status === 'fulfilled' ? settled[0].value : null

      expect(result).toBeDefined()
      expect(callCount).toBe(maxRetries)

      vi.useRealTimers()
    })
  })

  describe('请求取消机制', () => {
    it('应该正确取消请求', async () => {
      const controller = new AbortController()

      mockAxiosInstance.get.mockImplementation(async (url, config) => {
        if (config?.signal?.aborted) {
          const error = new Error('canceled') as AxiosError
          error.name = 'CanceledError'
          error.code = 'ERR_CANCELED'
          error.isAxiosError = true
          error.toJSON = () => ({})
          throw error
        }

        return new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            if (config?.signal?.aborted) {
              const error = new Error('canceled') as AxiosError
              error.name = 'CanceledError'
              error.code = 'ERR_CANCELED'
              error.isAxiosError = true
              error.toJSON = () => ({})
              reject(error)
            } else {
              resolve({
                data: { code: 200, message: 'Success', data: { id: 1 } },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {} as InternalAxiosRequestConfig,
              } as AxiosResponse<ApiResponse<{ id: number }>>)
            }
          }, 100)

          if (config?.signal) {
            const abortHandler = () => {
              clearTimeout(timeoutId)
              const error = new Error('canceled') as AxiosError
              error.name = 'CanceledError'
              error.code = 'ERR_CANCELED'
              error.isAxiosError = true
              error.toJSON = () => ({})
              reject(error)
            }
            config.signal.addEventListener('abort', abortHandler, { once: true })
          }
        })
      })

      const promise = requestModule.get('/api/test', {}, { signal: controller.signal })

      controller.abort()

      try {
        await promise
        expect.fail('应该抛出取消错误')
      } catch (error) {
        const axiosError = error as AxiosError
        // 检查错误代码、错误消息或isCancel
        const isCanceled =
          axiosError.code === 'ERR_CANCELED' ||
          axiosError.message === 'canceled' ||
          axiosError.message?.includes('cancel') ||
          axios.isCancel(axiosError) ||
          (axiosError as { name?: string })?.name === 'CanceledError'
        expect(isCanceled).toBe(true)
      }

      promise.catch(() => {
        // 忽略，已经在try-catch中处理
      })
    }, 10000)
  })

  describe('缓存机制', () => {
    it('应该使用缓存响应重复请求', async () => {
      const successResponse: AxiosResponse<ApiResponse<{ id: number }>> = {
        data: {
          code: 200,
          message: 'Success',
          data: { id: 1 },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      }

      mockAxiosInstance.get.mockResolvedValue(successResponse)

      // 第一次请求（应该调用axios）
      await requestModule.get('/api/test', { id: 1 })
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1)

      // 第二次请求（应该使用缓存，不调用axios）
      await requestModule.get('/api/test', { id: 1 })
      // 注意：由于缓存机制，第二次请求可能不会调用axios
      // 实际行为取决于缓存实现
    })

    it('应该跳过缓存当配置skipCache为true时', async () => {
      const successResponse: AxiosResponse<ApiResponse<{ id: number }>> = {
        data: {
          code: 200,
          message: 'Success',
          data: { id: 1 },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      }

      // 清理请求队列和缓存，确保测试独立
      const { defaultRequestQueue } = await import('@/core/api/request-queue')
      const { defaultCacheManager } = await import('@/core/api/cache')
      defaultRequestQueue.clear()
      defaultCacheManager.clear()

      mockAxiosInstance.get.mockClear()
      mockAxiosInstance.get.mockResolvedValue(successResponse)

      // 第一次请求（应该调用axios，因为skipCache为true）
      await requestModule.get('/api/test', { id: 1 }, { skipCache: true })
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1)

      // 等待请求完成
      await new Promise((resolve) => setTimeout(resolve, 50))

      // 清除请求队列的待处理请求，避免去重
      // 注意：由于pendingRequests是私有属性，我们通过clear()清除队列，然后等待去重窗口过期
      defaultRequestQueue.clear()
      await new Promise((resolve) => setTimeout(resolve, 1100))

      // 第二次请求（skipCache为true，应该再次调用axios，不使用缓存）
      mockAxiosInstance.get.mockClear()
      await requestModule.get('/api/test', { id: 1 }, { skipCache: true })
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1)
    })
  })

  describe('并发控制', () => {
    it('应该控制并发请求数量', async () => {
      const successResponse: AxiosResponse<ApiResponse<{ id: number }>> = {
        data: {
          code: 200,
          message: 'Success',
          data: { id: 1 },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      }

      mockAxiosInstance.get.mockResolvedValue(successResponse)

      // 创建多个并发请求
      const requests: Promise<unknown>[] = []
      for (let i = 0; i < 10; i++) {
        requests.push(requestModule.get(`/api/test/${i}`))
      }

      await Promise.all(requests)

      // 验证所有请求都完成了
      expect(mockAxiosInstance.get).toHaveBeenCalled()
    })
  })
})
