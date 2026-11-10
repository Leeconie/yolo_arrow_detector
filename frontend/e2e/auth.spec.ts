/**
 * @fileoverview 认证功能E2E测试
 * @module e2e/auth
 * @description 测试用户登录、注册等认证相关功能
 */

import { test, expect } from '@playwright/test'

test.describe('认证功能', () => {
  test.beforeEach(async ({ page }) => {
    // 清除localStorage，确保测试独立
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
    })
  })

  test.describe('登录功能', () => {
    test('应该显示登录页面', async ({ page }) => {
      await page.goto('/login')
      await expect(page.locator('.login-title')).toHaveText('用户登录')
      await expect(page.locator('input[placeholder="请输入用户名"]')).toBeVisible()
      await expect(page.locator('input[placeholder="请输入密码"]')).toBeVisible()
      await expect(page.locator('button:has-text("登录")')).toBeVisible()
    })

    test('应该显示表单验证错误', async ({ page }) => {
      await page.goto('/login')

      // 直接点击登录按钮，不填写表单
      await page.locator('button:has-text("登录")').click()

      // 等待表单验证错误提示
      // 使用waitFor而不是expect，避免条件expect
      const errorLocator = page.locator('.el-form-item__error').first()
      await errorLocator.waitFor({ state: 'visible', timeout: 2000 }).catch(() => {})

      // 检查是否有错误提示（Element Plus的表单验证）
      const errorMessages = await page.locator('.el-form-item__error').all()
      expect(errorMessages.length).toBeGreaterThan(0)
    })

    test('应该使用测试账号登录成功', async ({ page }) => {
      await page.goto('/login')

      // 填写测试账号（根据Login.vue中的TEST_ACCOUNT）
      await page.locator('input[placeholder="请输入用户名"]').fill('zhangsan')
      await page.locator('input[placeholder="请输入密码"]').fill('123456')

      // 点击登录按钮
      await page.locator('button:has-text("登录")').click()

      // 等待登录成功并跳转
      await page.waitForURL('**/home', { timeout: 5000 })

      // 验证已跳转到首页
      expect(page.url()).toContain('/home')
    })

    test('应该显示登录失败错误', async ({ page }) => {
      await page.goto('/login')

      // 填写错误的账号密码
      await page.locator('input[placeholder="请输入用户名"]').fill('wrong_user')
      await page.locator('input[placeholder="请输入密码"]').fill('wrong_password')

      // 点击登录按钮
      await page.locator('button:has-text("登录")').click()

      // 等待错误提示（Element Plus的ElMessage）
      // 使用first()避免strict mode violation（可能有多个消息）
      const errorMessage = page.locator('.el-message--error').first()
      await expect(errorMessage).toBeVisible({ timeout: 5000 })
    })

    test('应该跳转到注册页面', async ({ page }) => {
      await page.goto('/login')

      // 点击注册链接
      const registerLink = page.locator('text=立即注册')
      await registerLink.click()
      await page.waitForURL('**/register', { timeout: 3000 })
      expect(page.url()).toContain('/register')
    })
  })

  test.describe('注册功能', () => {
    test('应该显示注册页面', async ({ page }) => {
      await page.goto('/register')
      // 使用更精确的选择器，避免strict mode violation
      await expect(page.locator('.register-title')).toBeVisible()
    })

    test('应该显示注册表单验证错误', async ({ page }) => {
      await page.goto('/register')

      // 直接点击注册按钮，不填写表单
      const registerButton = page.locator('button:has-text("注册")')
      await registerButton.click()
      // 使用waitFor而不是expect，避免条件expect
      const errorLocator = page.locator('.el-form-item__error').first()
      await errorLocator.waitFor({ state: 'visible', timeout: 2000 }).catch(() => {})

      // 检查是否有错误提示
      const errorMessages = await page.locator('.el-form-item__error').all()
      expect(errorMessages.length).toBeGreaterThan(0)
    })
  })

  test.describe('路由守卫', () => {
    test('未登录用户访问受保护页面应该重定向到登录页', async ({ page }) => {
      // 清除localStorage确保未登录
      await page.goto('/')
      await page.evaluate(() => {
        localStorage.clear()
      })

      // 尝试访问需要认证的页面
      await page.goto('/home')

      // 应该被重定向到登录页
      await page.waitForURL('**/login**', { timeout: 3000 })
      expect(page.url()).toContain('/login')
    })

    test('登录后应该可以访问受保护页面', async ({ page }) => {
      // 先登录
      await page.goto('/login')
      await page.locator('input[placeholder="请输入用户名"]').fill('zhangsan')
      await page.locator('input[placeholder="请输入密码"]').fill('123456')
      await page.locator('button:has-text("登录")').click()

      // 等待登录成功
      await page.waitForURL('**/home', { timeout: 5000 })

      // 访问其他受保护页面
      await page.goto('/profile')
      await page.waitForLoadState('domcontentloaded')
      await expect(page.locator('body')).toBeVisible()

      // 应该能够访问，不会被重定向到登录页
      expect(page.url()).toContain('/profile')
    })
  })
})
