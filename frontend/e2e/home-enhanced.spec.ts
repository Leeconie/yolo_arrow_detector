/**
 * @fileoverview 首页功能增强E2E测试
 * @module e2e/home-enhanced
 * @description 测试首页所有按钮点击功能
 */

import { test, expect } from '@playwright/test'

test.describe('首页功能增强测试', () => {
  test.beforeEach(async ({ page }) => {
    // 先登录
    await page.goto('/login')
    await page.waitForLoadState('domcontentloaded')
    
    // 等待登录表单加载
    await expect(page.locator('input[placeholder="请输入用户名"]')).toBeVisible()
    await expect(page.locator('input[placeholder="请输入密码"]')).toBeVisible()
    
    // 填写登录信息
    await page.locator('input[placeholder="请输入用户名"]').fill('zhangsan')
    await page.locator('input[placeholder="请输入密码"]').fill('123456')
    
    // 点击登录按钮
    const loginButton = page.locator('button:has-text("登录")').first()
    await expect(loginButton).toBeVisible()
    await loginButton.click()
    
    // 等待登录成功并跳转到首页（状态更新需要时间）
    await page.waitForURL('**/home', { timeout: 15000 })
    
    // 确保页面已加载
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('body')).toBeVisible()
    
    // 额外等待，确保状态已完全更新
    await new Promise((resolve) => setTimeout(resolve, 500))
  })

  test('应该能够点击所有导航按钮', async ({ page }) => {
    await page.goto('/home')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('body')).toBeVisible()

    // 测试：点击"首页"按钮
    const homeButton = page.locator('button:has-text("首页")')
    await expect(homeButton).toBeVisible()
    await homeButton.click()
    await page.waitForURL('**/home', { timeout: 3000 })
    expect(page.url()).toContain('/home')

    // 测试：点击"射箭分析"按钮
    const archeryButton = page.locator('button:has-text("射箭分析")')
    await expect(archeryButton).toBeVisible()
    await archeryButton.click()
    await page.waitForURL('**/archery', { timeout: 3000 })
    expect(page.url()).toContain('/archery')

    // 返回首页
    await page.goto('/home')
    await page.waitForLoadState('domcontentloaded')

    // 测试：点击"个人中心"按钮
    const profileButton = page.locator('button:has-text("个人中心")')
    await expect(profileButton).toBeVisible()
    await profileButton.click()
    await page.waitForURL('**/profile', { timeout: 3000 })
    expect(page.url()).toContain('/profile')

    // 返回首页
    await page.goto('/home')
    await page.waitForLoadState('domcontentloaded')

    // 测试：点击"退出登录"按钮
    const logoutButton = page.locator('button:has-text("退出登录")').first()
    await expect(logoutButton).toBeVisible()
    await expect(logoutButton).toBeEnabled()
    
    // Element Plus的ElMessageBox.confirm不是标准的浏览器dialog
    // 需要等待对话框出现，然后点击确定按钮
    await logoutButton.click()
    
    // 等待确认对话框出现
    const confirmDialog = page.locator('.el-message-box').filter({ hasText: '确定要退出登录吗？' })
    await expect(confirmDialog).toBeVisible({ timeout: 5000 })
    
    // 点击确定按钮
    const confirmButton = confirmDialog.locator('button:has-text("确定")')
    await expect(confirmButton).toBeVisible()
    await confirmButton.click()
    
    // 等待退出登录并跳转到登录页
    await page.waitForURL('**/login', { timeout: 10000 })
    expect(page.url()).toContain('/login')
  })

  test('应该显示用户信息和统计数据', async ({ page }) => {
    await page.goto('/home')
    await page.waitForLoadState('domcontentloaded')
    
    // 验证用户信息卡片存在
    const userCard = page.locator('.user-card')
    await expect(userCard).toBeVisible()
    
    // 验证统计数据卡片存在
    const statsCard = page.locator('.stats-card')
    await expect(statsCard).toBeVisible()
    
    // 验证导航菜单卡片存在
    const navCard = page.locator('.nav-card')
    await expect(navCard).toBeVisible()
  })
})
