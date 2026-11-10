/**
 * @fileoverview 上传状态存储服务
 * @module modules/video/upload/services/upload-state-storage
 * @author HeZaoCha
 * @date 2026-01-11
 * @description 基于IndexedDB的上传状态持久化存储服务
 * @dependencies 无外部依赖，使用浏览器原生IndexedDB API
 */

export interface PersistentUploadState {
  /** 唯一标识符 */
  id: string
  /** 任务ID */
  taskId: string
  /** 文件名 */
  filename: string
  /** 文件大小（字节） */
  fileSize: number
  /** 上传进度（0-100） */
  progress: number
  /** 上传状态 */
  status: string
  /** 创建时间 */
  createdAt: Date
  /** 更新时间 */
  updatedAt: Date
  /** 重试次数 */
  retryCount: number
  /** 错误信息 */
  error?: string
  /** 元数据 */
  metadata: Record<string, unknown>
}

export class UploadStateStorage {
  private db: IDBDatabase | null = null
  private readonly dbName = 'aim-upload-states'
  private readonly version = 1

  /**
   * 初始化IndexedDB数据库
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'))
      }

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // 创建上传状态存储对象
        if (!db.objectStoreNames.contains('uploadStates')) {
          const store = db.createObjectStore('uploadStates', { keyPath: 'id' })

          // 创建索引
          store.createIndex('taskId', 'taskId', { unique: true })
          store.createIndex('status', 'status', { unique: false })
          store.createIndex('createdAt', 'createdAt', { unique: false })
          store.createIndex('updatedAt', 'updatedAt', { unique: false })
        }

        // 创建元数据存储对象
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' })
        }
      }
    })
  }

  /**
   * 保存上传状态
   * @param state 上传状态
   */
  async saveState(state: PersistentUploadState): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['uploadStates'], 'readwrite')
      const store = transaction.objectStore('uploadStates')

      const request = store.put({
        ...state,
        updatedAt: new Date(),
      })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to save upload state'))
    })
  }

  /**
   * 根据任务ID获取上传状态
   * @param taskId 任务ID
   * @returns 上传状态或null
   */
  async getState(taskId: string): Promise<PersistentUploadState | null> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['uploadStates'], 'readonly')
      const store = transaction.objectStore('uploadStates')
      const index = store.index('taskId')

      const request = index.get(taskId)

      request.onsuccess = () => {
        resolve(request.result || null)
      }

      request.onerror = () => reject(new Error('Failed to get upload state'))
    })
  }

  /**
   * 获取所有上传状态
   * @returns 上传状态数组
   */
  async getAllStates(): Promise<PersistentUploadState[]> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['uploadStates'], 'readonly')
      const store = transaction.objectStore('uploadStates')
      const request = store.getAll()

      request.onsuccess = () => {
        resolve(request.result || [])
      }

      request.onerror = () => reject(new Error('Failed to get all upload states'))
    })
  }

  /**
   * 删除上传状态
   * @param taskId 任务ID
   */
  async deleteState(taskId: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['uploadStates'], 'readwrite')
      const store = transaction.objectStore('uploadStates')
      const index = store.index('taskId')

      const getRequest = index.getKey(taskId)

      getRequest.onsuccess = () => {
        if (getRequest.result) {
          const deleteRequest = store.delete(getRequest.result)
          deleteRequest.onsuccess = () => resolve()
          deleteRequest.onerror = () => reject(new Error('Failed to delete upload state'))
        } else {
          resolve() // State doesn't exist, consider it deleted
        }
      }

      getRequest.onerror = () => reject(new Error('Failed to find upload state for deletion'))
    })
  }

  /**
   * 清除所有上传状态
   */
  async clearAllStates(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['uploadStates'], 'readwrite')
      const store = transaction.objectStore('uploadStates')
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to clear all upload states'))
    })
  }

  /**
   * 获取存储统计信息
   * @returns 统计信息
   */
  async getStorageStats(): Promise<{
    totalStates: number
    totalSize: number
    oldestState: Date | null
    newestState: Date | null
  }> {
    const states = await this.getAllStates()

    return {
      totalStates: states.length,
      totalSize: states.reduce((size, state) => size + this.calculateStateSize(state), 0),
      oldestState:
        states.length > 0
          ? new Date(Math.min(...states.map((s) => new Date(s.createdAt).getTime())))
          : null,
      newestState:
        states.length > 0
          ? new Date(Math.max(...states.map((s) => new Date(s.updatedAt).getTime())))
          : null,
    }
  }

  /**
   * 计算状态对象的大致大小
   * @param state 状态对象
   * @returns 大小（字节）
   */
  private calculateStateSize(state: PersistentUploadState): number {
    // 估算状态对象的大小（简化计算）
    const jsonString = JSON.stringify(state)
    return jsonString.length * 2 // 假设UTF-16编码
  }

  /**
   * 关闭数据库连接
   */
  async close(): Promise<void> {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }
}
