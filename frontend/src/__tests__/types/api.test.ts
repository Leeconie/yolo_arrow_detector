/**
 * @fileoverview API类型定义单元测试
 * @module types/api.test
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 测试API类型定义的正确性和类型导出
 */

import { describe, it, expect } from 'vitest'
import type { ApiResponse, ApiError, RequestConfig, HttpMethod } from '@/types/api'
import { ErrorCode } from '@/types/api'

describe('API类型定义', () => {
  describe('ApiResponse接口', () => {
    it('应该正确定义ApiResponse接口', () => {
      // 测试基本结构
      const response: ApiResponse<string> = {
        code: 200,
        message: 'Success',
        data: 'test',
      }
      expect(response.code).toBe(200)
      expect(response.message).toBe('Success')
      expect(response.data).toBe('test')
    })

    it('应该支持泛型类型', () => {
      interface UserData {
        id: number
        name: string
      }
      const response: ApiResponse<UserData> = {
        code: 200,
        message: 'Success',
        data: { id: 1, name: 'Test' },
      }
      expect(response.data.id).toBe(1)
      expect(response.data.name).toBe('Test')
    })

    it('应该支持可选timestamp字段', () => {
      const responseWithTimestamp: ApiResponse = {
        code: 200,
        message: 'Success',
        data: null,
        timestamp: Date.now(),
      }
      expect(responseWithTimestamp.timestamp).toBeTypeOf('number')

      const responseWithoutTimestamp: ApiResponse = {
        code: 200,
        message: 'Success',
        data: null,
      }
      expect(responseWithoutTimestamp.timestamp).toBeUndefined()
    })
  })

  describe('ApiError接口', () => {
    it('应该正确定义ApiError接口', () => {
      const error: ApiError = {
        code: 400,
        message: 'Bad Request',
      }
      expect(error.code).toBe(400)
      expect(error.message).toBe('Bad Request')
    })

    it('应该支持可选details字段', () => {
      const errorWithDetails: ApiError = {
        code: 500,
        message: 'Server Error',
        details: { stack: 'Error stack trace' },
      }
      expect(errorWithDetails.details).toBeDefined()

      const errorWithoutDetails: ApiError = {
        code: 404,
        message: 'Not Found',
      }
      expect(errorWithoutDetails.details).toBeUndefined()
    })
  })

  describe('RequestConfig接口', () => {
    it('应该正确定义RequestConfig接口', () => {
      const config: RequestConfig = {
        timeout: 5000,
        showLoading: true,
        showError: true,
      }
      expect(config.timeout).toBe(5000)
      expect(config.showLoading).toBe(true)
      expect(config.showError).toBe(true)
    })

    it('应该支持所有可选字段', () => {
      const fullConfig: RequestConfig = {
        timeout: 10000,
        showLoading: false,
        showError: false,
        retryCount: 3,
        skipRetry: false,
        skipCache: true,
        priority: 1,
      }
      expect(fullConfig.retryCount).toBe(3)
      expect(fullConfig.skipCache).toBe(true)
      expect(fullConfig.priority).toBe(1)
    })

    it('应该支持AbortSignal', () => {
      const controller = new AbortController()
      const config: RequestConfig = {
        signal: controller.signal,
      }
      expect(config.signal).toBe(controller.signal)
    })
  })

  describe('HttpMethod类型', () => {
    it('应该支持所有HTTP方法', () => {
      const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
      expect(methods).toHaveLength(5)
      expect(methods).toContain('GET')
      expect(methods).toContain('POST')
      expect(methods).toContain('PUT')
      expect(methods).toContain('DELETE')
      expect(methods).toContain('PATCH')
    })
  })

  describe('ErrorCode枚举', () => {
    it('应该定义所有错误码', () => {
      expect(ErrorCode.SUCCESS).toBe(200)
      expect(ErrorCode.UNAUTHORIZED).toBe(401)
      expect(ErrorCode.FORBIDDEN).toBe(403)
      expect(ErrorCode.NOT_FOUND).toBe(404)
      expect(ErrorCode.SERVER_ERROR).toBe(500)
      expect(ErrorCode.NETWORK_ERROR).toBe(0)
      expect(ErrorCode.TIMEOUT).toBe(408)
    })

    it('应该可以用于类型检查', () => {
      const errorCode: ErrorCode = ErrorCode.SUCCESS
      expect(errorCode).toBe(200)
    })
  })

  describe('类型导出', () => {
    it('应该正确导出所有类型', () => {
      // 验证类型可以正常导入和使用
      const response: ApiResponse<number> = {
        code: 200,
        message: 'OK',
        data: 123,
      }
      const error: ApiError = {
        code: 400,
        message: 'Error',
      }
      const config: RequestConfig = {
        timeout: 5000,
      }
      const method: HttpMethod = 'GET'

      expect(response).toBeDefined()
      expect(error).toBeDefined()
      expect(config).toBeDefined()
      expect(method).toBeDefined()
    })
  })
})
