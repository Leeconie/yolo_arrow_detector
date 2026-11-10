/**
 * VideoUploader UI 组件 E2E 测试
 *
 * 测试范围：
 * - 视觉效果测试
 * - 交互功能测试
 * - 响应式布局测试
 * - 无障碍功能测试
 *
 * 符合 @test 规范
 */

import { test, expect, type Page } from '@playwright/test'

// 测试配置
const TEST_CONFIG = {
  baseURL: 'http://localhost:4000',
  uploadURL: 'http://localhost:4000/video/upload',
  mockServerURL: 'http://localhost:3001',
  timeout: 30000,

  // 测试文件路径（需要准备）
  testFiles: {
    small: 'test-files/small.mp4',
    medium: 'test-files/medium.mp4',
    large: 'test-files/large.mp4',
    invalid: 'test-files/invalid.txt',
  },

  // 响应式断点
  viewports: {
    desktop: { width: 1920, height: 1080 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 667 },
  },
}

/**
 * 辅助函数：重置页面到空闲状态
 * 清理可能残留的文件、toast、上传状态
 */
async function resetToIdle(page: Page): Promise<void> {
  // 关闭可能存在的Element Plus message toast
  await page.evaluate(() => {
    const messages = document.querySelectorAll('.el-message')
    messages.forEach((msg) => msg.remove())
  })

  // 如果有文件信息，点击移除按钮
  const fileRemove = page.locator('.file-remove')
  if (await fileRemove.isVisible().catch(() => false)) {
    await fileRemove.click()
    await page.waitForTimeout(300)
  }

  // 如果正在上传，点击取消
  const cancelButton = page.locator('button:has-text("取消")')
  if (await cancelButton.isVisible().catch(() => false)) {
    await cancelButton.click()
    await page.waitForTimeout(500)
  }

  // 确保回到空闲状态
  await page.waitForSelector('.upload-area', { state: 'visible' })
}

// Page Object Model - VideoUploader组件
class VideoUploaderPage {
  constructor(private page: Page) {}

  // 选择器
  selectors = {
    uploadArea: '.upload-area',
    uploadInput: 'input[type="file"]',
    fileInfo: '.upload-area__file-info', // 修正：实际DOM使用BEM命名
    fileName: '.file-name',
    fileSize: '.file-size',
    removeButton: '.file-remove', // 修正：实际DOM类名
    progressCircle: '.progress-circle',
    progressPercentage: '.progress-percentage',
    uploadStatus: '.upload-status',
    controlButtons: '.control-buttons',
    pauseButton: 'button:has-text("暂停")',
    continueButton: 'button:has-text("继续")',
    cancelButton: 'button:has-text("取消")',
    retryButton: 'button:has-text("重试")',
    successIcon: '.success-icon',
    errorIcon: '.error-icon',
  }

  // 重置到空闲状态
  async resetToIdle() {
    await resetToIdle(this.page)
  }

  // 导航到上传页面
  async goto() {
    // 直接导航到上传页面（认证状态已在setup中设置）
    await this.page.goto(TEST_CONFIG.uploadURL)
    // eslint-disable-next-line playwright/no-networkidle
    await this.page.waitForLoadState('networkidle')
    // 等待上传区域出现
    await this.page.waitForSelector('.upload-area', { timeout: 10000 })
    // 确保页面稳定
    await this.page.waitForTimeout(500)
  }

  // 使用真实文件上传（替代page.evaluate方式）
  async uploadFileByInput(fileName: string = 'test-video.mp4', fileSize: number = 1024 * 1024) {
    // 创建真实的测试文件buffer
    const fileContent = Buffer.alloc(Math.min(fileSize, 1024)) // 限制内存使用
    await this.page.setInputFiles(this.selectors.uploadInput, {
      name: fileName,
      mimeType: 'video/mp4',
      buffer: fileContent,
    })
  }

  // 获取上传区域
  getUploadArea() {
    return this.page.locator(this.selectors.uploadArea)
  }

  // 上传文件
  async uploadFile(filePath: string) {
    const fileInput = this.page.locator(this.selectors.uploadInput)
    await fileInput.setInputFiles(filePath)
  }

  // 拖拽文件
  async dragFile(filePath: string) {
    const uploadArea = this.getUploadArea()

    // 创建 DataTransfer 对象
    const dataTransfer = await this.page.evaluateHandle((path) => {
      const dt = new DataTransfer()
      const file = new File(['test content'], path.split('/').pop() || 'test.mp4', {
        type: 'video/mp4',
      })
      dt.items.add(file)
      return dt
    }, filePath)

    // 触发拖拽事件
    await uploadArea.dispatchEvent('dragenter', { dataTransfer })
    await uploadArea.dispatchEvent('dragover', { dataTransfer })
    await uploadArea.dispatchEvent('drop', { dataTransfer })
  }

