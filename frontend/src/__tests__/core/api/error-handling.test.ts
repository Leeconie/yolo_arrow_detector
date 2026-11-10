/**
 * @fileoverview 错误处理优化测试
 * @module core/api/error-handling.test
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 测试错误消息映射、网络错误类型识别等功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  ERROR_MESSAGES,
  NetworkErrorType,
  getNetworkErrorType,
  getNetworkErrorMessage,
  getHttpErrorMessage,
  getBusinessErrorMessage,
} from '@/core/api/error-messages'
import { ErrorCode } from '@/types/api'

describe('错误处理优化', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('错误消息映射表', () => {
    it('应该包含所有预定义的错误码', () => {
      expect(ERROR_MESSAGES[ErrorCode.UNAUTHORIZED]).toBe('登录已过期，请重新登录')
      expect(ERROR_MESSAGES[ErrorCode.FORBIDDEN]).toBe('您没有权限访问该资源')
      expect(ERROR_MESSAGES[ErrorCode.NOT_FOUND]).toBe('请求的资源不存在')
      expect(ERROR_MESSAGES[ErrorCode.SERVER_ERROR]).toBe('服务器内部错误，请稍后重试')
      expect(ERROR_MESSAGES[ErrorCode.TIMEOUT]).toBe('请求超时，请检查网络连接后重试')
      expect(ERROR_MESSAGES[ErrorCode.NETWORK_ERROR]).toBe('网络连接失败，请检查网络设置')
    })

    it('应该返回友好的错误消息', () => {
      const messages = Object.values(ERROR_MESSAGES)
      messages.forEach((message) => {
        expect(message).toBeTruthy()
        expect(typeof message).toBe('string')
        expect(message.length).toBeGreaterThan(0)
      })
    })
  })

  describe('网络错误类型识别', () => {
    it('应该识别请求超时错误', () => {
      expect(getNetworkErrorType({ code: 'ECONNABORTED' })).toBe(NetworkErrorType.TIMEOUT)
      expect(getNetworkErrorType({ code: 'ETIMEDOUT' })).toBe(NetworkErrorType.TIMEOUT)
      expect(getNetworkErrorType({ message: 'timeout error' })).toBe(NetworkErrorType.TIMEOUT)
    })

    it('应该识别DNS解析失败错误', () => {
      expect(getNetworkErrorType({ code: 'ENOTFOUND' })).toBe(NetworkErrorType.DNS_FAILED)
      expect(getNetworkErrorType({ code: 'EAI_AGAIN' })).toBe(NetworkErrorType.DNS_FAILED)
      expect(getNetworkErrorType({ message: 'dns lookup failed' })).toBe(
        NetworkErrorType.DNS_FAILED,
      )
    })

    it('应该识别连接被拒绝错误', () => {
      expect(getNetworkErrorType({ code: 'ECONNREFUSED' })).toBe(
        NetworkErrorType.CONNECTION_REFUSED,
      )
      expect(getNetworkErrorType({ message: 'connection refused' })).toBe(
        NetworkErrorType.CONNECTION_REFUSED,
      )
    })

    it('应该识别网络断开错误', () => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: false,
      })

      expect(getNetworkErrorType({ code: 'ERR_NETWORK' })).toBe(NetworkErrorType.OFFLINE)
      expect(getNetworkErrorType({ message: 'network error' })).toBe(NetworkErrorType.OFFLINE)
      expect(getNetworkErrorType({})).toBe(NetworkErrorType.OFFLINE) // navigator.onLine为false时

      // 恢复 navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: true,
      })
    })

    it('应该识别未知网络错误', () => {
      expect(getNetworkErrorType({ code: 'UNKNOWN_ERROR' })).toBe(NetworkErrorType.UNKNOWN)
      expect(getNetworkErrorType({ message: 'some other error' })).toBe(NetworkErrorType.UNKNOWN)
      expect(getNetworkErrorType({})).toBe(NetworkErrorType.UNKNOWN)
    })
  })

  describe('网络错误消息', () => {
    it('应该返回对应的错误消息', () => {
      expect(getNetworkErrorMessage(NetworkErrorType.OFFLINE)).toBe(
        '网络连接已断开，请检查网络设置后重试',
      )
      expect(getNetworkErrorMessage(NetworkErrorType.TIMEOUT)).toBe(
        '请求超时，请检查网络连接后重试',
      )
      expect(getNetworkErrorMessage(NetworkErrorType.DNS_FAILED)).toBe(
        '无法解析服务器地址，请检查网络设置',
      )
      expect(getNetworkErrorMessage(NetworkErrorType.CONNECTION_REFUSED)).toBe(
        '服务器连接被拒绝，请稍后重试',
      )
      expect(getNetworkErrorMessage(NetworkErrorType.UNKNOWN)).toBe('网络错误，请检查网络连接')
    })

    it('应该为未知错误类型返回默认消息', () => {
      // 测试不存在的错误类型（通过类型断言）
      const unknownType = 'UNKNOWN_TYPE' as NetworkErrorType
      expect(getNetworkErrorMessage(unknownType)).toBe('网络错误，请检查网络连接')
    })
  })

  describe('HTTP错误消息', () => {
    it('应该返回映射表中的错误消息', () => {
      expect(getHttpErrorMessage(ErrorCode.UNAUTHORIZED)).toBe('登录已过期，请重新登录')
      expect(getHttpErrorMessage(ErrorCode.FORBIDDEN)).toBe('您没有权限访问该资源')
      expect(getHttpErrorMessage(ErrorCode.NOT_FOUND)).toBe('请求的资源不存在')
      expect(getHttpErrorMessage(ErrorCode.SERVER_ERROR)).toBe('服务器内部错误，请稍后重试')
    })

    it('应该为4xx错误返回通用消息', () => {
      expect(getHttpErrorMessage(400)).toBe('请求错误 (400)，请检查请求参数')
      expect(getHttpErrorMessage(422)).toBe('请求错误 (422)，请检查请求参数')
      expect(getHttpErrorMessage(400, '自定义消息')).toBe('自定义消息')
    })

    it('应该为5xx错误返回通用消息', () => {
      // 500错误在映射表中，所以返回映射表中的消息
      expect(getHttpErrorMessage(500)).toBe('服务器内部错误，请稍后重试')
      // 503错误不在映射表中，返回通用消息
      expect(getHttpErrorMessage(503)).toBe('服务器错误 (503)，请稍后重试')
      // 注意：getHttpErrorMessage 优先使用映射表中的消息，即使提供了 defaultMessage
      // 所以这里应该返回映射表中的消息，而不是自定义消息
      expect(getHttpErrorMessage(500, '自定义消息')).toBe('服务器内部错误，请稍后重试')
      // 对于不在映射表中的错误码，会使用 defaultMessage
      expect(getHttpErrorMessage(503, '自定义消息')).toBe('自定义消息')
    })

    it('应该为其他状态码返回默认消息', () => {
      expect(getHttpErrorMessage(200)).toBe('请求失败 (200)')
      expect(getHttpErrorMessage(300)).toBe('请求失败 (300)')
      expect(getHttpErrorMessage(200, '自定义消息')).toBe('自定义消息')
    })
  })

  describe('业务错误消息', () => {
    it('应该返回映射表中的错误消息', () => {
      expect(getBusinessErrorMessage(ErrorCode.UNAUTHORIZED)).toBe('登录已过期，请重新登录')
      expect(getBusinessErrorMessage(ErrorCode.FORBIDDEN)).toBe('您没有权限访问该资源')
      expect(getBusinessErrorMessage(ErrorCode.NOT_FOUND)).toBe('请求的资源不存在')
    })

    it('应该优先使用服务器返回的消息', () => {
      expect(getBusinessErrorMessage(1001, '服务器自定义消息')).toBe('服务器自定义消息')
      expect(getBusinessErrorMessage(ErrorCode.UNAUTHORIZED, '服务器自定义消息')).toBe(
        '登录已过期，请重新登录',
      )
    })

    it('应该为未知错误码返回默认消息', () => {
      expect(getBusinessErrorMessage(9999)).toBe('操作失败，请稍后重试')
      expect(getBusinessErrorMessage(9999, '')).toBe('操作失败，请稍后重试')
    })
  })

  describe('错误消息友好性', () => {
    it('所有错误消息应该是中文', () => {
      const allMessages = [
        ...Object.values(ERROR_MESSAGES),
        ...Object.values(NetworkErrorType).map((type) => getNetworkErrorMessage(type)),
      ]

      allMessages.forEach((message) => {
        expect(message).toBeTruthy()
        // 检查是否包含中文字符（简单检查）
        expect(/[\u4e00-\u9fa5]/.test(message)).toBe(true)
      })
    })

    it('错误消息应该提供解决建议', () => {
      const messages = Object.values(ERROR_MESSAGES)
      messages.forEach((message) => {
        // 检查是否包含建议性词汇（"请"、"稍后"、"检查"、"重试"、"重新"、"访问"等）
        // 或者包含明确的错误描述（"不存在"、"失败"等）
        const hasSuggestion =
          message.includes('请') ||
          message.includes('稍后') ||
          message.includes('检查') ||
          message.includes('重试') ||
          message.includes('重新') ||
          message.includes('访问') ||
          message.includes('不存在') ||
          message.includes('失败')
        expect(hasSuggestion).toBe(true)
      })
    })
  })
})
