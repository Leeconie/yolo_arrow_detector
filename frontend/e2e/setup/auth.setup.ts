/**
 * 认证设置 - 在所有测试之前执行一次登录
 *
 * 这个脚本会：
 * 1. 登录到应用
 * 2. 保存认证状态（cookies, localStorage等）
 * 3. 其他测试将复用这个认证状态
 *
 * 符合 @test 规范
 *
 * 注意：使用Element Plus组件需要特定的选择器
 */

import { test as setup, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

// ES模块中获取__dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 认证状态保存路径
const authFile = path.join(__dirname, '../.auth/user.json')

// 测试账号
const TEST_USERNAME = 'zhangsan'
const TEST_PASSWORD = '123456'

setup('authenticate', async ({ page }) => {
  console.log('🔐 开始执行认证设置...')
  console.log(`📝 测试账号: ${TEST_USERNAME} / ${TEST_PASSWORD}`)

  // 1. 导航到登录页
  await page.goto('http://localhost:4000/login', {
    waitUntil: 'networkidle',
  })
  console.log('✅ 已导航到登录页')

  // 2. 等待登录卡片加载完成
  await page.waitForSelector('.login-card', {
    state: 'visible',
    timeout: 10000,
  })
  console.log('✅ 登录卡片已加载')

  // 3. 等待输入框渲染完成（Element Plus的input需要额外的等待）
  await page.waitForSelector('.el-input__inner', {
    state: 'visible',
    timeout: 10000,
  })
  console.log('✅ 输入框已渲染')

  // 4. 填写用户名（使用Element Plus的实际input选择器）
  const usernameInput = page.locator('.el-input__inner').first()
  await usernameInput.click() // 先点击激活输入框
  await usernameInput.fill(TEST_USERNAME)
  console.log(`✅ 已填写用户名: ${TEST_USERNAME}`)

  // 验证用户名是否填写成功
  const usernameValue = await usernameInput.inputValue()
  expect(usernameValue).toBe(TEST_USERNAME)
  console.log('✅ 验证用户名填写成功')

  // 5. 填写密码（第二个input是密码框）
  const passwordInput = page.locator('.el-input__inner').nth(1)
  await passwordInput.click() // 先点击激活输入框
  await passwordInput.fill(TEST_PASSWORD)
  console.log(`✅ 已填写密码: ${'*'.repeat(TEST_PASSWORD.length)}`)

  // 验证密码是否填写成功
  const passwordValue = await passwordInput.inputValue()
  expect(passwordValue).toBe(TEST_PASSWORD)
  console.log('✅ 验证密码填写成功')

  // 6. 截图保存登录前状态
  await page.screenshot({
    path: path.join(__dirname, '../test-results/auth-before-login.png'),
    fullPage: true,
  })
  console.log('📸 已保存登录前截图')

  // 7. 点击登录按钮
  const loginButton = page.locator('button.login-btn:has-text("登录")')
  await expect(loginButton).toBeVisible()
  console.log('✅ 找到登录按钮')

  // 8. 点击登录并等待导航或状态更新
  await loginButton.click()
  console.log('✅ 已点击登录按钮')

  // 9. 等待登录成功的多种可能标志
  try {
    // 方法1: 等待URL变化
    await page.waitForURL('**/home', { timeout: 15000 })
    console.log('✅ 已跳转到首页（URL方式）')
  } catch {
    // 方法2: 等待localStorage中的token
    console.log('⚠️ URL未变化，尝试检查token...')
    await page.waitForFunction(
      () => {
        return (
          localStorage.getItem('auth_token') !== null ||
          localStorage.getItem('user_token') !== null ||
          localStorage.getItem('token') !== null
        )
      },
      { timeout: 15000 },
    )
    console.log('✅ Token已设置')
  }

  // 10. 额外等待确保所有状态更新完成
  await page.waitForTimeout(2000)
  console.log('✅ 已等待状态更新完成')

  // 11. 截图保存登录后状态
  await page.screenshot({
    path: path.join(__dirname, '../test-results/auth-after-login.png'),
    fullPage: true,
  })
  console.log('📸 已保存登录后截图')

  // 12. 验证localStorage中的认证信息
  const authToken = await page.evaluate(() => {
    return (
      localStorage.getItem('auth_token') ||
      localStorage.getItem('user_token') ||
      localStorage.getItem('token') ||
      'NOT_FOUND'
    )
  })
  console.log(`🔑 Token状态: ${authToken !== 'NOT_FOUND' ? '已设置' : '未找到'}`)

  // 13. 保存认证状态
  await page.context().storageState({ path: authFile })
  console.log('✅ 认证状态已保存到:', authFile)

  // 14. 验证可以访问受保护的路由
  console.log('🔍 尝试访问受保护的路由...')
  await page.goto('http://localhost:4000/video/upload')
  await page.waitForTimeout(2000)

  // 检查是否被重定向回登录页
  const currentUrl = page.url()
  if (currentUrl.includes('/login')) {
    console.log('❌ 被重定向回登录页，认证可能失败')
    throw new Error('认证验证失败：无法访问受保护的路由')
  } else {
    console.log('✅ 可以访问受保护的路由')
  }

  console.log('🎉 认证设置完成！')
  console.log('📝 提示: 其他测试将自动使用保存的认证状态')
})
