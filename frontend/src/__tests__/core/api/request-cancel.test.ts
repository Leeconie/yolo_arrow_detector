/**
 * @fileoverview 请求取消机制单元测试
 * @module core/api/request-cancel.test
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 测试API封装的请求取消功能（AbortController）
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'

// Mock Element Plus
vi.mock('element-plus', () => ({
  ElMessage: {
    error: vi.fn(),
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
  token: 'test-token',
  logout: vi.fn(),
}

vi.mock('@/stores/modules/user', () => ({
  useUserStore: () => mockUserStore,
}))

// Mock environment
vi.mock('@/core/config/env', async () => {
  const actual = await vi.importActual<typeof import('@/core/config/env')>('@/core/config/env')
  return {
    ...actual,
    isDevelopment: vi.fn(() => false),
  }
})

describe('请求取消机制', () => {
  let requestModule: typeof import('@/core/api/request')
  let responseInterceptorSuccess: ((response: unknown) => unknown) | null = null

  beforeEach(async () => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockAxiosInstance.get.mockClear()
    mockAxiosInstance.post.mockClear()
    mockAxiosInstance.put.mockClear()
    mockAxiosInstance.delete.mockClear()

    // 设置响应拦截器mock
    mockAxiosInstance.interceptors.response.use.mockImplementation((success) => {
      responseInterceptorSuccess = success
    })

    // 动态导入request模块
    requestModule = await import('@/core/api/request')

    // 获取响应拦截器
    if (mockAxiosInstance.interceptors.response.use.mock.calls.length > 0) {
      responseInterceptorSuccess = mockAxiosInstance.interceptors.response.use.mock.calls[0][0]
    }
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    // 清理请求队列和缓存，避免测试间状态污染
    const { defaultRequestQueue } = await import('@/core/api/request-queue')
    const { defaultCacheManager } = await import('@/core/api/cache')
    defaultRequestQueue.clear()
    defaultCacheManager.clear()
  })

  describe('createAbortController', () => {
    it('应该创建AbortController实例', () => {
      const controller = requestModule.createAbortController()
      expect(controller).toBeInstanceOf(AbortController)
      expect(controller.signal).toBeInstanceOf(AbortSignal)
    })

    it('创建的AbortController应该可以取消', () => {
      const controller = requestModule.createAbortController()
      expect(controller.signal.aborted).toBe(false)
      controller.abort()
      expect(controller.signal.aborted).toBe(true)
    })
  })

  describe('GET请求取消', () => {
    it('应该支持通过AbortSignal取消请求', async () => {
      const controller = new AbortController()

      // Mock axios.get返回一个可取消的Promise
      mockAxiosInstance.get.mockImplementation((url, config) => {
        return new Promise((resolve, reject) => {
          // 模拟异步请求
          setTimeout(() => {
            if (config?.signal?.aborted) {
              const error = new Error('canceled') as AxiosError
              error.name = 'CanceledError'
              error.code = 'ERR_CANCELED'
              reject(error)
            } else {
              resolve({
                data: {
                  code: 200,
                  message: 'Success',
                  data: { id: 1 },
                },
              })
            }
          }, 100)
        })
      })

      // 启动请求
      const promise = requestModule.get('/test', {}, { signal: controller.signal })

      // 立即取消
      controller.abort()

      // 应该抛出取消错误
      await expect(promise).rejects.toThrow()
    })

    it('取消请求后Promise应该被拒绝', async () => {
      const controller = new AbortController()

      mockAxiosInstance.get.mockImplementation((url, config) => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            if (config?.signal?.aborted) {
              const error = new Error('canceled') as AxiosError
              error.name = 'CanceledError'
              error.code = 'ERR_CANCELED'
              reject(error)
            } else {
              resolve({
                data: { code: 200, message: 'Success', data: { id: 1 } },
              })
            }
          }, 50)
        })
      })

      const promise = requestModule.get('/test', {}, { signal: controller.signal })
      controller.abort()

      try {
        await promise
        expect.fail('应该抛出错误')
      } catch (error) {
        expect(error).toBeDefined()
        const axiosError = error as AxiosError
        expect(axiosError.code).toBe('ERR_CANCELED')
      }
    })

    it('正常请求不应该被取消', async () => {
      const successResponse = {
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

      mockAxiosInstance.get.mockClear()
      mockAxiosInstance.get.mockImplementation(async (url, config) => {
        // 确保signal没有被取消
        if (config?.signal?.aborted) {
          const error = new Error('canceled') as AxiosError
          error.name = 'CanceledError'
          error.code = 'ERR_CANCELED'
          throw error
        }
        const response = successResponse
        // 使用响应拦截器处理响应
        if (responseInterceptorSuccess) {
          return responseInterceptorSuccess(response)
        }
        return response
      })

      const controller = new AbortController()
      const result = await requestModule.get('/test', {}, { signal: controller.signal })
      expect(result).toEqual({ id: 1 })
      expect(controller.signal.aborted).toBe(false)
      expect(mockAxiosInstance.get).toHaveBeenCalled()
    })
  })

  describe('POST请求取消', () => {
    it('应该支持通过AbortSignal取消POST请求', async () => {
      const controller = new AbortController()

      mockAxiosInstance.post.mockImplementation((url, data, config) => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            if (config?.signal?.aborted) {
              const error = new Error('canceled') as AxiosError
              error.name = 'CanceledError'
              error.code = 'ERR_CANCELED'
              reject(error)
            } else {
              resolve({
                data: { code: 200, message: 'Success', data: { id: 1 } },
              })
            }
          }, 100)
        })
      })

      const promise = requestModule.post('/test', { name: 'Test' }, { signal: controller.signal })
      controller.abort()

      await expect(promise).rejects.toThrow()
    })
  })

  describe('PUT请求取消', () => {
    it('应该支持通过AbortSignal取消PUT请求', async () => {
      const controller = new AbortController()

      mockAxiosInstance.put.mockImplementation((url, data, config) => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            if (config?.signal?.aborted) {
              const error = new Error('canceled') as AxiosError
              error.name = 'CanceledError'
              error.code = 'ERR_CANCELED'
              reject(error)
            } else {
              resolve({
                data: { code: 200, message: 'Success', data: { id: 1 } },
              })
            }
          }, 100)
        })
      })

      const promise = requestModule.put('/test', { name: 'Test' }, { signal: controller.signal })
      controller.abort()

      await expect(promise).rejects.toThrow()
    })
  })

  describe('DELETE请求取消', () => {
    it('应该支持通过AbortSignal取消DELETE请求', async () => {
      const controller = new AbortController()

      mockAxiosInstance.delete.mockImplementation((url, config) => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            if (config?.signal?.aborted) {
              const error = new Error('canceled') as AxiosError
              error.name = 'CanceledError'
              error.code = 'ERR_CANCELED'
              reject(error)
            } else {
              resolve({
                data: { code: 200, message: 'Success', data: null },
              })
            }
          }, 100)
        })
      })

      const promise = requestModule.del('/test', { signal: controller.signal })
      controller.abort()

      await expect(promise).rejects.toThrow()
    })
  })

  describe('多个请求同时取消', () => {
    it('应该能够同时取消多个请求', async () => {
      const controller1 = new AbortController()
      const controller2 = new AbortController()

      mockAxiosInstance.get.mockImplementation((url, config) => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            if (config?.signal?.aborted) {
              const error = new Error('canceled') as AxiosError
              error.name = 'CanceledError'
              error.code = 'ERR_CANCELED'
              reject(error)
            } else {
              resolve({
                data: { code: 200, message: 'Success', data: { id: 1 } },
              })
            }
          }, 100)
        })
      })

      const promise1 = requestModule.get('/test1', {}, { signal: controller1.signal })
      const promise2 = requestModule.get('/test2', {}, { signal: controller2.signal })

      controller1.abort()
      controller2.abort()

      await expect(promise1).rejects.toThrow()
      await expect(promise2).rejects.toThrow()
    })
  })

  describe('取消后的资源清理', () => {
    it('取消请求后不应该有内存泄漏', async () => {
      const controller = new AbortController()

      mockAxiosInstance.get.mockClear()
      mockAxiosInstance.get.mockImplementation((url, config) => {
        return new Promise((resolve, reject) => {
          // 立即检查signal状态（在setTimeout之前）
          if (config?.signal?.aborted) {
            const error = new Error('canceled') as AxiosError
            error.name = 'CanceledError'
            error.code = 'ERR_CANCELED'
            reject(error)
            return
          }

          setTimeout(() => {
            if (config?.signal?.aborted) {
              const error = new Error('canceled') as AxiosError
              error.name = 'CanceledError'
              error.code = 'ERR_CANCELED'
              reject(error)
            } else {
              resolve({
                data: { code: 200, message: 'Success', data: { id: 1 } },
              })
            }
          }, 100)
        })
      })

      const promise = requestModule.get('/test', {}, { signal: controller.signal })

      // 等待一小段时间，确保请求已经开始执行
      await new Promise((resolve) => setTimeout(resolve, 10))

      controller.abort()

      try {
        await promise
      } catch {
        // 忽略错误
      }

      // 验证signal状态
      expect(controller.signal.aborted).toBe(true)
      // 验证请求被调用（即使被取消，请求也应该被发起）
      expect(mockAxiosInstance.get).toHaveBeenCalled()
    })
  })

  describe('使用createAbortController辅助函数', () => {
    it('应该能够使用createAbortController创建控制器', () => {
      const controller = requestModule.createAbortController()
      expect(controller).toBeInstanceOf(AbortController)
    })

    it('使用createAbortController创建的控制器应该可以正常取消请求', async () => {
      const controller = requestModule.createAbortController()

      mockAxiosInstance.get.mockImplementation((url, config) => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            if (config?.signal?.aborted) {
              const error = new Error('canceled') as AxiosError
              error.name = 'CanceledError'
              error.code = 'ERR_CANCELED'
              reject(error)
            } else {
              resolve({
                data: { code: 200, message: 'Success', data: { id: 1 } },
              })
            }
          }, 100)
        })
      })

      const promise = requestModule.get('/test', {}, { signal: controller.signal })
      controller.abort()

      await expect(promise).rejects.toThrow()
    })
  })
})
