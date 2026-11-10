/**
 * @fileoverview 应用基础功能E2E测试
 * @module e2e/vue
 * @description 测试应用的基础功能，如页面加载、路由等
 */

import { test, expect } from '@playwright/test'

test.describe('应用基础功能', () => {
  test('应该能够访问应用根路径', async ({ page }) => {
    await page.goto('/')
    
    // 根路径应该重定向到/home，但未登录用户会被重定向到/login
    // 等待URL变化
    await page.waitForURL(/\/(login|home)/, { timeout: 5000 })
    
    // 验证页面已加载
    const url = page.url()
    expect(url).toMatch(/\/(login|home)/)
  })

  test('页面应该能够正常加载', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('domcontentloaded')
    
    // 检查页面是否有JavaScript错误
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })
    
    await expect(page.locator('body')).toBeVisible()
    
    // 如果有严重错误，测试应该失败
    const criticalErrors = errors.filter((e) => 
      !e.includes('ResizeObserver') && 
      !e.includes('Non-Error promise rejection')
    )
    expect(criticalErrors.length).toBe(0)
  })
})
