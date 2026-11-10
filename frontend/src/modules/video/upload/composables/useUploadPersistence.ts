/**
 * @fileoverview 上传状态持久化组合式函数
 * @module modules/video/upload/composables/useUploadPersistence
 * @author HeZaoCha
 * @date 2026-01-11
 * @description 提供上传状态的本地持久化功能，支持IndexedDB存储和状态恢复
 * @dependencies vue, @/core/logger
 */

import { ref, readonly, onMounted, onUnmounted } from 'vue'
import { logger } from '@/core/logger'

// 持久化上传状态接口
export interface PersistentUploadState {
  id: string
  fileName: string
  fileSize: number
  progress: number
  status: 'pending' | 'uploading' | 'paused' | 'completed' | 'failed' | 'cancelled'
  createdAt: Date
  updatedAt: Date
  retryCount: number
  error?: string
  chunksTotal?: number
  chunksUploaded?: number
}

// IndexedDB配置
const DB_NAME = 'AIMeasureArchery_Uploads'
const DB_VERSION = 1
const STORE_NAME = 'uploadStates'

// 存储配额限制 (50MB)
const MAX_STORAGE_SIZE = 50 * 1024 * 1024

/**
 * 上传状态持久化管理器
 */
export class UploadPersistenceManager {
  private db: IDBDatabase | null = null
  private isInitialized = false
  private initPromise: Promise<void> | null = null

  /**
   * 初始化IndexedDB数据库
   */
  async init(): Promise<void> {
    if (this.isInitialized) return
    if (this.initPromise) return this.initPromise

    this.initPromise = this.initializeDatabase()
    await this.initPromise
    this.isInitialized = true

    logger.debug('上传状态持久化管理器已初始化', {
      context: { module: 'useUploadPersistence', function: 'init' },
    })
  }

