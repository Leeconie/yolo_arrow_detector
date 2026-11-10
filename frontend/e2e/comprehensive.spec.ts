/**
 * @fileoverview 综合E2E测试
 * @module e2e/comprehensive
 * @description 完整的端到端测试，包括路由、登录、文件上传、性能等
 */

import { test, expect } from '@playwright/test'

test.describe('综合功能测试', () => {
  test.beforeEach(async ({ page }) => {
    // 清除localStorage，确保测试独立
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
    })
  })

  test.describe('路由导航测试', () => {
    test('应该正确重定向未登录用户到登录页', async ({ page }) => {
      await page.goto('/')
      await expect(page).toHaveURL(/.*\/login/)
    })

    test('应该能够访问所有路由', async ({ page }) => {
      // 先登录
      await page.goto('/login')
      await page.locator('input[placeholder="请输入用户名"]').fill('zhangsan')
      await page.locator('input[placeholder="请输入密码"]').fill('123456')
      await page.locator('button:has-text("登录")').click()
      await page.waitForURL('**/home', { timeout: 5000 })

      // 测试各个路由
      const routes = [
        { path: '/home', title: '首页' },
        { path: '/archery', title: '射箭分析' },
        { path: '/video/upload', title: '视频上传' },
        { path: '/profile', title: '个人中心' },
      ]

      for (const route of routes) {
        await page.goto(route.path)
        await page.waitForLoadState('domcontentloaded')
        await expect(page).toHaveURL(new RegExp(`.*${route.path}`))
        await expect(page.locator('body')).toBeVisible()
      }
    })

    test('应该正确显示404页面', async ({ page }) => {
      await page.goto('/nonexistent-page')
      await page.waitForLoadState('domcontentloaded')
      await expect(page.locator('h1:has-text("404")')).toBeVisible()
    })
  })

  test.describe('登录流程测试', () => {
    test('应该能够使用测试账号登录', async ({ page }) => {
      await page.goto('/login')

      // 填写登录表单
      await page.locator('input[placeholder="请输入用户名"]').fill('zhangsan')
      await page.locator('input[placeholder="请输入密码"]').fill('123456')

      // 点击登录按钮
      await page.locator('button:has-text("登录")').click()

      // 等待登录成功并跳转
      await page.waitForURL('**/home', { timeout: 5000 })

      // 验证已登录
      expect(page.url()).toContain('/home')
      await expect(page.locator('text=zhangsan')).toBeVisible()
    })

    test('应该能够从登录页跳转到注册页', async ({ page }) => {
      await page.goto('/login')
      await page.locator('text=立即注册').click()
      await page.waitForURL('**/register', { timeout: 3000 })
      expect(page.url()).toContain('/register')
    })

    test('应该能够从注册页跳转到登录页', async ({ page }) => {
      await page.goto('/register')
      await page.locator('text=立即登录').click()
      await page.waitForURL('**/login', { timeout: 3000 })
      expect(page.url()).toContain('/login')
    })
  })

  test.describe('首页功能测试', () => {
    test.beforeEach(async ({ page }) => {
      // 登录
      await page.goto('/login')
      await page.locator('input[placeholder="请输入用户名"]').fill('zhangsan')
      await page.locator('input[placeholder="请输入密码"]').fill('123456')
      await page.locator('button:has-text("登录")').click()
      await page.waitForURL('**/home', { timeout: 5000 })
    })

    test('应该显示用户信息', async ({ page }) => {
      await page.goto('/home')
      await expect(page.locator('text=zhangsan')).toBeVisible()
    })

    test('应该显示射箭统计数据', async ({ page }) => {
      await page.goto('/home')
      await expect(page.locator('text=稳定性评分')).toBeVisible()
      await expect(page.locator('text=平均偏差值')).toBeVisible()
    })

    test('应该能够导航到其他页面', async ({ page }) => {
      await page.goto('/home')

      // 测试导航按钮（如果存在）
      const navigationButtons = [
        { text: '射箭分析', url: '/archery' },
        { text: '个人中心', url: '/profile' },
      ]

      for (const button of navigationButtons) {
        const buttonLocator = page.locator(`button:has-text("${button.text}")`)
        // eslint-disable-next-line playwright/no-conditional-in-test
        if (await buttonLocator.count() > 0) {
          await buttonLocator.click()
          await page.waitForURL(new RegExp(`.*${button.url}`), { timeout: 3000 })
          // eslint-disable-next-line playwright/no-conditional-expect
          expect(page.url()).toContain(button.url)
          // 返回首页继续测试
          await page.goto('/home')
        }
      }
    })
  })

  test.describe('射箭分析页面测试', () => {
    test.beforeEach(async ({ page }) => {
      // 登录
      await page.goto('/login')
      await page.locator('input[placeholder="请输入用户名"]').fill('zhangsan')
      await page.locator('input[placeholder="请输入密码"]').fill('123456')
      await page.locator('button:has-text("登录")').click()
      await page.waitForURL('**/home', { timeout: 5000 })
    })

    test('应该显示射箭分析页面', async ({ page }) => {
      await page.goto('/archery')
      await expect(page.locator('text=射箭视频分析')).toBeVisible()
    })

    test('应该显示上传分析视频按钮', async ({ page }) => {
      await page.goto('/archery')
      await expect(page.locator('button:has-text("上传分析视频")')).toBeVisible()
    })

    test('应该显示视频播放控制按钮', async ({ page }) => {
      await page.goto('/archery')
      await expect(page.locator('button:has-text("播放")')).toBeVisible()
      await expect(page.locator('button:has-text("暂停")')).toBeVisible()
    })
  })

  test.describe('视频上传页面测试', () => {
    test.beforeEach(async ({ page }) => {
      // 登录
      await page.goto('/login')
      await page.locator('input[placeholder="请输入用户名"]').fill('zhangsan')
      await page.locator('input[placeholder="请输入密码"]').fill('123456')
      await page.locator('button:has-text("登录")').click()
      await page.waitForURL('**/home', { timeout: 5000 })
    })

    test('应该显示视频上传页面', async ({ page }) => {
      await page.goto('/video/upload')
      await expect(page.locator('text=视频上传')).toBeVisible()
    })

    test('应该显示文件上传区域', async ({ page }) => {
      await page.goto('/video/upload')
      await expect(page.locator('text=将视频文件拖到此处')).toBeVisible()
    })

    test('应该显示视频类型选择', async ({ page }) => {
      await page.goto('/video/upload')
      await expect(page.locator('text=运动人体视频')).toBeVisible()
      await expect(page.locator('text=射箭视频')).toBeVisible()
    })

    test('应该显示支持格式和大小限制', async ({ page }) => {
      await page.goto('/video/upload')
      await expect(page.locator('text=支持格式')).toBeVisible()
      await expect(page.locator('text=512MB')).toBeVisible()
    })
  })

  test.describe('个人中心页面测试', () => {
    test.beforeEach(async ({ page }) => {
      // 登录
      await page.goto('/login')
      await page.locator('input[placeholder="请输入用户名"]').fill('zhangsan')
      await page.locator('input[placeholder="请输入密码"]').fill('123456')
      await page.locator('button:has-text("登录")').click()
      await page.waitForURL('**/home', { timeout: 5000 })
    })

    test('应该显示个人中心页面', async ({ page }) => {
      await page.goto('/profile')
      await expect(page.locator('text=个人中心')).toBeVisible()
    })

    test('应该显示用户信息', async ({ page }) => {
      await page.goto('/profile')
      await expect(page.locator('text=用户名')).toBeVisible()
      await expect(page.locator('text=zhangsan')).toBeVisible()
    })

    test('应该显示操作按钮', async ({ page }) => {
      await page.goto('/profile')
      await expect(page.locator('button:has-text("修改基础信息")')).toBeVisible()
      await expect(page.locator('button:has-text("修改密码")')).toBeVisible()
      await expect(page.locator('button:has-text("返回首页")')).toBeVisible()
    })
  })

  test.describe('性能测试', () => {
    test('应该测量页面加载性能', async ({ page }) => {
      await page.goto('/login')

      // 等待页面完全加载
      await page.waitForLoadState('domcontentloaded')

      // 获取性能指标
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          totalTime: navigation.loadEventEnd - navigation.fetchStart,
        }
      })

      // 验证性能指标
      expect(performanceMetrics.totalTime).toBeLessThan(5000) // 总加载时间应小于5秒
      expect(performanceMetrics.domContentLoaded).toBeLessThan(2000) // DOMContentLoaded应小于2秒
    })

    test('应该测量路由切换性能', async ({ page }) => {
      // 先登录
      await page.goto('/login')
      await page.locator('input[placeholder="请输入用户名"]').fill('zhangsan')
      await page.locator('input[placeholder="请输入密码"]').fill('123456')
      await page.locator('button:has-text("登录")').click()
      await page.waitForURL('**/home', { timeout: 5000 })

      // 测量路由切换时间
      const startTime = Date.now()
      await page.goto('/archery')
      await page.waitForLoadState('domcontentloaded')
      const navigationTime = Date.now() - startTime

      // 路由切换应小于1秒
      expect(navigationTime).toBeLessThan(1000)
    })
  })

  test.describe('错误处理测试', () => {
    test('应该处理404错误', async ({ page }) => {
      await page.goto('/nonexistent-page')
      await page.waitForLoadState('domcontentloaded')
      await expect(page.locator('h1:has-text("404")')).toBeVisible()
    })

    test('应该处理未登录访问受保护页面', async ({ page }) => {
      await page.goto('/')
      await page.evaluate(() => {
        localStorage.clear()
      })

      await page.goto('/home')
      await page.waitForURL(/.*\/login/, { timeout: 3000 })
      expect(page.url()).toContain('/login')
    })
  })
})
