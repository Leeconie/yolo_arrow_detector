/**
 * @fileoverview 加密解密工具单元测试
 * @module utils/encrypt.test
 * @author HeZaoCha
 * @date 2026-01-10
 */

import { describe, it, expect } from 'vitest'
import {
  base64Encode,
  base64Decode,
  simpleEncrypt,
  simpleDecrypt,
  randomString,
  simpleHash,
} from '@/utils/encrypt'

describe('加密解密工具', () => {
  describe('base64Encode和base64Decode', () => {
    it('应该正确编码字符串', () => {
      expect(base64Encode('hello')).toBe('aGVsbG8=')
      expect(base64Encode('Hello World')).toBe('SGVsbG8gV29ybGQ=')
    })

    it('应该正确解码字符串', () => {
      expect(base64Decode('aGVsbG8=')).toBe('hello')
      expect(base64Decode('SGVsbG8gV29ybGQ=')).toBe('Hello World')
    })

    it('应该支持编码和解码的往返', () => {
      const original = 'Hello World 你好世界'
      const encoded = base64Encode(original)
      const decoded = base64Decode(encoded)
      expect(decoded).toBe(original)
    })

    it('应该处理空字符串', () => {
      expect(base64Encode('')).toBe('')
      expect(base64Decode('')).toBe('')
    })

    it('应该处理特殊字符', () => {
      const special = '!@#$%^&*()'
      const encoded = base64Encode(special)
      const decoded = base64Decode(encoded)
      expect(decoded).toBe(special)
    })

    it('应该在Node.js环境中使用Buffer', () => {
      // 在测试环境中，btoa/atob可能不可用，会使用Buffer
      // 测试Node.js环境的代码路径
      const originalBtoa = global.btoa
      const originalAtob = global.atob
      // @ts-expect-error - 测试需要删除全局方法
      delete global.btoa
      // @ts-expect-error - 测试需要删除全局方法
      delete global.atob

      const result = base64Encode('test')
      expect(result).toBeTruthy()
      const decoded = base64Decode(result)
      expect(decoded).toBe('test')

      // 恢复
      global.btoa = originalBtoa
      global.atob = originalAtob
    })
  })

  describe('simpleEncrypt和simpleDecrypt', () => {
    it('应该正确加密和解密字符串', () => {
      const original = 'Hello World'
      const key = 'test-key'
      const encrypted = simpleEncrypt(original, key)
      const decrypted = simpleDecrypt(encrypted, key)
      expect(decrypted).toBe(original)
    })

    it('应该使用不同的密钥产生不同的加密结果', () => {
      const original = 'Hello World'
      const encrypted1 = simpleEncrypt(original, 'key1')
      const encrypted2 = simpleEncrypt(original, 'key2')
      expect(encrypted1).not.toBe(encrypted2)
    })

    it('应该在使用错误密钥时返回不同的结果', () => {
      const original = 'Hello World'
      const key = 'correct-key'
      const wrongKey = 'wrong-key'
      const encrypted = simpleEncrypt(original, key)
      const decrypted = simpleDecrypt(encrypted, wrongKey)
      expect(decrypted).not.toBe(original)
    })

    it('应该处理空字符串', () => {
      const key = 'test-key'
      const encrypted = simpleEncrypt('', key)
      const decrypted = simpleDecrypt(encrypted, key)
      expect(decrypted).toBe('')
    })

    it('应该在解密失败时抛出错误', () => {
      expect(() => simpleDecrypt('invalid-base64', 'key')).toThrow('解密失败')
    })
  })

  describe('randomString', () => {
    it('应该生成指定长度的随机字符串', () => {
      const result = randomString(10)
      expect(result).toHaveLength(10)
    })

    it('应该生成不同长度的随机字符串', () => {
      const result1 = randomString(5)
      const result2 = randomString(10)
      expect(result1).toHaveLength(5)
      expect(result2).toHaveLength(10)
    })

    it('应该生成不同的随机字符串', () => {
      const result1 = randomString(10)
      const result2 = randomString(10)
      // 虽然理论上可能相同，但概率极低
      expect(result1).not.toBe(result2)
    })

    it('应该处理长度为0的情况', () => {
      expect(randomString(0)).toBe('')
    })

    it('应该支持自定义字符集', () => {
      const result = randomString(10, '0123456789')
      expect(result).toHaveLength(10)
      expect(result).toMatch(/^\d+$/)
    })
  })

  describe('simpleHash', () => {
    it('应该为相同输入生成相同哈希', () => {
      const input = 'Hello World'
      const hash1 = simpleHash(input)
      const hash2 = simpleHash(input)
      expect(hash1).toBe(hash2)
    })

    it('应该为不同输入生成不同哈希', () => {
      const hash1 = simpleHash('Hello')
      const hash2 = simpleHash('World')
      expect(hash1).not.toBe(hash2)
    })

    it('应该生成固定长度的哈希', () => {
      const hash1 = simpleHash('short')
      const hash2 = simpleHash('very long string that should produce different hash')
      expect(hash1.length).toBe(hash2.length)
    })

    it('应该处理空字符串', () => {
      const hash = simpleHash('')
      expect(typeof hash).toBe('number')
      expect(hash).toBe(0)
    })
  })
})
