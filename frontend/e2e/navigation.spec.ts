/**
 * @fileoverview 导航功能E2E测试
 * @module e2e/navigation
 * @description 测试页面导航、路由跳转等功能
 */

import { test, expect } from '@playwright/test'

test.describe('导航功能', () => {
  test.beforeEach(async ({ page }) => {
    // 先登录
    await page.goto('/login')
    await page.locator('input[placeholder="请输入用户名"]').fill('zhangsan')
    await page.locator('input[placeholder="请输入密码"]').fill('123456')
    await page.locator('button:has-text("登录")').click()
    await page.waitForURL('**/home', { timeout: 5000 })
  })

  test('应该能够导航到首页', async ({ page }) => {
    await page.goto('/home')
    await page.waitForLoadState('domcontentloaded')
    
    // 验证页面标题或关键元素
    const pageTitle = await page.title()
    expect(pageTitle).toBeTruthy()
  })

  test('应该能够导航到个人中心', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForLoadState('domcontentloaded')
    
    // 验证URL
    expect(page.url()).toContain('/profile')
  })

  test('应该能够导航到射箭分析页面', async ({ page }) => {
    await page.goto('/archery')
    await page.waitForLoadState('domcontentloaded')
    
    // 验证URL
    expect(page.url()).toContain('/archery')
  })

  test('访问不存在的页面应该显示404页面', async ({ page }) => {
    await page.goto('/non-existent-page')
    await page.waitForLoadState('domcontentloaded')
    
    // 验证404页面（根据NotFound.vue的内容）
    const notFoundText = page.locator('h1:has-text("404"), h1:has-text("页面不存在")')
    await expect(notFoundText).toBeVisible({ timeout: 3000 })
  })

  test('根路径应该重定向到首页', async ({ page }) => {
    await page.goto('/')
    await page.waitForURL('**/home', { timeout: 3000 })
    expect(page.url()).toContain('/home')
  })
})