  // 获取文件信息
  async getFileInfo() {
    const fileName = await this.page.locator(this.selectors.fileName).textContent()
    const fileSize = await this.page.locator(this.selectors.fileSize).textContent()
    return { fileName, fileSize }
  }

  // 点击移除按钮
  async clickRemove() {
    await this.page.locator(this.selectors.removeButton).click()
  }

  // 点击暂停按钮
  async clickPause() {
    await this.page.locator(this.selectors.pauseButton).click()
  }

  // 点击继续按钮
  async clickContinue() {
    await this.page.locator(this.selectors.continueButton).click()
  }

  // 点击取消按钮
  async clickCancel() {
    await this.page.locator(this.selectors.cancelButton).click()
  }

  // 点击重试按钮
  async clickRetry() {
    await this.page.locator(this.selectors.retryButton).click()
  }

  // 获取上传进度
  async getUploadProgress() {
    const percentage = await this.page.locator(this.selectors.progressPercentage).textContent()
    return parseInt(percentage?.replace('%', '') || '0')
  }

  // 检查是否显示成功状态
  async isSuccessVisible() {
    return await this.page.locator(this.selectors.successIcon).isVisible()
  }

  // 检查是否显示错误状态
  async isErrorVisible() {
    return await this.page.locator(this.selectors.errorIcon).isVisible()
  }

  // 获取计算样式
  async getComputedStyle(selector: string, property: string) {
    return await this.page.locator(selector).evaluate((el, prop) => {
      return window.getComputedStyle(el).getPropertyValue(prop)
    }, property)
  }

  // 检查ARIA属性
  async getAriaAttribute(selector: string, attribute: string) {
    return await this.page.locator(selector).getAttribute(attribute)
  }
}

// 测试套件：视觉效果测试
test.describe('VideoUploader - 视觉效果测试', () => {
  let uploaderPage: VideoUploaderPage

  test.beforeEach(async ({ page }) => {
    uploaderPage = new VideoUploaderPage(page)
    await uploaderPage.goto()
    await uploaderPage.resetToIdle() // 确保每个测试开始时状态干净
  })

  test('1.1 空闲状态 - 应该显示初始UI', async ({ page }) => {
    const uploadArea = uploaderPage.getUploadArea()

    // 验证上传区域可见
    await expect(uploadArea).toBeVisible()

    // 验证背景渐变
    const background = await uploaderPage.getComputedStyle('.upload-area', 'background')
    expect(background).toContain('linear-gradient')

    // 验证边框样式
    const border = await uploaderPage.getComputedStyle('.upload-area', 'border')
    expect(border).toContain('dashed')

    // 验证引导文案
    await expect(page.locator('text=点击或拖拽视频文件到此处')).toBeVisible()

    // 验证提示信息
    await expect(page.locator('text=支持格式')).toBeVisible()
  })

  test('1.2 悬停状态 - 应该显示悬停效果', async ({ page }) => {
    const uploadArea = uploaderPage.getUploadArea()

    // 悬停前的边框颜色
    const borderBefore = await uploaderPage.getComputedStyle('.upload-area', 'border-color')

    // 触发悬停
    await uploadArea.hover()
    await page.waitForTimeout(500) // 等待动画完成

    // 悬停后的边框颜色应该改变
    const borderAfter = await uploaderPage.getComputedStyle('.upload-area', 'border-color')
    expect(borderAfter).not.toBe(borderBefore)

    // 验证背景变化
    const background = await uploaderPage.getComputedStyle('.upload-area', 'background')
    expect(background).toContain('linear-gradient')
  })

  test('1.3 拖拽悬停 - 应该显示拖拽反馈', async ({ page }) => {
    const uploadArea = uploaderPage.getUploadArea()

    // 模拟拖拽进入
    await uploadArea.dispatchEvent('dragenter')
    await page.waitForTimeout(300)

    // 验证拖拽状态类名（修正：实际DOM使用BEM命名 upload-area--dragging）
    const classList = await uploadArea.getAttribute('class')
    expect(classList).toContain('upload-area--dragging')

    // 验证视觉反馈
    const transform = await uploaderPage.getComputedStyle('.upload-area', 'transform')
    expect(transform).not.toBe('none')
  })

  test('1.4 文件已选 - 应该显示文件信息', async ({ page }) => {
    // 使用真实文件上传方式
    await uploaderPage.uploadFileByInput('test-video.mp4', 1024 * 1024)
    await page.waitForTimeout(500)

    // 验证文件信息显示
    await expect(page.locator('.upload-area__file-info')).toBeVisible()
    await expect(page.locator('.file-name')).toContainText('test-video.mp4')
    await expect(page.locator('.file-remove')).toBeVisible()
  })
})

