/**
 * @fileoverview 安全工具函数单元测试
 * @module utils/security.test
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 测试XSS防护、输入过滤等安全工具函数
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  sanitizeHtml,
  escapeHtml,
  isSafeUrl,
  sanitizeUrl,
  isSafeStorageKey,
  safeSetStorage,
  sanitizeInput,
} from '@/utils/security'

// Mock sensitive utilities to avoid potential issues during error handling
vi.mock('@/utils/sensitive', async () => {
  const actual = await vi.importActual<typeof import('@/utils/sensitive')>('@/utils/sensitive')
  return {
    ...actual,
    safeLog: vi.fn(),
  }
})

describe('安全工具函数', () => {
  beforeEach(() => {
    // 清理localStorage
    localStorage.clear()
  })

  describe('sanitizeHtml', () => {
    it('应该移除script标签', () => {
      const dirty = '<script>alert("xss")</script><p>Safe content</p>'
      const result = sanitizeHtml(dirty)
      expect(result).not.toContain('<script>')
      expect(result).toContain('<p>Safe content</p>')
    })

    it('应该移除onclick等事件处理器', () => {
      const dirty = '<p onclick="alert(\'xss\')">Click me</p>'
      const result = sanitizeHtml(dirty)
      expect(result).not.toContain('onclick')
    })

    it('应该保留安全的HTML标签', () => {
      const dirty = '<p>Safe <strong>bold</strong> text</p>'
      const result = sanitizeHtml(dirty)
      expect(result).toContain('<p>')
      expect(result).toContain('<strong>')
      expect(result).toContain('</strong>')
    })

    it('应该处理空字符串', () => {
      expect(sanitizeHtml('')).toBe('')
      expect(sanitizeHtml(null as unknown as string)).toBe('')
    })
  })

  describe('escapeHtml', () => {
    it('应该转义HTML特殊字符', () => {
      const text = '<script>alert("xss")</script>'
      const result = escapeHtml(text)
      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;')
    })

    it('应该转义所有HTML特殊字符', () => {
      const text = '<>&"\''
      const result = escapeHtml(text)
      expect(result).toBe('&lt;&gt;&amp;&quot;&#039;')
    })

    it('应该处理空字符串', () => {
      expect(escapeHtml('')).toBe('')
      expect(escapeHtml(null as unknown as string)).toBe('')
    })
  })

  describe('isSafeUrl', () => {
    it('应该允许http协议', () => {
      expect(isSafeUrl('http://example.com')).toBe(true)
    })

    it('应该允许https协议', () => {
      expect(isSafeUrl('https://example.com')).toBe(true)
    })

    it('应该拒绝javascript协议', () => {
      expect(isSafeUrl('javascript:alert("xss")')).toBe(false)
    })

    it('应该拒绝data协议', () => {
      expect(isSafeUrl('data:text/html,<script>alert("xss")</script>')).toBe(false)
    })

    it('应该处理无效URL', () => {
      // URL构造函数可能会将相对URL转换为绝对URL，所以需要更严格的测试
      // 使用明显无效的格式
      expect(isSafeUrl('not-a-url')).toBe(false)
      expect(isSafeUrl('://invalid')).toBe(false)
    })

    it('应该处理空字符串', () => {
      expect(isSafeUrl('')).toBe(false)
    })

    it('应该拒绝既不是http/https也不是相对路径的URL', () => {
      // 测试行105-107的边界情况
      expect(isSafeUrl('not-a-url')).toBe(false)
      expect(isSafeUrl('invalid://example.com')).toBe(false)
      expect(isSafeUrl('ftp://example.com')).toBe(false)
    })

    it('应该允许相对路径', () => {
      // 测试行112-113的相对路径处理
      expect(isSafeUrl('/path/to/resource')).toBe(true)
      expect(isSafeUrl('/api/users')).toBe(true)
    })

    it('应该处理URL解析失败的情况', () => {
      // 测试行119-121的catch块
      // 创建一个会导致URL解析失败的字符串
      expect(isSafeUrl('http://[invalid')).toBe(false)
    })
  })

  describe('sanitizeUrl', () => {
    it('应该返回安全的URL', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com')
    })

    it('应该返回空字符串对于不安全的URL', () => {
      expect(sanitizeUrl('javascript:alert("xss")')).toBe('')
    })

    it('应该处理空字符串', () => {
      expect(sanitizeUrl('')).toBe('')
    })
  })

  describe('isSafeStorageKey', () => {
    it('应该拒绝包含password的键名', () => {
      expect(isSafeStorageKey('password')).toBe(false)
      expect(isSafeStorageKey('userPassword')).toBe(false)
    })

    it('应该拒绝包含token的键名', () => {
      expect(isSafeStorageKey('token')).toBe(false)
      expect(isSafeStorageKey('authToken')).toBe(false)
    })

    it('应该允许安全的键名', () => {
      expect(isSafeStorageKey('theme')).toBe(true)
      expect(isSafeStorageKey('language')).toBe(true)
      expect(isSafeStorageKey('userPreferences')).toBe(true)
    })

    it('应该处理空字符串', () => {
      expect(isSafeStorageKey('')).toBe(false)
    })
  })

  describe('safeSetStorage', () => {
    it('应该正常存储数据', () => {
      safeSetStorage('theme', 'dark')
      expect(localStorage.getItem('theme')).toBe('dark')
    })

    it('应该在检查敏感信息时阻止存储并抛出错误', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      expect(() => {
        safeSetStorage('password', '123456', true)
      }).toThrow('Cannot store sensitive information: password')
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('应该处理存储错误', () => {
      // Mock localStorage.setItem抛出错误
      const error = new Error('QuotaExceededError')

      // 使用spyOn来mock setItem
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw error
      })

      // 直接测试函数是否抛出错误
      expect(() => safeSetStorage('key', 'value')).toThrow('QuotaExceededError')
      expect(setItemSpy).toHaveBeenCalledWith('key', 'value')

      // 恢复原始方法
      setItemSpy.mockRestore()
    })

    it('应该处理空键名', () => {
      // 测试行202-204的空键名检查
      // 注意：现在使用logger，不再使用console.warn
      // 空键名不会抛出错误，只会记录警告并返回
      expect(() => {
        safeSetStorage('', 'value')
      }).not.toThrow()
    })

    it('应该在checkSensitive为true时检查敏感信息', () => {
      // 测试行207-209的敏感信息检查
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      expect(() => {
        safeSetStorage('password', '123456', true)
      }).toThrow('Cannot store sensitive information: password')
      consoleSpy.mockRestore()
    })
  })

  describe('sanitizeInput', () => {
    it('应该默认转义HTML', () => {
      const input = '<script>alert("xss")</script>'
      const result = sanitizeInput(input)
      expect(result).not.toContain('<script>')
      expect(result).toContain('&lt;')
    })

    it('应该允许HTML当allowHtml为true时', () => {
      const input = '<p>Safe <strong>content</strong></p>'
      const result = sanitizeInput(input, { allowHtml: true })
      expect(result).toContain('<p>')
      expect(result).toContain('<strong>')
    })

    it('应该限制长度', () => {
      const input = 'a'.repeat(100)
      const result = sanitizeInput(input, { maxLength: 50 })
      expect(result).toHaveLength(50)
    })

    it('应该处理空字符串', () => {
      expect(sanitizeInput('')).toBe('')
    })
  })
})
