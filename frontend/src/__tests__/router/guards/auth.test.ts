/**
 * @fileoverview 路由守卫单元测试
 * @module router/guards/auth.test
 * @author HeZaoCha
 * @date 2026-01-10
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'
import { setActivePinia, createPinia } from 'pinia'
import { setupAuthGuard } from '@/router/guards/auth'
import { useUserStore } from '@/stores/modules/user'
import { ROUTE_CONSTANTS } from '@/core/config'

describe('路由守卫', () => {
  let router: ReturnType<typeof createRouter>

  beforeEach(() => {
    setActivePinia(createPinia())

    router = createRouter({
      history: createWebHistory(),
      routes: [
        {
          path: '/',
          name: 'Home',
          component: { template: '<div>Home</div>' },
          meta: { title: '首页', requiresAuth: true },
        },
        {
          path: '/login',
          name: 'Login',
          component: { template: '<div>Login</div>' },
          meta: { title: '登录', requiresAuth: false },
        },
        {
          path: '/public',
          name: 'Public',
          component: { template: '<div>Public</div>' },
          meta: { requiresAuth: false },
        },
      ],
    })

    setupAuthGuard(router)
  })

  describe('未登录用户', () => {
    beforeEach(() => {
      const store = useUserStore()
      store.logout()
    })

    it('应该重定向未登录用户到登录页', async () => {
      await router.push('/')
      // 由于路由守卫是异步的，需要等待
      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(router.currentRoute.value.path).toBe(ROUTE_CONSTANTS.LOGIN_PATH)
    })

    it('应该允许访问不需要认证的路由', async () => {
      await router.push('/public')
      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(router.currentRoute.value.path).toBe('/public')
    })
  })

  describe('已登录用户', () => {
    beforeEach(async () => {
      const store = useUserStore()
      // 直接设置token，绕过状态更新优化器，确保立即生效
      // 注意：这里直接访问内部状态，仅用于测试
      // @ts-expect-error - 测试需要直接访问内部状态
      store.token = 'test-token'
      // 同时更新localStorage以确保一致性
      localStorage.setItem('token', 'test-token')
      // 等待响应式更新完成
      await nextTick()
    })

    it('应该允许访问需要认证的路由', async () => {
      await router.push('/')
      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(router.currentRoute.value.path).toBe('/')
    })

    it('应该重定向已登录用户从登录页到首页', async () => {
      await router.push('/login')
      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(router.currentRoute.value.path).toBe(ROUTE_CONSTANTS.HOME_PATH)
    })
  })

  describe('页面标题设置', () => {
    beforeEach(async () => {
      const store = useUserStore()
      // 直接设置token，绕过状态更新优化器，确保立即生效
      // 注意：这里直接访问内部状态，仅用于测试
      // @ts-expect-error - 测试需要直接访问内部状态
      store.token = 'test-token'
      // 同时更新localStorage以确保一致性
      localStorage.setItem('token', 'test-token')
      // 等待响应式更新完成
      await nextTick()
    })

    it('应该设置页面标题', async () => {
      const originalTitle = document.title
      await router.push('/')
      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(document.title).toContain('首页')
      document.title = originalTitle
    })
  })
})