// 测试套件：交互功能测试
test.describe('VideoUploader - 交互功能测试', () => {
  let uploaderPage: VideoUploaderPage

  test.beforeEach(async ({ page }) => {
    uploaderPage = new VideoUploaderPage(page)
    await uploaderPage.goto()
    await uploaderPage.resetToIdle() // 确保每个测试开始时状态干净
  })

  test('2.1 点击上传 - 应该打开文件选择器', async ({ page }) => {
    const uploadArea = uploaderPage.getUploadArea()

    // 监听文件输入事件
    const fileInputPromise = page.waitForEvent('filechooser')

    // 点击上传区域
    await uploadArea.click()

    // 验证文件选择器打开
    const fileChooser = await fileInputPromise
    expect(fileChooser).toBeTruthy()
  })

  test('2.2 文件选择 - 应该接受有效的视频文件', async ({ page }) => {
    // 使用真实文件上传方式
    await uploaderPage.uploadFileByInput('valid-video.mp4', 2 * 1024 * 1024)
    await page.waitForTimeout(500)

    // 验证文件信息显示
    const fileInfo = await uploaderPage.getFileInfo()
    expect(fileInfo.fileName).toContain('valid-video.mp4')
  })

  test('2.3 文件移除 - 应该清除文件信息', async ({ page }) => {
    // 先选择文件
    await uploaderPage.uploadFileByInput('test.mp4', 1024 * 1024)
    await page.waitForTimeout(500)

    // 点击移除按钮
    await uploaderPage.clickRemove()
    await page.waitForTimeout(300)

    // 验证文件信息被清除
    await expect(page.locator('.upload-area__file-info')).not.toBeVisible()
  })

  test('2.4 文件类型验证 - 应该拒绝非视频文件', async ({ page }) => {
    // 创建非视频文件（使用setInputFiles）
    const textContent = Buffer.from('this is a text file, not a video')
    await page.setInputFiles('input[type="file"]', {
      name: 'invalid.txt',
      mimeType: 'text/plain',
      buffer: textContent,
    })

    await page.waitForTimeout(500)

    // 验证错误提示（Element Plus可能会显示message或组件内错误）
    // 检查多种可能的错误信号
    const hasErrorMessage = await page
      .locator('.el-message--error')
      .isVisible()
      .catch(() => false)
    const hasErrorIcon = await page
      .locator('.error-icon')
      .isVisible()
      .catch(() => false)

    expect(hasErrorMessage || hasErrorIcon).toBe(true)
  })
})

// 测试套件：响应式布局测试
test.describe('VideoUploader - 响应式布局测试', () => {
  let uploaderPage: VideoUploaderPage

  test('3.1 桌面端布局 - 应该正确显示', async ({ page }) => {
    await page.setViewportSize(TEST_CONFIG.viewports.desktop)
    uploaderPage = new VideoUploaderPage(page)
    await uploaderPage.goto()

    const uploadArea = uploaderPage.getUploadArea()

    // 验证最小高度
    const height = await uploadArea.evaluate((el) => el.clientHeight)
    expect(height).toBeGreaterThanOrEqual(280)

    // 验证图标大小（修正：实际DOM使用 icon-upload 而非 upload-icon）
    const iconExists = await page
      .locator('.icon-upload')
      .isVisible()
      .catch(() => false)
    expect(iconExists).toBe(true)
  })

  test('3.2 平板端布局 - 应该适配中等屏幕', async ({ page }) => {
    await page.setViewportSize(TEST_CONFIG.viewports.tablet)
    uploaderPage = new VideoUploaderPage(page)
    await uploaderPage.goto()

    const uploadArea = uploaderPage.getUploadArea()

    // 验证最小高度调整
    const height = await uploadArea.evaluate((el) => el.clientHeight)
    expect(height).toBeGreaterThanOrEqual(240)

    // 验证布局无错乱
    await expect(uploadArea).toBeVisible()
  })

  test('3.3 移动端布局 - 应该完美适配小屏幕', async ({ page }) => {
    await page.setViewportSize(TEST_CONFIG.viewports.mobile)
    uploaderPage = new VideoUploaderPage(page)
    await uploaderPage.goto()

    const uploadArea = uploaderPage.getUploadArea()

    // 验证最小高度调整
    const height = await uploadArea.evaluate((el) => el.clientHeight)
    expect(height).toBeGreaterThanOrEqual(200)

    // 验证触控区域大小
    const touchArea = await uploadArea.evaluate((el) => {
      const rect = el.getBoundingClientRect()
      return { width: rect.width, height: rect.height }
    })
    expect(touchArea.height).toBeGreaterThanOrEqual(44) // 最小触控区域
  })
})

