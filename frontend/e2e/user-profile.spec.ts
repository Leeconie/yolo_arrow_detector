/**
 * @fileoverview 用户个人中心E2E测试
 * @module e2e/user-profile
 * @description 测试用户个人中心相关功能
 */

import { test, expect } from '@playwright/test'

test.describe('用户个人中心', () => {
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

  test('应该显示个人中心页面', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForLoadState('domcontentloaded')
    
    // 验证页面已加载
    expect(page.url()).toContain('/profile')
    
    // 等待页面内容加载
    await expect(page.locator('body')).toBeVisible()
  })

  test('应该能够查看用户信息', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('body')).toBeVisible()
    
    // 验证页面有内容（根据UserProfile.vue的实际内容调整）
    const pageContent = page.locator('body')
    await expect(pageContent).toHaveText(/.+/, { timeout: 5000 }) // 至少包含一个字符
  })

  test('应该能够点击所有操作按钮', async ({ page }) => {
    // beforeEach已经登录，这里直接跳转到个人中心
    await page.goto('/profile')
    await page.waitForLoadState('domcontentloaded')
    
    // 等待页面完全加载（包括API调用和Vue渲染）
    await expect(page.locator('body')).toBeVisible()
    
    // 等待页面内容加载（验证页面有内容）
    const pageContent = page.locator('body')
    await expect(pageContent).toHaveText(/.+/, { timeout: 5000 }) // 至少包含一个字符
    
    // 直接等待操作按钮出现（使用Playwright推荐的locator方法）
    // 等待按钮完全渲染和可交互
    const buttonLocator = page.locator('button').first()
    await expect(buttonLocator).toBeVisible({ timeout: 20000 })
    
    // 使用locator查找按钮（Element Plus按钮可能无法被getByRole识别）
    const editInfoButton = page.locator('button:has-text("修改基础信息")').first()
    await expect(editInfoButton).toBeVisible({ timeout: 20000 })
    // 确保按钮可交互
    await expect(editInfoButton).toBeEnabled({ timeout: 5000 })
    await editInfoButton.click()
    
    // 验证弹窗打开
    const infoDialog = page.locator('.el-dialog:has-text("修改基础信息")')
    await expect(infoDialog).toBeVisible({ timeout: 5000 })
    
    // 测试：点击弹窗中的"取消"按钮
    const cancelButton = infoDialog.locator('button:has-text("取消")')
    await expect(cancelButton).toBeVisible()
    await cancelButton.click()
    
    // 等待弹窗关闭
    await expect(infoDialog).not.toBeVisible({ timeout: 3000 })

    // 测试：点击"修改密码"按钮
    const editPwdButton = page.locator('button:has-text("修改密码")').first()
    await expect(editPwdButton).toBeVisible({ timeout: 10000 })
    await editPwdButton.click()
    
    // 验证弹窗打开
    const pwdDialog = page.locator('.el-dialog:has-text("修改密码")')
    await expect(pwdDialog).toBeVisible({ timeout: 5000 })
    
    // 测试：点击弹窗中的"取消"按钮
    const pwdCancelButton = pwdDialog.locator('button:has-text("取消")')
    await expect(pwdCancelButton).toBeVisible()
    await pwdCancelButton.click()
    
    // 等待弹窗关闭
    await expect(pwdDialog).not.toBeVisible({ timeout: 3000 })

    // 测试：点击"返回首页"按钮
    const backHomeButton = page.locator('button:has-text("返回首页")').first()
    await expect(backHomeButton).toBeVisible({ timeout: 10000 })
    await backHomeButton.click()
    
    // 验证跳转到首页
    await page.waitForURL('**/home', { timeout: 3000 })
    expect(page.url()).toContain('/home')
  })
})
