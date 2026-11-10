/**
 * @fileoverview 请求缓存管理器测试
 * @module __tests__/core/api/cache
 * @author HeZaoCha
 * @date 2026-01-10
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CacheManager } from '@/core/api/cache'

describe('CacheManager', () => {
  let cache: CacheManager

  beforeEach(() => {
    cache = new CacheManager({
      maxSize: 10,
      defaultTTL: 5000, // 5秒
    })
  })

  describe('缓存基本功能', () => {
    it('应该能够设置和获取缓存', () => {
      cache.set('GET', '/api/test', { id: 1 }, { data: 'test' })
      const result = cache.get('GET', '/api/test', { id: 1 })
      expect(result).toEqual({ data: 'test' })
    })

    it('应该能够删除缓存', () => {
      cache.set('GET', '/api/test', { id: 1 }, { data: 'test' })
      cache.delete('GET', '/api/test', { id: 1 })
      const result = cache.get('GET', '/api/test', { id: 1 })
      expect(result).toBeNull()
    })

    it('应该能够清除所有缓存', () => {
      cache.set('GET', '/api/test1', {}, { data: 'test1' })
      cache.set('GET', '/api/test2', {}, { data: 'test2' })
      cache.clear()
      expect(cache.get('GET', '/api/test1', {})).toBeNull()
      expect(cache.get('GET', '/api/test2', {})).toBeNull()
    })
  })

  describe('缓存过期', () => {
    it('应该返回null当缓存过期时', async () => {
      cache.set('GET', '/api/test', {}, { data: 'test' }, 100) // 100ms过期
      await new Promise((resolve) => setTimeout(resolve, 150))
      const result = cache.get('GET', '/api/test', {})
      expect(result).toBeNull()
    })

    it('应该返回缓存数据当缓存未过期时', async () => {
      cache.set('GET', '/api/test', {}, { data: 'test' }, 1000) // 1秒过期
      await new Promise((resolve) => setTimeout(resolve, 100))
      const result = cache.get('GET', '/api/test', {})
      expect(result).toEqual({ data: 'test' })
    })
  })

  describe('LRU缓存策略', () => {
    it('应该移除最久未使用的缓存项当缓存满时', async () => {
      const cache = new CacheManager({ maxSize: 2 })
      cache.set('GET', '/api/test1', {}, { data: 'test1' })
      // 等待一小段时间，确保test1和test2的lastAccessed时间不同
      await new Promise((resolve) => setTimeout(resolve, 10))
      cache.set('GET', '/api/test2', {}, { data: 'test2' })
      // 访问test1，使其成为最近使用的（更新lastAccessed）
      await new Promise((resolve) => setTimeout(resolve, 10))
      cache.get('GET', '/api/test1', {})
      // 添加第三个项，应该移除test2（最久未使用）
      cache.set('GET', '/api/test3', {}, { data: 'test3' })
      expect(cache.get('GET', '/api/test2', {})).toBeNull()
      expect(cache.get('GET', '/api/test1', {})).toEqual({ data: 'test1' })
      expect(cache.get('GET', '/api/test3', {})).toEqual({ data: 'test3' })
    })
  })

  describe('缓存键生成', () => {
    it('应该为相同请求生成相同键', () => {
      cache.set('GET', '/api/test', { id: 1, name: 'test' }, { data: 'test' })
      // 参数顺序不同，但应该生成相同键
      const result = cache.get('GET', '/api/test', { name: 'test', id: 1 })
      expect(result).toEqual({ data: 'test' })
    })

    it('应该为不同请求生成不同键', () => {
      cache.set('GET', '/api/test', { id: 1 }, { data: 'test1' })
      cache.set('GET', '/api/test', { id: 2 }, { data: 'test2' })
      expect(cache.get('GET', '/api/test', { id: 1 })).toEqual({ data: 'test1' })
      expect(cache.get('GET', '/api/test', { id: 2 })).toEqual({ data: 'test2' })
    })
  })

  describe('缓存统计', () => {
    it('应该正确统计缓存命中率', () => {
      cache.set('GET', '/api/test', {}, { data: 'test' })
      cache.get('GET', '/api/test', {}) // 命中
      cache.get('GET', '/api/test2', {}) // 未命中
      const stats = cache.getStats()
      expect(stats.hits).toBe(1)
      expect(stats.misses).toBe(1)
      expect(stats.hitRate).toBe(50)
    })

    it('应该正确统计缓存大小', () => {
      cache.set('GET', '/api/test1', {}, { data: 'test1' })
      cache.set('GET', '/api/test2', {}, { data: 'test2' })
      const stats = cache.getStats()
      expect(stats.size).toBe(2)
    })
  })

  describe('按模式清除缓存', () => {
    it('应该能够按URL模式清除缓存', () => {
      cache.set('GET', '/api/user/1', {}, { data: 'user1' })
      cache.set('GET', '/api/user/2', {}, { data: 'user2' })
      cache.set('GET', '/api/order/1', {}, { data: 'order1' })
      cache.clearByPattern('/api/user')
      expect(cache.get('GET', '/api/user/1', {})).toBeNull()
      expect(cache.get('GET', '/api/user/2', {})).toBeNull()
      expect(cache.get('GET', '/api/order/1', {})).toEqual({ data: 'order1' })
    })

    it('应该能够使用正则表达式清除缓存', () => {
      cache.set('GET', '/api/user/1', {}, { data: 'user1' })
      cache.set('GET', '/api/user/2', {}, { data: 'user2' })
      cache.set('GET', '/api/order/1', {}, { data: 'order1' })
      cache.clearByPattern(/\/api\/user\/\d+/)
      expect(cache.get('GET', '/api/user/1', {})).toBeNull()
      expect(cache.get('GET', '/api/user/2', {})).toBeNull()
      expect(cache.get('GET', '/api/order/1', {})).toEqual({ data: 'order1' })
    })
  })

  describe('清理过期缓存', () => {
    it('应该能够清理所有过期缓存', async () => {
      cache.set('GET', '/api/test1', {}, { data: 'test1' }, 100)
      cache.set('GET', '/api/test2', {}, { data: 'test2' }, 1000)
      await new Promise((resolve) => setTimeout(resolve, 150))
      cache.cleanExpired()
      expect(cache.get('GET', '/api/test1', {})).toBeNull()
      expect(cache.get('GET', '/api/test2', {})).toEqual({ data: 'test2' })
    })
  })

  describe('仅缓存GET请求', () => {
    it('应该只缓存GET请求', () => {
      cache.set('GET', '/api/test', {}, { data: 'test' })
      cache.set('POST', '/api/test', {}, { data: 'test' })
      expect(cache.get('GET', '/api/test', {})).toEqual({ data: 'test' })
      expect(cache.get('POST', '/api/test', {})).toBeNull()
    })
  })
})
