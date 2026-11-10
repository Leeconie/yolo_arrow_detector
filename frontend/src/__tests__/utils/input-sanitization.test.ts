/**
 * @fileoverview 输入清理工具测试
 * @module __tests__/utils/input-sanitization
 * @author HeZaoCha
 * @date 2026-01-10
 */

import { describe, it, expect } from 'vitest'
import {
  sanitizeInput,
  sanitizeUrl,
  sanitizeJson,
  validateAndSanitizeInput,
} from '@/utils/input-sanitization'

describe('输入清理工具', () => {
  describe('sanitizeInput', () => {
    it('应该清理HTML标签', () => {
      // DOMPurify会移除script标签，但可能保留文本内容
      const scriptResult = sanitizeInput('<script>alert("xss")</script>')
      expect(scriptResult).not.toContain('<script>')
      expect(scriptResult).not.toContain('</script>')

      // 不允许HTML时，标签会被移除，但文本可能保留
      const boldResult = sanitizeInput('<b>bold</b>')
      expect(boldResult).not.toContain('<b>')
      expect(boldResult).not.toContain('</b>')
    })

    it('应该允许HTML（当allowHtml为true时）', () => {
      const result = sanitizeInput('<b>bold</b>', true)
      expect(result).toContain('bold')
      expect(result).not.toContain('<script>')
    })

    it('应该处理空输入', () => {
      expect(sanitizeInput('')).toBe('')
      expect(sanitizeInput(null as unknown as string)).toBe('')
    })
  })

  describe('sanitizeUrl', () => {
    it('应该接受有效的HTTP/HTTPS URL', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com/')
      expect(sanitizeUrl('http://example.com')).toBe('http://example.com/')
    })

    it('应该拒绝危险的协议', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBeNull()
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBeNull()
    })

    it('应该处理无效的URL', () => {
      expect(sanitizeUrl('not-a-url')).toBeNull()
    })
  })

  describe('sanitizeJson', () => {
    it('应该清理JSON中的字符串值', () => {
      const json = JSON.stringify({ name: '<script>alert(1)</script>' })
      const result = sanitizeJson(json) as { name: string }
      expect(result.name).not.toContain('<script>')
    })

    it('应该处理无效的JSON', () => {
      expect(sanitizeJson('not json')).toBeNull()
    })
  })

  describe('validateAndSanitizeInput', () => {
    it('应该限制输入长度', () => {
      const longInput = 'a'.repeat(2000)
      const result = validateAndSanitizeInput(longInput, 1000)
      expect(result.length).toBe(1000)
    })

    it('应该清理HTML', () => {
      const result = validateAndSanitizeInput('<script>alert(1)</script>')
      expect(result).not.toContain('<script>')
    })
  })
})
