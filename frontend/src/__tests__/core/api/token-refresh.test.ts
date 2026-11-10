/**
 * @fileoverview Token刷新机制单元测试
 * @module core/api/token-refresh.test
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 测试Token刷新、过期检测等功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import {
  parseJwtToken,
  isTokenExpiringSoon,
  isTokenExpired,
  refreshToken,
  checkAndRefreshToken,
} from '@/core/api/token-refresh'
import { useUserStore } from '@/stores/modules/user'

// Mock API请求 - 必须在导入token-refresh之前
vi.mock('@/core/api/request', () => ({
  get: vi.fn(),
}))

describe('Token刷新机制', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('parseJwtToken', () => {
    it('应该解析有效的JWT Token', () => {
      // 创建一个简单的JWT Token（header.payload.signature）
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
      const payload = btoa(
        JSON.stringify({
          exp: Math.floor(Date.now() / 1000) + 3600,
          iat: Math.floor(Date.now() / 1000),
        }),
      )
      const signature = 'signature'
      const token = `${header}.${payload}.${signature}`

      const result = parseJwtToken(token)
      expect(result).toBeDefined()
      expect(result?.exp).toBeDefined()
    })

    it('应该返回null对于无效的Token', () => {
      expect(parseJwtToken('invalid-token')).toBeNull()
      expect(parseJwtToken('')).toBeNull()
      expect(parseJwtToken('only-one-part')).toBeNull()
      expect(parseJwtToken('part1.part2')).toBeNull() // 缺少signature部分
    })
  })

  describe('isTokenExpired', () => {
    it('应该检测已过期的Token', () => {
      // 创建一个已过期的Token
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
      const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 3600 }))
      const token = `${header}.${payload}.signature`

      expect(isTokenExpired(token)).toBe(true)
    })

    it('应该检测未过期的Token', () => {
      // 创建一个未过期的Token
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
      const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))
      const token = `${header}.${payload}.signature`

      expect(isTokenExpired(token)).toBe(false)
    })

    it('应该返回false对于非JWT Token', () => {
      expect(isTokenExpired('simple-token')).toBe(false)
    })
  })

  describe('isTokenExpiringSoon', () => {
    it('应该检测即将过期的Token', () => {
      // 创建一个即将过期的Token（剩余时间少于5分钟）
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
      const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 60 })) // 60秒后过期
      const token = `${header}.${payload}.signature`

      expect(isTokenExpiringSoon(token, 300)).toBe(true)
    })

    it('应该返回false对于未即将过期的Token', () => {
      // 创建一个还有很长时间才过期的Token
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
      const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })) // 1小时后过期
      const token = `${header}.${payload}.signature`

      expect(isTokenExpiringSoon(token, 300)).toBe(false)
    })
  })

  describe('refreshToken', () => {
    it('应该成功刷新Token', async () => {
      const { get } = await import('@/core/api/request')
      const mockResponse = {
        accessToken: 'new-access-token',
        userInfo: { id: 1, name: 'Test User' },
      }
      vi.mocked(get).mockResolvedValue(mockResponse)

      const result = await refreshToken()
      expect(result).toBe('new-access-token')
      // 注意：baseURL已经包含/api，所以这里只需要/auth/refresh
      expect(get).toHaveBeenCalledWith('/auth/refresh', {}, { skipRetry: true })
    })

    it('应该处理刷新失败的情况', async () => {
      const { get } = await import('@/core/api/request')
      vi.mocked(get).mockRejectedValue(new Error('Refresh failed'))

      await expect(refreshToken()).rejects.toThrow('Refresh failed')
    })
  })

  describe('checkAndRefreshToken', () => {
    it('应该返回当前Token如果未过期', async () => {
      const store = useUserStore()
      // 创建一个未过期的Token
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
      const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))
      const token = `${header}.${payload}.signature`
      store.setToken(token)

      // 等待状态更新优化器的nextTick
      await nextTick()
      await new Promise((resolve) => setTimeout(resolve, 20))

      // 确保token已设置
      expect(store.token).toBe(token)

      const result = await checkAndRefreshToken()
      expect(result).toBe(token)
    })

    it('应该刷新已过期的Token', async () => {
      const store = useUserStore()
      // 创建一个已过期的Token
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
      const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 3600 }))
      const expiredToken = `${header}.${payload}.signature`
      store.setToken(expiredToken)

      // 等待状态更新优化器的nextTick
      await nextTick()
      await new Promise((resolve) => setTimeout(resolve, 20))

      // 确保token已设置
      expect(store.token).toBe(expiredToken)

      const { get } = await import('@/core/api/request')
      const mockResponse = {
        accessToken: 'new-access-token',
        userInfo: { id: 1, name: 'Test User' },
      }
      vi.mocked(get).mockResolvedValue(mockResponse)

      const result = await checkAndRefreshToken()
      expect(result).toBe('new-access-token')
    })

    it('应该在没有Token时抛出错误', async () => {
      const store = useUserStore()
      store.setToken('')

      await expect(checkAndRefreshToken()).rejects.toThrow('未找到Token')
    })
  })
})
