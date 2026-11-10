/**
 * @fileoverview UploadStateStorage单元测试
 * @module modules/video/upload/services/__tests__/upload-state-storage.test
 * @author HeZaoCha
 * @date 2026-01-11
 * @description 测试IndexedDB存储服务的各项功能
 * @dependencies vitest, ../upload-state-storage
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { UploadStateStorage } from '../upload-state-storage'
import type { PersistentUploadState } from '../upload-state-storage'

// Mock IndexedDB
const mockIndexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
}

Object.defineProperty(window, 'indexedDB', {
  value: mockIndexedDB,
  writable: true,
})

describe('UploadStateStorage', () => {
  let storage: UploadStateStorage
  let mockDB: any

  beforeEach(() => {
    storage = new UploadStateStorage()

    // Mock database
    mockDB = {
      transaction: vi.fn().mockReturnValue({
        objectStore: vi.fn().mockReturnValue({
          put: vi.fn().mockReturnValue({
            onsuccess: null,
            onerror: null,
          }),
          get: vi.fn().mockReturnValue({
            onsuccess: null,
            onerror: null,
          }),
          getAll: vi.fn().mockReturnValue({
            onsuccess: null,
            onerror: null,
          }),
          delete: vi.fn().mockReturnValue({
            onsuccess: null,
            onerror: null,
          }),
          clear: vi.fn().mockReturnValue({
            onsuccess: null,
            onerror: null,
          }),
        }),
      }),
      close: vi.fn(),
    }

    mockIndexedDB.open.mockReturnValue({
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
      result: mockDB,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('init', () => {
    it('should initialize database successfully', async () => {
      const initPromise = storage.init()

      // Trigger success callback
      const request = mockIndexedDB.open.mock.results[0]!.value
      request.onsuccess({ target: { result: mockDB } })

      await expect(initPromise).resolves.toBeUndefined()
    })

    it('should handle initialization error', async () => {
      const initPromise = storage.init()

      // Trigger error callback
      const request = mockIndexedDB.open.mock.results[0]!.value
      request.onerror()

      await expect(initPromise).rejects.toThrow('Failed to open IndexedDB')
    })
  })

  describe('saveState', () => {
    beforeEach(async () => {
      await storage.init()
      const request = mockIndexedDB.open.mock.results[0]!.value
      request.onsuccess({ target: { result: mockDB } })
    })

    it('should save upload state successfully', async () => {
      const state: PersistentUploadState = {
        id: 'test-id',
        taskId: 'task-123',
        filename: 'test.mp4',
        fileSize: 1024,
        progress: 50,
        status: 'uploading',
        createdAt: new Date(),
        updatedAt: new Date(),
        retryCount: 0,
        metadata: {},
      }

      const savePromise = storage.saveState(state)

      // Trigger success callback
      const transaction = mockDB.transaction.mock.results[0]!.value
      const store = transaction.objectStore.mock.results[0]!.value
      const putRequest = store.put.mock.results[0]!.value
      putRequest.onsuccess()

      await expect(savePromise).resolves.toBeUndefined()
    })
  })

  describe('getState', () => {
    beforeEach(async () => {
      await storage.init()
      const request = mockIndexedDB.open.mock.results[0]!.value
      request.onsuccess({ target: { result: mockDB } })
    })

    it('should retrieve upload state successfully', async () => {
      const expectedState: PersistentUploadState = {
        id: 'test-id',
        taskId: 'task-123',
        filename: 'test.mp4',
        fileSize: 1024,
        progress: 50,
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
        retryCount: 0,
        metadata: {},
      }

      const getPromise = storage.getState('task-123')

      // Trigger success callback with mock data
      const transaction = mockDB.transaction.mock.results[0]!.value
      const store = transaction.objectStore.mock.results[0]!.value
      const index = store.index.mock.results[0]!.value
      const getRequest = index.get.mock.results[0]!.value
      getRequest.onsuccess({ target: { result: expectedState } })

      const result = await getPromise
      expect(result).toEqual(expectedState)
    })

    it('should return null when state not found', async () => {
      const getPromise = storage.getState('nonexistent-task')

      // Trigger success callback with null result
      const transaction = mockDB.transaction.mock.results[0]!.value
      const store = transaction.objectStore.mock.results[0]!.value
      const index = store.index.mock.results[0]!.value
      const getRequest = index.get.mock.results[0]!.value
      getRequest.onsuccess({ target: { result: null } })

      const result = await getPromise
      expect(result).toBeNull()
    })
  })

  describe('getAllStates', () => {
    beforeEach(async () => {
      await storage.init()
      const request = mockIndexedDB.open.mock.results[0]!.value
      request.onsuccess({ target: { result: mockDB } })
    })

    it('should retrieve all upload states', async () => {
      const expectedStates: PersistentUploadState[] = [
        {
          id: 'test-id-1',
          taskId: 'task-123',
          filename: 'test1.mp4',
          fileSize: 1024,
          progress: 50,
          status: 'completed',
          createdAt: new Date(),
          updatedAt: new Date(),
          retryCount: 0,
          metadata: {},
        },
        {
          id: 'test-id-2',
          taskId: 'task-456',
          filename: 'test2.mp4',
          fileSize: 2048,
          progress: 75,
          status: 'uploading',
          createdAt: new Date(),
          updatedAt: new Date(),
          retryCount: 1,
          metadata: {},
        },
      ]

      const getAllPromise = storage.getAllStates()

      // Trigger success callback with mock data
      const transaction = mockDB.transaction.mock.results[0]!.value
      const store = transaction.objectStore.mock.results[0]!.value
      const getAllRequest = store.getAll.mock.results[0]!.value
      getAllRequest.onsuccess({ target: { result: expectedStates } })

      const result = await getAllPromise
      expect(result).toEqual(expectedStates)
    })
  })

  describe('deleteState', () => {
    beforeEach(async () => {
      await storage.init()
      const request = mockIndexedDB.open.mock.results[0]!.value
      request.onsuccess({ target: { result: mockDB } })
    })

    it('should delete upload state successfully', async () => {
      const deletePromise = storage.deleteState('task-123')

      // Mock the index.getKey call
      const transaction = mockDB.transaction.mock.results[0]!.value
      const store = transaction.objectStore.mock.results[0]!.value
      const index = store.index.mock.results[0]!.value

      // First call: getKey
      const getKeyRequest = index.getKey.mock.results[0]!.value
      getKeyRequest.onsuccess({ target: { result: 'test-id' } })

      // Second call: delete
      const deleteRequest = store.delete.mock.results[0]!.value
      deleteRequest.onsuccess()

      await expect(deletePromise).resolves.toBeUndefined()
    })
  })

  describe('getStorageStats', () => {
    beforeEach(async () => {
      await storage.init()
      const request = mockIndexedDB.open.mock.results[0]!.value
      request.onsuccess({ target: { result: mockDB } })
    })

    it('should calculate storage statistics correctly', async () => {
      const mockStates: PersistentUploadState[] = [
        {
          id: 'test-id-1',
          taskId: 'task-123',
          filename: 'test.mp4',
          fileSize: 1024,
          progress: 50,
          status: 'completed',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
          retryCount: 0,
          metadata: {},
        },
      ]

      // Mock getAllStates to return our test data
      vi.spyOn(storage as any, 'getAllStates').mockResolvedValue(mockStates)

      const stats = await storage.getStorageStats()

      expect(stats.totalStates).toBe(1)
      expect(stats.totalSize).toBeGreaterThan(0)
      expect(stats.oldestState).toBeInstanceOf(Date)
      expect(stats.newestState).toBeInstanceOf(Date)
    })
  })
})
