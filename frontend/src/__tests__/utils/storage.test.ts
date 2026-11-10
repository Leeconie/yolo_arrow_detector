/**
 * @fileoverview 本地存储工具单元测试
 * @module utils/storage.test
 * @author HeZaoCha
 * @date 2026-01-10
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  setStorage,
  getStorage,
  removeStorage,
  clearStorage,
  setSessionStorage,
  getSessionStorage,
  removeSessionStorage,
  clearSessionStorage,
} from '@/utils/storage'

describe('本地存储工具', () => {
  beforeEach(() => {
    // 每个测试前清空localStorage和sessionStorage
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  describe('localStorage操作', () => {
    describe('setStorage和getStorage', () => {
      it('应该正确存储和读取数据', () => {
        setStorage('test-key', 'test-value')
        expect(getStorage('test-key')).toBe('test-value')
      })

      it('应该支持存储对象', () => {
        const obj = { name: 'John', age: 30 }
        setStorage('test-obj', obj)
        expect(getStorage('test-obj')).toEqual(obj)
      })

      it('应该支持存储数组', () => {
        const arr = [1, 2, 3]
        setStorage('test-arr', arr)
        expect(getStorage('test-arr')).toEqual(arr)
      })

      it('应该支持存储数字', () => {
        setStorage('test-num', 123)
        expect(getStorage('test-num')).toBe(123)
      })

      it('应该支持存储布尔值', () => {
        setStorage('test-bool', true)
        expect(getStorage('test-bool')).toBe(true)
      })

      it('应该在数据不存在时返回默认值', () => {
        expect(getStorage('non-existent', 'default')).toBe('default')
        expect(getStorage('non-existent', null)).toBe(null)
      })

      it('应该处理过期机制', () => {
        // 设置1秒后过期的数据
        setStorage('expiring-key', 'value', 1)
        expect(getStorage('expiring-key')).toBe('value')

        // 等待过期
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            expect(getStorage('expiring-key')).toBeUndefined()
            resolve()
          }, 1100)
        })
      })

      it('应该支持永久存储（expiresIn=0）', () => {
        setStorage('permanent-key', 'value', 0)
        expect(getStorage('permanent-key')).toBe('value')
      })

      it('应该在存储失败时抛出错误', () => {
        // 在jsdom环境中，localStorage.setItem可能不会抛出错误
        // 这里测试错误处理逻辑存在
        // 实际错误处理已在代码中实现（try-catch + throw）
        const originalSetItem = Storage.prototype.setItem
        let errorThrown = false

        Storage.prototype.setItem = function () {
          throw new Error('Storage quota exceeded')
        }

        try {
          setStorage('test-key', 'value')
        } catch (error) {
          errorThrown = true
          expect(error).toBeInstanceOf(Error)
        }

        expect(errorThrown).toBe(true)

        // 恢复原始方法
        Storage.prototype.setItem = originalSetItem
      })

      it('应该在读取失败时返回默认值', () => {
        // Mock localStorage.getItem返回无效JSON
        const originalGetItem = localStorage.getItem
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        localStorage.getItem = vi.fn(() => 'invalid-json')

        const result = getStorage('test-key', 'default')
        expect(result).toBe('default')
        // console.error可能在catch块中被调用，也可能没有，取决于实现
        // 主要验证功能正确性

        // 恢复原始方法
        localStorage.getItem = originalGetItem
        consoleSpy.mockRestore()
      })
    })

    describe('removeStorage', () => {
      it('应该删除指定的存储项', () => {
        setStorage('test-key', 'value')
        removeStorage('test-key')
        expect(getStorage('test-key')).toBeUndefined()
      })

      it('应该安全处理不存在的键', () => {
        expect(() => removeStorage('non-existent')).not.toThrow()
      })
    })

    describe('clearStorage', () => {
      it('应该清空所有localStorage', () => {
        setStorage('key1', 'value1')
        setStorage('key2', 'value2')
        clearStorage()
        expect(getStorage('key1')).toBeUndefined()
        expect(getStorage('key2')).toBeUndefined()
      })
    })
  })

  describe('sessionStorage操作', () => {
    describe('setSessionStorage和getSessionStorage', () => {
      it('应该正确存储和读取数据', () => {
        setSessionStorage('test-key', 'test-value')
        expect(getSessionStorage('test-key')).toBe('test-value')
      })

      it('应该支持存储对象', () => {
        const obj = { name: 'John', age: 30 }
        setSessionStorage('test-obj', obj)
        expect(getSessionStorage('test-obj')).toEqual(obj)
      })

      it('应该在数据不存在时返回默认值', () => {
        expect(getSessionStorage('non-existent', 'default')).toBe('default')
      })

      it('应该在存储失败时抛出错误', () => {
        // 在jsdom环境中，sessionStorage.setItem可能不会抛出错误
        // 这里测试错误处理逻辑存在
        const originalSetItem = Storage.prototype.setItem
        let errorThrown = false

        Storage.prototype.setItem = function () {
          throw new Error('Storage quota exceeded')
        }

        try {
          setSessionStorage('test-key', 'value')
        } catch (error) {
          errorThrown = true
          expect(error).toBeInstanceOf(Error)
        }

        expect(errorThrown).toBe(true)

        // 恢复原始方法
        Storage.prototype.setItem = originalSetItem
      })

      it('应该在读取失败时返回默认值', () => {
        // Mock sessionStorage.getItem返回无效JSON
        const originalGetItem = sessionStorage.getItem
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        sessionStorage.getItem = vi.fn(() => 'invalid-json')

        const result = getSessionStorage('test-key', 'default')
        expect(result).toBe('default')
        // console.error可能在catch块中被调用，也可能没有，取决于实现
        // 主要验证功能正确性

        // 恢复原始方法
        sessionStorage.getItem = originalGetItem
        consoleSpy.mockRestore()
      })
    })

    describe('removeSessionStorage', () => {
      it('应该删除指定的存储项', () => {
        setSessionStorage('test-key', 'value')
        removeSessionStorage('test-key')
        expect(getSessionStorage('test-key')).toBeUndefined()
      })
    })

    describe('clearSessionStorage', () => {
      it('应该清空所有sessionStorage', () => {
        setSessionStorage('key1', 'value1')
        setSessionStorage('key2', 'value2')
        clearSessionStorage()
        expect(getSessionStorage('key1')).toBeUndefined()
        expect(getSessionStorage('key2')).toBeUndefined()
      })
    })
  })
})
