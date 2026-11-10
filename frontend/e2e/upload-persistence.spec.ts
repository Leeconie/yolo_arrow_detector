/**
 * @fileoverview 上传状态持久化E2E测试
 * @module e2e/upload-persistence.spec
 * @author HeZaoCha
 * @date 2026-01-11
 * @description 测试上传状态持久化功能的端到端场景
 * @dependencies @playwright/test
 */

import { test, expect } from '@playwright/test'

test.describe('Upload State Persistence', () => {
  test.beforeEach(async ({ page }) => {
    // Clear IndexedDB before each test
    await page.addInitScript(() => {
      const deleteDB = indexedDB.deleteDatabase('aim-upload-states')
      return new Promise((resolve) => {
        deleteDB.onsuccess = () => resolve(void 0)
        deleteDB.onerror = () => resolve(void 0)
      })
    })

    await page.goto('/upload')
  })

  test('should persist upload state across page refreshes', async ({ page }) => {
    // Upload a file
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles([{
      name: 'test-video.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.from('fake video content')
    }])

    // Start upload
    await page.getByRole('button', { name: /开始上传/ }).click()

    // Wait for upload to start
    await page.waitForSelector('[data-testid="upload-item"]')

    // Refresh page
    await page.reload()

    // Check if upload state is restored
    const uploadItems = page.locator('[data-testid="upload-item"]')
    await expect(uploadItems).toHaveCount(1)

    // Verify file information is preserved
    await expect(page.getByText('test-video.mp4')).toBeVisible()
  })

  test('should handle persistence initialization failure gracefully', async ({ page }) => {
    // Mock IndexedDB to fail
    await page.addInitScript(() => {
      // Override indexedDB.open to simulate failure
      const originalOpen = indexedDB.open
      indexedDB.open = () => {
        const request = originalOpen.apply(indexedDB, arguments)
        request.onerror = () => {
          throw new Error('IndexedDB not available')
        }
        return request
      }
    })

    await page.goto('/upload')

    // Upload should still work without persistence
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles([{
      name: 'test-video.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.from('fake video content')
    }])

    // Should not show persistence-related errors
    await expect(page.getByText(/persistence|存储/i)).toHaveCount(0)
  })

  test('should clean up expired upload states', async ({ page }) => {
    // First, manually add old data to IndexedDB
    await page.addInitScript(() => {
      return new Promise((resolve) => {
        const request = indexedDB.open('aim-upload-states', 1)

        request.onupgradeneeded = (event) => {
          const db = event.target.result

          if (!db.objectStoreNames.contains('uploadStates')) {
            const store = db.createObjectStore('uploadStates', { keyPath: 'id' })
            store.createIndex('taskId', 'taskId', { unique: true })
          }
        }

        request.onsuccess = (event) => {
          const db = event.target.result
          const transaction = db.transaction(['uploadStates'], 'readwrite')
          const store = transaction.objectStore('uploadStates')

          // Add old state (8 days ago)
          const oldDate = new Date()
          oldDate.setDate(oldDate.getDate() - 8)

          store.put({
            id: 'old-state',
            taskId: 'old-task',
            filename: 'old-video.mp4',
            fileSize: 1024,
            progress: 50,
            status: 'uploading',
            createdAt: oldDate.toISOString(),
            updatedAt: oldDate.toISOString(),
            retryCount: 0,
            metadata: {}
          })

          transaction.oncomplete = () => resolve(void 0)
        }
      })
    })

    await page.goto('/upload')

    // Wait for persistence initialization and cleanup
    await page.waitForTimeout(1000)

    // Check that old state was not restored
    const uploadItems = page.locator('[data-testid="upload-item"]')
    await expect(uploadItems).toHaveCount(0)
  })

  test('should show storage usage information', async ({ page }) => {
    // Add some data first
    await page.addInitScript(() => {
      return new Promise((resolve) => {
        const request = indexedDB.open('aim-upload-states', 1)

        request.onupgradeneeded = (event) => {
          const db = event.target.result

          if (!db.objectStoreNames.contains('uploadStates')) {
            const store = db.createObjectStore('uploadStates', { keyPath: 'id' })
            store.createIndex('taskId', 'taskId', { unique: true })
          }
        }

        request.onsuccess = (event) => {
          const db = event.target.result
          const transaction = db.transaction(['uploadStates'], 'readwrite')
          const store = transaction.objectStore('uploadStates')

          // Add test states
          store.put({
            id: 'test-state-1',
            taskId: 'task-1',
            filename: 'video1.mp4',
            fileSize: 1024 * 1024, // 1MB
            progress: 100,
            status: 'completed',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            retryCount: 0,
            metadata: {}
          })

          store.put({
            id: 'test-state-2',
            taskId: 'task-2',
            filename: 'video2.mp4',
            fileSize: 2 * 1024 * 1024, // 2MB
            progress: 50,
            status: 'uploading',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            retryCount: 1,
            metadata: {}
          })

          transaction.oncomplete = () => resolve(void 0)
        }
      })
    })

    await page.goto('/upload')

    // Should show storage stats (this would be in a settings or info panel)
    // Note: Actual UI implementation would determine where this is displayed
    await expect(page.getByText(/存储|usage/i)).toBeVisible()
  })
})