  /**
   * 初始化数据库
   */
  private async initializeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        logger.error('IndexedDB初始化失败', {
          context: { module: 'useUploadPersistence', function: 'initializeDatabase' },
          error: request.error ? request.error : new Error('Unknown IndexedDB error'),
        })
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        logger.debug('IndexedDB连接成功', {
          context: { module: 'useUploadPersistence', function: 'initializeDatabase' },
        })
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        this.createObjectStore(db)
      }
    })
  }

  /**
   * 创建对象存储
   */
  private createObjectStore(db: IDBDatabase): void {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })

      // 创建索引以提高查询性能
      store.createIndex('status', 'status', { unique: false })
      store.createIndex('createdAt', 'createdAt', { unique: false })
      store.createIndex('updatedAt', 'updatedAt', { unique: false })

      logger.debug('IndexedDB对象存储已创建', {
        context: { module: 'useUploadPersistence', function: 'createObjectStore' },
      })
    }
  }

  /**
   * 保存上传状态
   */
  async saveUploadState(state: PersistentUploadState): Promise<void> {
    if (!this.isInitialized) await this.init()

    if (!this.db) {
      throw new Error('数据库未初始化')
    }

    // 检查存储大小限制
    const currentSize = await this.getStorageSize()
    if (currentSize + this.estimateStateSize(state) > MAX_STORAGE_SIZE) {
      // 清理过期状态
      await this.cleanupExpiredStates()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      // 更新时间戳
      state.updatedAt = new Date()

      const request = store.put(state)

      request.onsuccess = () => {
        logger.debug('上传状态已保存', {
          context: { module: 'useUploadPersistence', function: 'saveUploadState' },
          data: { taskId: state.id, status: state.status, progress: state.progress },
        })
        resolve()
      }

      request.onerror = () => {
        logger.error('保存上传状态失败', {
          context: { module: 'useUploadPersistence', function: 'saveUploadState' },
          error: request.error ? request.error : new Error('Unknown IndexedDB error'),
          data: { taskId: state.id },
        })
        reject(request.error)
      }
    })
  }

  /**
   * 恢复上传状态
   */
  async restoreUploadStates(): Promise<PersistentUploadState[]> {
    if (!this.isInitialized) await this.init()

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'))
        return
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => {
        const states = request.result as PersistentUploadState[]
        logger.debug('上传状态已恢复', {
          context: { module: 'useUploadPersistence', function: 'restoreUploadStates' },
          data: { count: states.length },
        })
        resolve(states)
      }

      request.onerror = () => {
        logger.error('恢复上传状态失败', {
          context: { module: 'useUploadPersistence', function: 'restoreUploadStates' },
          error: request.error ? request.error : new Error('Unknown IndexedDB error'),
        })
        reject(request.error)
      }
    })
  }

  /**
   * 删除上传状态
   */
  async deleteUploadState(taskId: string): Promise<void> {
    if (!this.isInitialized) await this.init()

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'))
        return
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(taskId)

      request.onsuccess = () => {
        logger.debug('上传状态已删除', {
          context: { module: 'useUploadPersistence', function: 'deleteUploadState' },
          data: { taskId },
        })
        resolve()
      }

      request.onerror = () => {
        logger.error('删除上传状态失败', {
          context: { module: 'useUploadPersistence', function: 'deleteUploadState' },
          error: request.error ? request.error : new Error('Unknown IndexedDB error'),
          data: { taskId },
        })
        reject(request.error)
      }
    })
  }

  /**
   * 清理过期状态（默认7天前）
   */
  async cleanupExpiredStates(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    if (!this.isInitialized) await this.init()

    const cutoffDate = new Date(Date.now() - maxAge)

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'))
        return
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index('updatedAt')
      const range = IDBKeyRange.upperBound(cutoffDate)
      const request = index.openCursor(range)

      let deletedCount = 0

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          cursor.delete()
          deletedCount++
          cursor.continue()
        } else {
          logger.debug('过期状态清理完成', {
            context: { module: 'useUploadPersistence', function: 'cleanupExpiredStates' },
            data: { deletedCount, cutoffDate: cutoffDate.toISOString() },
          })
          resolve()
        }
      }

      request.onerror = () => {
        logger.error('清理过期状态失败', {
          context: { module: 'useUploadPersistence', function: 'cleanupExpiredStates' },
          error: request.error ? request.error : new Error('Unknown IndexedDB error'),
        })
        reject(request.error)
      }
    })
  }

  /**
   * 清空所有状态
   */
  async clearAllStates(): Promise<void> {
    if (!this.isInitialized) await this.init()

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'))
        return
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()

      request.onsuccess = () => {
        logger.debug('所有上传状态已清空', {
          context: { module: 'useUploadPersistence', function: 'clearAllStates' },
        })
        resolve()
      }

      request.onerror = () => {
        logger.error('清空上传状态失败', {
          context: { module: 'useUploadPersistence', function: 'clearAllStates' },
          error: request.error ? request.error : new Error('Unknown IndexedDB error'),
        })
        reject(request.error)
      }
    })
  }

  /**
   * 获取存储使用大小
   */
  async getStorageSize(): Promise<number> {
    if (!this.isInitialized) await this.init()

    return new Promise((resolve) => {
      if (!this.db) {
        resolve(0)
        return
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => {
        const states = request.result as PersistentUploadState[]
        const totalSize = states.reduce((size, state) => {
          return size + this.estimateStateSize(state)
        }, 0)
        resolve(totalSize)
      }

      request.onerror = () => {
        resolve(0)
      }
    })
  }

  /**
   * 估算状态大小
   */
  private estimateStateSize(state: PersistentUploadState): number {
    const jsonString = JSON.stringify(state)
    return jsonString.length * 2 // UTF-16每个字符2字节
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    if (this.db) {
      this.db.close()
      this.db = null
      this.isInitialized = false
      this.initPromise = null

      logger.debug('IndexedDB连接已关闭', {
        context: { module: 'useUploadPersistence', function: 'close' },
      })
    }
  }
}

// 全局实例
let globalPersistenceManager: UploadPersistenceManager | null = null

/**
 * 获取全局持久化管理器实例
 */
function getPersistenceManager(): UploadPersistenceManager {
  if (!globalPersistenceManager) {
    globalPersistenceManager = new UploadPersistenceManager()
  }
  return globalPersistenceManager
}

/**
 * 上传状态持久化组合式函数
 */
export function useUploadPersistence() {
  const manager = getPersistenceManager()
  const isReady = ref(false)

  // 初始化
  onMounted(async () => {
    try {
      await manager.init()
      isReady.value = true

      logger.debug('上传状态持久化已启用', {
        context: { module: 'useUploadPersistence', function: 'useUploadPersistence' },
      })
    } catch (error) {
      logger.error('上传状态持久化初始化失败', {
        context: { module: 'useUploadPersistence', function: 'useUploadPersistence' },
        error: error instanceof Error ? error : new Error(String(error)),
      })
    }
  })

  // 清理
  onUnmounted(() => {
    manager.close()
  })

  return {
    // 状态
    isReady: readonly(isReady),

    // 方法
    saveUploadState: (state: PersistentUploadState) => manager.saveUploadState(state),
    restoreUploadStates: () => manager.restoreUploadStates(),
    deleteUploadState: (taskId: string) => manager.deleteUploadState(taskId),
    cleanupExpiredStates: (maxAge?: number) => manager.cleanupExpiredStates(maxAge),
    clearAllStates: () => manager.clearAllStates(),
    getStorageSize: () => manager.getStorageSize(),
  }
}
