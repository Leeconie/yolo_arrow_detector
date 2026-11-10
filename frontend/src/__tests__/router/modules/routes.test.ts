/**
 * @fileoverview 路由配置单元测试
 * @module router/modules/routes.test
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 测试路由配置的正确性、懒加载和元信息
 */

import { describe, it, expect } from 'vitest'
import routes from '@/router/modules/routes'

describe('路由配置', () => {
  describe('路由配置结构', () => {
    it('应该是一个数组', () => {
      expect(Array.isArray(routes)).toBe(true)
    })

    it('应该包含至少一个路由', () => {
      expect(routes.length).toBeGreaterThan(0)
    })

    it('每个路由应该有path和name属性', () => {
      routes.forEach((route) => {
        expect(route).toHaveProperty('path')
        expect(route).toHaveProperty('name')
        expect(typeof route.path).toBe('string')
        expect(typeof route.name).toBe('string')
      })
    })
  })

  describe('路由路径', () => {
    it('应该包含首页路由', () => {
      const homeRoute = routes.find((r) => r.path === '/')
      expect(homeRoute).toBeDefined()
      expect(homeRoute?.name).toBe('HomePage')
    })

    it('应该包含登录页路由', () => {
      const loginRoute = routes.find((r) => r.path === '/login')
      expect(loginRoute).toBeDefined()
      expect(loginRoute?.name).toBe('LoginPage')
      // 验证组件路径已更新到模块目录
      if (loginRoute?.component) {
        expect(loginRoute.component.toString()).toContain('auth/Login')
      }
    })

    it('应该包含404路由', () => {
      const notFoundRoute = routes.find((r) => r.name === 'NotFoundPage')
      expect(notFoundRoute).toBeDefined()
      expect(notFoundRoute?.path).toContain('pathMatch')
    })
  })

  describe('路由懒加载', () => {
    it('所有路由应该使用动态import', () => {
      routes.forEach((route) => {
        if (route.component) {
          // 检查component是否为函数（动态import）
          expect(typeof route.component).toBe('function')
        }
      })
    })

    it('首页路由应该懒加载Home组件', () => {
      const homeRoute = routes.find((r) => r.path === '/')
      expect(homeRoute).toBeDefined()
      if (homeRoute?.component) {
        expect(typeof homeRoute.component).toBe('function')
      }
    })

    it('登录页路由应该懒加载Login组件', () => {
      const loginRoute = routes.find((r) => r.path === '/login')
      expect(loginRoute).toBeDefined()
      if (loginRoute?.component) {
        expect(typeof loginRoute.component).toBe('function')
      }
    })
  })

  describe('路由元信息', () => {
    it('首页路由应该有meta信息', () => {
      const homeRoute = routes.find((r) => r.path === '/home')
      expect(homeRoute?.meta).toBeDefined()
      expect(homeRoute?.meta?.title).toBe('首页')
      expect(homeRoute?.meta?.requiresAuth).toBe(true)
    })

    it('登录页路由应该有meta信息', () => {
      const loginRoute = routes.find((r) => r.path === '/login')
      expect(loginRoute?.meta).toBeDefined()
      expect(loginRoute?.meta?.title).toBe('用户登录')
      expect(loginRoute?.meta?.requiresAuth).toBe(false)
    })

    it('404路由应该有meta信息', () => {
      const notFoundRoute = routes.find((r) => r.name === 'NotFoundPage')
      expect(notFoundRoute?.meta).toBeDefined()
      expect(notFoundRoute?.meta?.title).toBe('页面不存在')
      expect(notFoundRoute?.meta?.requiresAuth).toBe(false)
    })

    it('所有路由的meta应该有title属性', () => {
      routes.forEach((route) => {
        if (route.meta) {
          expect(route.meta).toHaveProperty('title')
          expect(typeof route.meta.title).toBe('string')
        }
      })
    })

    it('所有路由的meta应该有requiresAuth属性', () => {
      routes.forEach((route) => {
        if (route.meta) {
          expect(route.meta).toHaveProperty('requiresAuth')
          expect(typeof route.meta.requiresAuth).toBe('boolean')
        }
      })
    })
  })

  describe('路由类型', () => {
    it('所有路由应该符合RouteRecordRaw类型', () => {
      routes.forEach((route) => {
        // TypeScript会在编译时检查类型，这里只做运行时基本检查
        expect(route).toHaveProperty('path')
        // 重定向路由可能没有name，这是允许的
        if (!route.redirect) {
          expect(route).toHaveProperty('name')
        }
      })
    })
  })

  describe('路由导出', () => {
    it('应该正确导出路由配置', () => {
      expect(routes).toBeDefined()
      expect(Array.isArray(routes)).toBe(true)
    })
  })
})