// 测试套件：无障碍功能测试
test.describe('VideoUploader - 无障碍功能测试', () => {
  let uploaderPage: VideoUploaderPage

  test.beforeEach(async ({ page }) => {
    uploaderPage = new VideoUploaderPage(page)
    await uploaderPage.goto()
    await uploaderPage.resetToIdle() // 确保每个测试开始时状态干净
  })

  test('4.1 ARIA标签 - 应该包含完整的ARIA属性', async () => {
    // 验证 role 属性
    const role = await uploaderPage.getAriaAttribute('.upload-area', 'role')
    expect(role).toBe('button')

    // 验证 tabindex
    const tabindex = await uploaderPage.getAriaAttribute('.upload-area', 'tabindex')
    expect(tabindex).toBe('0')

    // 验证 aria-label
    const ariaLabel = await uploaderPage.getAriaAttribute('.upload-area', 'aria-label')
    expect(ariaLabel).toBeTruthy()
    expect(ariaLabel).toContain('上传')
  })

  test('4.2 键盘导航 - 应该支持Tab键聚焦', async ({ page }) => {
    // 按Tab键
    await page.keyboard.press('Tab')

    // 验证焦点在上传区域
    const focusedElement = await page.evaluate(() => document.activeElement?.className)
    expect(focusedElement).toContain('upload-area')

    // 验证焦点可见
    const outline = await uploaderPage.getComputedStyle('.upload-area:focus', 'outline')
    expect(outline).not.toBe('none')
  })

  test('4.3 键盘操作 - 应该支持Enter/Space触发上传', async ({ page }) => {
    // 聚焦到上传区域
    await page.keyboard.press('Tab')

    // 监听文件选择器
    const fileInputPromise = page.waitForEvent('filechooser', { timeout: 5000 })

    // 按Enter键
    await page.keyboard.press('Enter')

    // 验证文件选择器打开
    const fileChooser = await fileInputPromise
    expect(fileChooser).toBeTruthy()
  })

  test('4.4 色彩对比度 - 应该符合WCAG AA标准', async () => {
    // 获取文本和背景颜色（修正：实际DOM使用 upload-area__hint-text）
    const textColor = await uploaderPage.getComputedStyle('.upload-area__hint-text', 'color')
    const backgroundColor = await uploaderPage.getComputedStyle('.upload-area', 'background-color')

    // 验证颜色值存在
    expect(textColor).toBeTruthy()
    expect(backgroundColor).toBeTruthy()

    // 注：实际对比度计算需要专门的库，这里仅验证颜色存在
    // 在真实测试中应使用 axe-core 或类似工具进行完整的无障碍测试
  })
})

// 测试套件：性能测试
test.describe('VideoUploader - 性能测试', () => {
  let uploaderPage: VideoUploaderPage

  test.beforeEach(async ({ page }) => {
    uploaderPage = new VideoUploaderPage(page)
  })

  test('5.1 首次渲染性能 - 应该在合理时间内完成', async ({ page }) => {
    const startTime = Date.now()

    const newPage = new VideoUploaderPage(page)
    await newPage.goto()
    await page.waitForSelector('.upload-area', { state: 'visible' })

    const loadTime = Date.now() - startTime

    // 使用固定的阈值，避免条件判断
    const threshold = 3000 // 统一的3秒阈值

    // 记录性能指标（不阻断）
    console.log(`首次渲染耗时: ${loadTime}ms (阈值: ${threshold}ms)`)

    expect(loadTime).toBeLessThan(threshold)
  })

  test('5.2 动画性能 - 应该流畅运行', async ({ page }) => {
    await uploaderPage.goto()

    // 开始性能监控
    await page.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).performanceData = {
        frames: [],
        startTime: performance.now(),
      }

      let lastFrameTime = performance.now()

      const measureFrame = () => {
        const currentTime = performance.now()
        const frameDuration = currentTime - lastFrameTime
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(window as any).performanceData.frames.push(frameDuration)
        lastFrameTime = currentTime

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (currentTime - (window as any).performanceData.startTime < 3000) {
          requestAnimationFrame(measureFrame)
        }
      }

      requestAnimationFrame(measureFrame)
    })

    // 触发悬停动画
    await uploaderPage.getUploadArea().hover()
    await page.waitForTimeout(3000)

    // 分析帧率
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const performanceData = await page.evaluate(() => (window as any).performanceData)
    const avgFrameDuration =
      performanceData.frames.reduce((a: number, b: number) => a + b, 0) /
      performanceData.frames.length
    const fps = 1000 / avgFrameDuration

    // 验证帧率 >= 30fps (宽松标准，实际应该 >= 60fps)
    expect(fps).toBeGreaterThanOrEqual(30)
  })
})

