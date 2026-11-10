/**
 * @fileoverview 敏感信息保护工具单元测试
 * @module utils/sensitive.test
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 测试敏感信息脱敏、日志安全等功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  detectSensitiveType,
  maskSensitive,
  maskSensitiveObject,
  safeLog,
  maskErrorMessage,
  SensitiveType,
} from '@/utils/sensitive'

describe('敏感信息保护工具', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('detectSensitiveType', () => {
    it('应该检测手机号', () => {
      expect(detectSensitiveType('13800138000')).toBe(SensitiveType.PHONE)
      expect(detectSensitiveType('15912345678')).toBe(SensitiveType.PHONE)
    })

    it('应该检测邮箱', () => {
      expect(detectSensitiveType('user@example.com')).toBe(SensitiveType.EMAIL)
      expect(detectSensitiveType('test@test.cn')).toBe(SensitiveType.EMAIL)
    })

    it('应该检测身份证号', () => {
      expect(detectSensitiveType('110101199001011234')).toBe(SensitiveType.ID_CARD)
    })

    it('应该检测银行卡号', () => {
      expect(detectSensitiveType('6222021234567890')).toBe(SensitiveType.BANK_CARD)
    })

    it('应该检测Token', () => {
      expect(detectSensitiveType('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')).toBe(SensitiveType.TOKEN)
    })

    it('应该返回null对于非敏感信息', () => {
      expect(detectSensitiveType('hello world')).toBeNull()
      expect(detectSensitiveType('123')).toBeNull()
    })
  })

  describe('maskSensitive', () => {
    it('应该脱敏手机号', () => {
      expect(maskSensitive('13800138000')).toBe('138****8000')
      expect(maskSensitive('13800138000', SensitiveType.PHONE)).toBe('138****8000')
    })

    it('应该脱敏邮箱', () => {
      const result = maskSensitive('user@example.com', SensitiveType.EMAIL)
      expect(result).toContain('**')
      expect(result).toContain('@')
    })

    it('应该脱敏身份证号', () => {
      const result = maskSensitive('110101199001011234', SensitiveType.ID_CARD)
      expect(result).toContain('110101')
      expect(result).toContain('1234')
      expect(result).toContain('*')
    })

    it('应该脱敏Token', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
      const result = maskSensitive(token, SensitiveType.TOKEN)
      expect(result.length).toBe(token.length)
      expect(result).toContain('*')
    })

    it('应该处理空字符串', () => {
      expect(maskSensitive('')).toBe('')
      expect(maskSensitive('', SensitiveType.PHONE)).toBe('')
    })
  })

  describe('maskSensitiveObject', () => {
    it('应该脱敏对象中的敏感信息', () => {
      const obj = {
        phone: '13800138000',
        email: 'user@example.com',
        name: 'John',
      }
      const result = maskSensitiveObject(obj)
      expect(result.phone).toBe('138****8000')
      expect(result.name).toBe('John')
    })

    it('应该脱敏数组中的对象', () => {
      // 测试行209的边界情况：数组中的对象
      const obj = {
        users: [
          { phone: '13800138000', name: 'User1' },
          { email: 'user2@example.com', name: 'User2' },
        ],
      }
      const result = maskSensitiveObject(obj)
      expect(result.users[0].phone).toContain('*')
      expect(result.users[1].email).toContain('*')
    })

    it('应该脱敏嵌套对象', () => {
      const obj = {
        user: {
          phone: '13800138000',
          email: 'user@example.com',
        },
        name: 'John',
      }
      const result = maskSensitiveObject(obj)
      expect(result.user.phone).toBe('138****8000')
      expect(result.name).toBe('John')
    })

    it('应该脱敏数组中的敏感信息', () => {
      const obj = {
        phones: ['13800138000', '15912345678'],
        names: ['John', 'Jane'],
      }
      const result = maskSensitiveObject(obj)
      expect(result.phones[0]).toBe('138****8000')
      expect(result.names[0]).toBe('John')
    })

    it('应该脱敏指定的敏感字段', () => {
      const obj = {
        password: '123456',
        token: 'abc123def456',
        name: 'John',
      }
      const result = maskSensitiveObject(obj, ['password', 'token'])
      expect(result.password).toContain('*')
      expect(result.token).toContain('*')
      expect(result.name).toBe('John')
    })
  })

  describe('safeLog', () => {
    it('应该输出日志并脱敏敏感信息', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      safeLog('error', '测试', { phone: '13800138000', name: 'John' })
      expect(consoleSpy).toHaveBeenCalled()
      const callArgs = consoleSpy.mock.calls[0]
      expect(callArgs[1]).toBe('测试')
      const data = callArgs[2] as { phone: string; name: string }
      expect(data.phone).toBe('138****8000')
      expect(data.name).toBe('John')
      consoleSpy.mockRestore()
    })

    it('应该处理字符串数据', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      safeLog('log', '测试', '13800138000')
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('应该处理无data的情况', () => {
      // 测试行245的无data情况
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
      safeLog('info', '测试消息')
      expect(consoleSpy).toHaveBeenCalled()
      const callArgs = consoleSpy.mock.calls[0]
      expect(callArgs[1]).toBe('测试消息')
      expect(callArgs.length).toBe(2) // 只有prefix和message，没有data
      consoleSpy.mockRestore()
    })
  })

  describe('maskErrorMessage', () => {
    it('应该脱敏Error对象中的消息', () => {
      const error = new Error('Token: abc123def456')
      const result = maskErrorMessage(error)
      expect(result).toContain('*')
      expect(result).not.toContain('abc123def456')
    })

    it('应该脱敏字符串错误', () => {
      const result = maskErrorMessage('Phone: 13800138000')
      expect(result).toContain('*')
      expect(result).not.toContain('13800138000')
    })

    it('应该处理对象错误', () => {
      const error = { message: 'Token: abc123', code: 500 }
      const result = maskErrorMessage(error)
      expect(result).toContain('*')
    })

    it('应该处理null和undefined错误', () => {
      // 测试行257的null/undefined情况
      expect(maskErrorMessage(null)).toBe('未知错误')
      expect(maskErrorMessage(undefined)).toBe('未知错误')
    })

    it('应该处理其他类型错误', () => {
      // 测试行271的其他类型错误
      // maskErrorMessage会对所有输入进行脱敏，所以数字会被转换为字符串并脱敏
      const result1 = maskErrorMessage(123)
      expect(typeof result1).toBe('string')
      expect(result1.length).toBeGreaterThan(0)

      const result2 = maskErrorMessage(true)
      expect(typeof result2).toBe('string')
      expect(result2.length).toBeGreaterThan(0)

      const result3 = maskErrorMessage(false)
      expect(typeof result3).toBe('string')
      expect(result3.length).toBeGreaterThan(0)
    })

    it('应该处理对象中没有message字段的情况', () => {
      // 测试行268-269的对象错误处理
      const error = { error: 'Token: abc123', code: 500 }
      const result = maskErrorMessage(error)
      expect(result).toContain('*')
    })

    it('应该处理对象中只有msg字段的情况', () => {
      const error = { msg: 'Token: abc123', code: 500 }
      const result = maskErrorMessage(error)
      expect(result).toContain('*')
    })
  })
})
