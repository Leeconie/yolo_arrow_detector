/**
 * @fileoverview CSRF防护工具单元测试
 * @module core/api/csrf.test
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 测试CSRF Token生成、存储、验证等功能
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  generateCsrfToken,
  getCsrfToken,
  setCsrfToken,
  clearCsrfToken,
  validateCsrfToken,
  refreshCsrfToken,
} from '@/core/api/csrf'
import { getStorage, removeStorage } from '@/utils/storage'

describe('CSRF防护工具', () => {
  beforeEach(() => {
    // 清理localStorage
    removeStorage('csrfToken')
  })

  describe('generateCsrfToken', () => {
    it('应该生成CSRF Token', () => {
      const token = generateCsrfToken()
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(0)
    })

    it('应该生成唯一的Token', () => {
      const token1 = generateCsrfToken()
      const token2 = generateCsrfToken()
      expect(token1).not.toBe(token2)
    })

    it('应该生成足够长的Token', () => {
      const token = generateCsrfToken()
      // Token应该至少有一定长度
      expect(token.length).toBeGreaterThan(10)
    })
  })

  describe('setCsrfToken', () => {
    it('应该设置CSRF Token到localStorage', () => {
      const token = 'test-csrf-token'
      setCsrfToken(token)
      const stored = getStorage<string>('csrfToken')
      expect(stored).toBe(token)
    })

    it('应该覆盖已存在的Token', () => {
      setCsrfToken('old-token')
      setCsrfToken('new-token')
      const stored = getStorage<string>('csrfToken')
      expect(stored).toBe('new-token')
    })
  })

  describe('getCsrfToken', () => {
    it('应该获取已存在的Token', () => {
      const token = 'test-token'
      setCsrfToken(token)
      expect(getCsrfToken()).toBe(token)
    })

    it('应该在Token不存在时生成新的Token', () => {
      const token = getCsrfToken()
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      // 验证Token已存储
      const stored = getStorage<string>('csrfToken')
      expect(stored).toBe(token)
    })
  })

  describe('clearCsrfToken', () => {
    it('应该清除CSRF Token', () => {
      setCsrfToken('test-token')
      clearCsrfToken()
      const stored = getStorage<string>('csrfToken')
      expect(stored).toBeUndefined()
    })
  })

  describe('validateCsrfToken', () => {
    it('应该验证有效的Token', () => {
      const token = 'test-token'
      setCsrfToken(token)
      expect(validateCsrfToken(token)).toBe(true)
    })

    it('应该拒绝无效的Token', () => {
      setCsrfToken('valid-token')
      expect(validateCsrfToken('invalid-token')).toBe(false)
    })

    it('应该拒绝空Token', () => {
      expect(validateCsrfToken('')).toBe(false)
      expect(validateCsrfToken(null as unknown as string)).toBe(false)
    })
  })

  describe('refreshCsrfToken', () => {
    it('应该生成新的Token并替换旧的', () => {
      const oldToken = 'old-token'
      setCsrfToken(oldToken)
      const newToken = refreshCsrfToken()
      expect(newToken).not.toBe(oldToken)
      expect(getStorage<string>('csrfToken')).toBe(newToken)
    })

    it('应该返回新的Token', () => {
      const token = refreshCsrfToken()
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
    })
  })
})