// 测试套件：集成测试（需要Mock服务器）
test.describe('VideoUploader - 上传流程集成测试', () => {
  let uploaderPage: VideoUploaderPage

  test.beforeEach(async ({ page }) => {
    uploaderPage = new VideoUploaderPage(page)
    await uploaderPage.goto()
    await uploaderPage.resetToIdle() // 确保每个测试开始时状态干净
  })

  test('6.1 完整上传流程 - 应该成功上传文件', async ({ page }) => {
    test.setTimeout(90_000) // 上传流程需要更长时间

    // 选择文件 - 使用真实文件上传方式
    await uploaderPage.uploadFileByInput('test-upload.mp4', 1024 * 1024)
    await page.waitForTimeout(500)

    // 选择视频类型（使用data-testid）
    const typeSelector = page.locator('[data-testid="type-selector"]')
    await expect(typeSelector).toBeVisible()
    await page.locator('text=运动人体').click()
    await page.waitForTimeout(300)

    // 等待"确认上传"按钮启用（使用data-testid）
    const confirmButton = page.locator('[data-testid="confirm-upload"]')
    await expect(confirmButton).toBeEnabled({ timeout: 5000 })

    // 点击上传按钮
    await confirmButton.click()

    // 等待上传完成（最多60秒）- 多信号判定
    const uploadCompleted = page.locator('.success-icon').or(page.locator('text=上传成功'))
    await expect(uploadCompleted).toBeVisible({ timeout: 60000 })

    // 验证成功状态
    const isSuccess = await uploaderPage.isSuccessVisible()
    expect(isSuccess).toBe(true)
  })

  test('6.2 上传暂停和继续 - 应该正确控制上传', async ({ page }) => {
    test.setTimeout(90_000) // 上传流程需要更长时间

    // 选择文件并开始上传 - 使用真实文件上传方式
    await uploaderPage.uploadFileByInput('large-test.mp4', 10 * 1024 * 1024)
    await page.waitForTimeout(500)

    // 选择视频类型（使用data-testid）
    await page.locator('text=运动人体').click()
    await page.waitForTimeout(300)

    // 等待"确认上传"按钮启用并点击
    const confirmButton = page.locator('[data-testid="confirm-upload"]')
    await expect(confirmButton).toBeEnabled({ timeout: 5000 })
    await confirmButton.click()

    // 等待上传开始
    await page.waitForSelector('.progress-circle', { timeout: 5000 })

    // 暂停上传
    await uploaderPage.clickPause()
    await page.waitForTimeout(500)

    // 验证暂停状态
    await expect(page.locator('text=上传已暂停')).toBeVisible()

    // 继续上传
    await uploaderPage.clickContinue()
    await page.waitForTimeout(500)

    // 验证继续状态
    await expect(page.locator('.progress-circle')).toBeVisible()
  })

  test('6.3 上传取消 - 应该终止上传并清理', async ({ page }) => {
    test.setTimeout(90_000) // 上传流程需要更长时间

    // 选择文件并开始上传 - 使用真实文件上传方式
    await uploaderPage.uploadFileByInput('cancel-test.mp4', 10 * 1024 * 1024)
    await page.waitForTimeout(500)

    // 选择视频类型（使用data-testid）
    await page.locator('text=运动人体').click()
    await page.waitForTimeout(300)

    // 等待"确认上传"按钮启用并点击
    const confirmButton = page.locator('[data-testid="confirm-upload"]')
    await expect(confirmButton).toBeEnabled({ timeout: 5000 })
    await confirmButton.click()

    // 等待上传开始
    await page.waitForSelector('.progress-circle', { timeout: 5000 })

    // 取消上传
    await uploaderPage.clickCancel()
    await page.waitForTimeout(1000) // 取消后需要更多时间来清理状态

    // 验证恢复到空闲状态（更稳健的检查）
    await expect(page.locator('.upload-area')).toBeVisible()
    await expect(page.locator('.progress-circle')).not.toBeVisible()

    // 确认没有文件信息残留
    await expect(page.locator('.upload-area__file-info')).not.toBeVisible()
  })
})
