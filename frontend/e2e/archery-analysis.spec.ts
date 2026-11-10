/**
 * @fileoverview 射箭分析功能E2E测试
 * @module e2e/archery-analysis
 * @description 测试射箭分析相关功能
 */

import { test, expect } from '@playwright/test'

test.describe('射箭分析功能', () => {
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

  test('应该显示射箭分析页面', async ({ page }) => {
    await page.goto('/archery')
    await page.waitForLoadState('domcontentloaded')
    
    // 验证URL
    expect(page.url()).toContain('/archery')
    
    // 等待页面内容加载
    await expect(page.locator('body')).toBeVisible()
    
    // 验证页面有内容
    const pageContent = page.locator('body')
    await expect(pageContent).toHaveText(/.+/, { timeout: 5000 }) // 至少包含一个字符
  })

  test('页面应该能够正常加载', async ({ page }) => {
    await page.goto('/archery')
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

  test('应该能够点击所有控制按钮', async ({ page }) => {
    // beforeEach已经登录，这里直接跳转到射箭分析页面
    await page.goto('/archery')
    await page.waitForLoadState('domcontentloaded')
    
    // 等待页面完全加载（包括API调用和Vue渲染）
    await expect(page.locator('body')).toBeVisible()
    
    // 等待页面内容加载（验证页面有内容）
    const pageContent = page.locator('body')
    await expect(pageContent).toHaveText(/.+/, { timeout: 5000 }) // 至少包含一个字符
    
    // 直接等待上传按钮出现（使用Playwright推荐的locator方法）
    // 等待按钮完全渲染和可交互
    const buttonLocator = page.locator('button').first()
    await expect(buttonLocator).toBeVisible({ timeout: 20000 })
    
    // 使用locator查找按钮（Element Plus按钮可能无法被getByRole识别）
    const uploadButton = page.locator('button:has-text("上传分析视频")').first()
    await expect(uploadButton).toBeVisible({ timeout: 20000 })
    // 确保按钮可交互
    await expect(uploadButton).toBeEnabled({ timeout: 5000 })
    await uploadButton.click()
    
    // 验证上传弹窗打开
    const uploadDialog = page.locator('.el-dialog:has-text("上传射箭/箭靶视频")')
    await expect(uploadDialog).toBeVisible({ timeout: 5000 })
    
    // 测试：点击弹窗中的"取消"按钮
    const cancelButton = uploadDialog.locator('button:has-text("取消")')
    await expect(cancelButton).toBeVisible()
    await cancelButton.click()
    
    // 等待弹窗关闭
    await expect(uploadDialog).not.toBeVisible({ timeout: 3000 })

    // 测试：视频控制按钮（未上传视频时应该被禁用）
    const playButton = page.locator('button:has-text("播放")').first()
    const pauseButton = page.locator('button:has-text("暂停")').first()
    const prevFrameButton = page.locator('button:has-text("上一帧")').first()
    const nextFrameButton = page.locator('button:has-text("下一帧")').first()
    
    // 验证按钮存在（即使被禁用）
    await expect(playButton).toBeVisible({ timeout: 10000 })
    await expect(pauseButton).toBeVisible({ timeout: 10000 })
    await expect(prevFrameButton).toBeVisible({ timeout: 10000 })
    await expect(nextFrameButton).toBeVisible({ timeout: 10000 })
    
    // 验证按钮被禁用（因为未上传视频）
    await expect(playButton).toBeDisabled()
    await expect(pauseButton).toBeDisabled()
    await expect(prevFrameButton).toBeDisabled()
    await expect(nextFrameButton).toBeDisabled()
  })
})
