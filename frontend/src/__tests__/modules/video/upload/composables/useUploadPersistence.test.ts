/**
 * @fileoverview 上传状态持久化组合式函数单元测试
 * @module __tests__/modules/video/upload/composables/useUploadPersistence.test
 * @author HeZaoCha
 * @date 2026-01-11
 * @description 测试useUploadPersistence组合式函数的功能
 * @dependencies vitest, @vue/test-utils, vue, jsdom
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { useUploadPersistence } from '@/modules/video/upload/composables/useUploadPersistence'

// Mock IndexedDB
const mockIndexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
}

// Mock global indexedDB
Object.defineProperty(window, 'indexedDB', {
  value: mockIndexedDB,
  writable: true,
})

describe('useUploadPersistence', () => {
  let mockDB: any
  let mockTransaction: any
  let mockStore: any

  beforeEach(() => {
    // 重置所有mock
    vi.clearAllMocks()

    // 创建mock数据库对象
    mockStore = {
      put: vi.fn().mockResolvedValue(undefined),
      getAll: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
      index: vi.fn().mockReturnValue({
        openCursor: vi.fn().mockReturnValue({
          onsuccess: null,
          onerror: null,
        }),
      }),
    }

    mockTransaction = {
      objectStore: vi.fn().mockReturnValue(mockStore),
    }

    mockDB = {
      transaction: vi.fn().mockReturnValue(mockTransaction),
      close: vi.fn(),
      objectStoreNames: {
        contains: vi.fn().mockReturnValue(false),
      },
      createObjectStore: vi.fn().mockReturnValue(mockStore),
    }

    // Mock IndexedDB open
    mockIndexedDB.open.mockReturnValue({
      onerror: null,
      onsuccess: null,
      onupgradeneeded: null,
      result: mockDB,
    })
  })

  afterEach(() => {
    // 清理可能的全局状态
    vi.restoreAllMocks()
  })

  describe('初始化', () => {
    it('应该正确初始化持久化管理器', async () => {
      const { isReady } = useUploadPersistence()

      // 等待初始化完成
      await flushPromises()

      expect(isReady.value).toBe(true)
    })

    it('应该处理IndexedDB初始化失败', async () => {
      mockIndexedDB.open.mockReturnValue({
        onerror: { error: new Error('IndexedDB error') },
        onsuccess: null,
        onupgradeneeded: null,
      })

      const { isReady } = useUploadPersistence()

      // 等待初始化完成
      await flushPromises()

      // 即使失败，isReady也应该是false
      expect(isReady.value).toBe(false)
    })
  })

  describe('状态保存', () => {
    it('应该成功保存上传状态', async () => {
      const { saveUploadState } = useUploadPersistence()

      await flushPromises()

      const testState = {
        id: 'test-task-1',
        fileName: 'test.mp4',
        fileSize: 1024 * 1024,
        progress: 50,
        status: 'uploading' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        retryCount: 0,
        error: undefined,
        chunksTotal: 10,
        chunksUploaded: 5,
      }

      await saveUploadState(testState)

      expect(mockStore.put).toHaveBeenCalledWith(testState)
    })

    it('应该处理保存失败', async () => {
      const { saveUploadState } = useUploadPersistence()

      await flushPromises()

      mockStore.put.mockRejectedValue(new Error('Save failed'))

      const testState = {
        id: 'test-task-1',
        fileName: 'test.mp4',
        fileSize: 1024 * 1024,
        progress: 50,
        status: 'uploading' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        retryCount: 0,
      }

      await expect(saveUploadState(testState)).rejects.toThrow('Save failed')
    })
  })

  describe('状态恢复', () => {
    it('应该成功恢复上传状态', async () => {
      const { restoreUploadStates } = useUploadPersistence()

      await flushPromises()

      const mockStates = [
        {
          id: 'task-1',
          fileName: 'video1.mp4',
          fileSize: 1024 * 1024,
          progress: 100,
          status: 'completed' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          retryCount: 0,
        },
      ]

      mockStore.getAll.mockResolvedValue(mockStates)

      const states = await restoreUploadStates()

      expect(states).toEqual(mockStates)
      expect(mockStore.getAll).toHaveBeenCalled()
    })

    it('应该处理恢复失败', async () => {
      const { restoreUploadStates } = useUploadPersistence()

      await flushPromises()

      mockStore.getAll.mockRejectedValue(new Error('Restore failed'))

      await expect(restoreUploadStates()).rejects.toThrow('Restore failed')
    })
  })

  describe('状态删除', () => {
    it('应该成功删除上传状态', async () => {
      const { deleteUploadState } = useUploadPersistence()

      await flushPromises()

      await deleteUploadState('test-task-1')

      expect(mockStore.delete).toHaveBeenCalledWith('test-task-1')
    })

    it('应该处理删除失败', async () => {
      const { deleteUploadState } = useUploadPersistence()

      await flushPromises()

      mockStore.delete.mockRejectedValue(new Error('Delete failed'))

      await expect(deleteUploadState('test-task-1')).rejects.toThrow('Delete failed')
    })
  })

  describe('存储管理', () => {
    it('应该计算存储大小', async () => {
      const { getStorageSize } = useUploadPersistence()

      await flushPromises()

      const mockStates = [
        {
          id: 'task-1',
          fileName: 'short.mp4',
          fileSize: 100,
          progress: 50,
          status: 'uploading' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          retryCount: 0,
        },
      ]

      mockStore.getAll.mockResolvedValue(mockStates)

      const size = await getStorageSize()

      expect(typeof size).toBe('number')
      expect(size).toBeGreaterThan(0)
    })

    it('应该清理过期状态', async () => {
      const { cleanupExpiredStates } = useUploadPersistence()

      await flushPromises()

      await cleanupExpiredStates(24 * 60 * 60 * 1000) // 1天

      expect(mockStore.index).toHaveBeenCalledWith('updatedAt')
    })
  })
})
