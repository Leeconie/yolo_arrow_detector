/**
 * @fileoverview 批量上传组合式函数
 * @module modules/video/upload/composables/useBatchUpload
 * @author HeZaoCha
 * @date 2026-01-11
 * @description 提供批量文件上传功能，支持并发控制、进度跟踪、错误重试等
 * @dependencies vue, @/core/api, ./types/uploadTypes
 */

import { reactive, computed, readonly } from 'vue'
import type { VideoType } from '../types/uploadTypes'
import { uploadVideoChunk, validateVideoFile } from '@/core/api'
import { logger } from '@/core/logger'

// 上传任务状态
export enum UploadTaskStatus {
  PENDING = 'pending',
  UPLOADING = 'uploading',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

// 上传任务
export interface UploadTask {
  id: string
  file: File
  status: UploadTaskStatus
  progress: number
  speed: number // bytes per second
  estimatedTime: number // seconds remaining
  retryCount: number
  error?: Error
  createdAt: Date
  updatedAt: Date
  chunks?: FileChunk[]
  videoType?: VideoType
}

// 文件分片
export interface FileChunk {
  id: string
  index: number
  data: Blob
  hash: string
  size: number
  uploaded: boolean
  uploadUrl?: string
}

// 批量上传配置
export interface BatchUploadConfig {
  maxConcurrent: number
  chunkSize: number
  retryAttempts: number
  retryDelay: number
  timeout: number
  autoStart: boolean
}

// 批量上传状态
export interface BatchUploadState {
  tasks: UploadTask[]
  activeUploads: number
  completedTasks: number
  failedTasks: number
  totalProgress: number
  averageSpeed: number
  estimatedTimeRemaining: number
  isRunning: boolean
  isPaused: boolean
}

// 默认配置
const DEFAULT_CONFIG: BatchUploadConfig = {
  maxConcurrent: 3,
  chunkSize: 1024 * 1024, // 1MB
  retryAttempts: 3,
  retryDelay: 1000,
  timeout: 30000,
  autoStart: true,
}

/**
 * 批量上传组合式函数
 */
export function useBatchUpload(config: Partial<BatchUploadConfig> = {}) {
  // 合并配置
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  // 响应式状态
  const state = reactive<BatchUploadState>({
    tasks: [],
    activeUploads: 0,
    completedTasks: 0,
    failedTasks: 0,
    totalProgress: 0,
    averageSpeed: 0,
    estimatedTimeRemaining: 0,
    isRunning: false,
    isPaused: false,
  })

  // 计算属性
  const totalTasks = computed(() => state.tasks.length)
  const pendingTasks = computed(() =>
    state.tasks.filter((task) => task.status === UploadTaskStatus.PENDING),
  )
  const uploadingTasks = computed(() =>
    state.tasks.filter((task) => task.status === UploadTaskStatus.UPLOADING),
  )
  const completedTasks = computed(() =>
    state.tasks.filter((task) => task.status === UploadTaskStatus.COMPLETED),
  )
  const failedTasks = computed(() =>
    state.tasks.filter((task) => task.status === UploadTaskStatus.FAILED),
  )

  /**
   * 添加文件到上传队列
   */
  function addFiles(files: File[], videoType?: VideoType): void {
    const validFiles = files.filter((file) => {
      try {
        validateVideoFile(file)
        return true
      } catch (error) {
        logger.warn('文件验证失败', {
          context: { module: 'useBatchUpload', function: 'addFiles' },
          data: {
            filename: file.name,
            error: error instanceof Error ? error.message : String(error),
          },
        })
        return false
      }
    })

    const newTasks: UploadTask[] = validFiles.map((file) => ({
      id: generateTaskId(),
      file,
      status: UploadTaskStatus.PENDING,
      progress: 0,
      speed: 0,
      estimatedTime: 0,
      retryCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      videoType,
    }))

    state.tasks.push(...newTasks)

    logger.info('添加文件到上传队列', {
      context: { module: 'useBatchUpload', function: 'addFiles' },
      data: { addedCount: newTasks.length, totalCount: state.tasks.length },
    })

    // 自动开始上传
    if (finalConfig.autoStart && !state.isRunning) {
      startBatch()
    }
  }

  /**
   * 开始批量上传
   */
  async function startBatch(): Promise<void> {
    if (state.isRunning || state.tasks.length === 0) return

    state.isRunning = true
    state.isPaused = false

    logger.info('开始批量上传', {
      context: { module: 'useBatchUpload', function: 'startBatch' },
      data: { taskCount: state.tasks.length, maxConcurrent: finalConfig.maxConcurrent },
    })

    try {
      await processBatch()
    } catch (error) {
      logger.error('批量上传失败', {
        context: { module: 'useBatchUpload', function: 'startBatch' },
        error: error instanceof Error ? error : new Error(String(error)),
      })
    }
  }

  /**
   * 暂停批量上传
   */
  function pauseBatch(): void {
    if (!state.isRunning) return

    state.isPaused = true
    state.isRunning = false

    // 暂停所有进行中的任务
    uploadingTasks.value.forEach((task) => {
      updateTaskStatus(task.id, UploadTaskStatus.PAUSED)
    })

    logger.info('暂停批量上传', {
      context: { module: 'useBatchUpload', function: 'pauseBatch' },
      data: { pausedCount: uploadingTasks.value.length },
    })
  }

  /**
   * 取消批量上传
   */
  function cancelBatch(): void {
    state.isRunning = false
    state.isPaused = false

    // 取消所有任务
    state.tasks.forEach((task) => {
      if (task.status === UploadTaskStatus.UPLOADING || task.status === UploadTaskStatus.PENDING) {
        updateTaskStatus(task.id, UploadTaskStatus.CANCELLED)
      }
    })

    logger.info('取消批量上传', {
      context: { module: 'useBatchUpload', function: 'cancelBatch' },
      data: {
        cancelledCount: state.tasks.filter((t) => t.status === UploadTaskStatus.CANCELLED).length,
      },
    })
  }

  /**
   * 移除任务
   */
  function removeTask(taskId: string): void {
    const index = state.tasks.findIndex((task) => task.id === taskId)
    if (index > -1) {
      const task = state.tasks[index]
      if (task) {
        const filename = task.file.name
        state.tasks.splice(index, 1)

        // 更新统计
        updateStatistics()

        logger.info('移除上传任务', {
          context: { module: 'useBatchUpload', function: 'removeTask' },
          data: { taskId, filename },
        })
      }
    }
  }

  /**
   * 重试失败的任务
   */
  function retryTask(taskId: string): void {
    const task = state.tasks.find((t) => t.id === taskId)
    if (task && task.status === UploadTaskStatus.FAILED) {
      updateTaskStatus(taskId, UploadTaskStatus.PENDING)
      if (state.isRunning && !state.isPaused) {
        processTask(task)
      }
    }
  }

  /**
   * 处理批量上传
   */
  async function processBatch(): Promise<void> {
    const semaphore = new Semaphore(finalConfig.maxConcurrent)

    while (state.isRunning && !state.isPaused) {
      const pendingTasks = state.tasks.filter((task) => task.status === UploadTaskStatus.PENDING)

      if (pendingTasks.length === 0) {
        // 检查是否还有进行中的任务
        const hasActiveTasks = state.tasks.some(
          (task) => task.status === UploadTaskStatus.UPLOADING,
        )

        if (!hasActiveTasks) {
          state.isRunning = false
          logger.info('批量上传完成', {
            context: { module: 'useBatchUpload', function: 'processBatch' },
            data: {
              totalTasks: totalTasks.value,
              completedTasks: completedTasks.value.length,
              failedTasks: failedTasks.value.length,
            },
          })
          break
        }

        // 等待一段时间后继续检查
        await delay(100)
        continue
      }

      // 并发处理任务
      const processPromises = pendingTasks
        .slice(0, finalConfig.maxConcurrent - state.activeUploads)
        .map(async (task) => {
          await semaphore.acquire()
          try {
            await processTask(task)
          } finally {
            semaphore.release()
          }
        })

      await Promise.allSettled(processPromises)

      // 更新统计
      updateStatistics()

      // 小延迟避免过度循环
      await delay(50)
    }
  }

  /**
   * 处理单个上传任务
   */
  async function processTask(task: UploadTask): Promise<void> {
    if (task.status !== UploadTaskStatus.PENDING) return

    updateTaskStatus(task.id, UploadTaskStatus.UPLOADING)
    state.activeUploads++

    try {
      const startTime = Date.now()

      // 创建文件分片
      const chunks = createFileChunks(task.file, finalConfig.chunkSize)
      task.chunks = chunks

      // 上传分片
      for (let i = 0; i < chunks.length; i++) {
        // 检查任务状态是否允许继续上传
        const currentStatus = task.status as UploadTaskStatus
        if (currentStatus === UploadTaskStatus.CANCELLED) {
          break
        }

        // 如果任务被暂停，等待恢复
        while ((task.status as UploadTaskStatus) === UploadTaskStatus.PAUSED) {
          await delay(1000) // 每秒检查一次
        }

        // 再次检查是否被取消
        if ((task.status as UploadTaskStatus) === UploadTaskStatus.CANCELLED) {
          break
        }

        const chunk = chunks[i]
        if (chunk) {
          await uploadChunkWithRetry(task, chunk, i)

          // 更新进度
          const progress = ((i + 1) / chunks.length) * 100
          updateTaskProgress(task.id, progress, startTime)
        }
      }

      // 检查最终状态
      const finalStatus = task.status as UploadTaskStatus
      if (finalStatus === UploadTaskStatus.UPLOADING) {
        updateTaskStatus(task.id, UploadTaskStatus.COMPLETED)

        logger.info('任务上传完成', {
          context: { module: 'useBatchUpload', function: 'processTask' },
          data: { taskId: task.id, filename: task.file.name, fileSize: task.file.size },
        })
      }
    } catch (error) {
      updateTaskStatus(
        task.id,
        UploadTaskStatus.FAILED,
        error instanceof Error ? error : new Error(String(error)),
      )

      logger.error('任务上传失败', {
        context: { module: 'useBatchUpload', function: 'processTask' },
        error: error instanceof Error ? error : new Error(String(error)),
        data: { taskId: task.id, filename: task.file.name },
      })
    } finally {
      state.activeUploads--
    }
  }

  /**
   * 上传分片（带重试）
   */
  async function uploadChunkWithRetry(
    task: UploadTask,
    chunk: FileChunk,
    chunkIndex: number,
  ): Promise<void> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= finalConfig.retryAttempts; attempt++) {
      try {
        await uploadVideoChunk({
          fileId: task.id,
          chunkIndex,
          chunkData: chunk.data,
          totalChunks: task.chunks!.length,
          videoType: task.videoType,
        })

        chunk.uploaded = true
        return
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        if (attempt < finalConfig.retryAttempts) {
          logger.warn('分片上传失败，重试中', {
            context: { module: 'useBatchUpload', function: 'uploadChunkWithRetry' },
            data: { taskId: task.id, chunkIndex, attempt: attempt + 1, error: lastError.message },
          })

          await delay(finalConfig.retryDelay * Math.pow(2, attempt)) // 指数退避
        }
      }
    }

    throw lastError || new Error('上传失败')
  }

  /**
   * 创建文件分片
   */
  function createFileChunks(file: File, chunkSize: number): FileChunk[] {
    const chunks: FileChunk[] = []
    const totalChunks = Math.ceil(file.size / chunkSize)

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize
      const end = Math.min(start + chunkSize, file.size)
      const chunkData = file.slice(start, end)

      chunks.push({
        id: `${file.name}-chunk-${i}`,
        index: i,
        data: chunkData,
        hash: '', // 实际实现中需要计算hash
        size: chunkData.size,
        uploaded: false,
      })
    }

    return chunks
  }

  /**
   * 更新任务状态
   */
  function updateTaskStatus(taskId: string, status: UploadTaskStatus, error?: Error): void {
    const task = state.tasks.find((t) => t.id === taskId)
    if (task) {
      task.status = status
      task.updatedAt = new Date()
      if (error) {
        task.error = error
      }
    }
  }

  /**
   * 更新任务进度
   */
  function updateTaskProgress(taskId: string, progress: number, startTime: number): void {
    const task = state.tasks.find((t) => t.id === taskId)
    if (task) {
      task.progress = progress
      task.updatedAt = new Date()

      // 计算速度和预计时间
      const elapsed = (Date.now() - startTime) / 1000
      if (elapsed > 0) {
        const uploadedBytes = (progress / 100) * task.file.size
        task.speed = uploadedBytes / elapsed

        if (task.speed > 0) {
          const remainingBytes = task.file.size - uploadedBytes
          task.estimatedTime = remainingBytes / task.speed
        }
      }
    }
  }

  /**
   * 更新统计信息
   */
  function updateStatistics(): void {
    state.completedTasks = completedTasks.value.length
    state.failedTasks = failedTasks.value.length
    state.activeUploads = uploadingTasks.value.length

    // 计算总体进度
    if (totalTasks.value > 0) {
      const totalProgress = state.tasks.reduce((sum, task) => sum + task.progress, 0)
      state.totalProgress = totalProgress / totalTasks.value
    }

    // 计算平均速度
    const activeTasks = uploadingTasks.value
    if (activeTasks.length > 0) {
      state.averageSpeed =
        activeTasks.reduce((sum, task) => sum + task.speed, 0) / activeTasks.length
    }

    // 计算预计剩余时间
    const remainingTasks = state.tasks.filter(
      (task) =>
        task.status === UploadTaskStatus.PENDING || task.status === UploadTaskStatus.UPLOADING,
    )

    if (remainingTasks.length > 0 && state.averageSpeed > 0) {
      const totalRemainingBytes = remainingTasks.reduce((sum, task) => {
        const remainingProgress = (100 - task.progress) / 100
        return sum + task.file.size * remainingProgress
      }, 0)

      state.estimatedTimeRemaining = totalRemainingBytes / state.averageSpeed
    }
  }

  /**
   * 生成任务ID
   */
  function generateTaskId(): string {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 工具函数
  function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  return {
    // 状态
    state: readonly(state),
    totalTasks,
    pendingTasks,
    uploadingTasks,
    completedTasks,
    failedTasks,

    // 方法
    addFiles,
    startBatch,
    pauseBatch,
    cancelBatch,
    removeTask,
    retryTask,

    // 配置
    config: readonly(finalConfig),
  }
}

/**
 * 信号量实现并发控制
 */
class Semaphore {
  private permits: number
  private waiting: Array<() => void> = []

  constructor(permits: number) {
    this.permits = permits
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--
      return
    }

    return new Promise((resolve) => {
      this.waiting.push(resolve)
    })
  }

  release(): void {
    this.permits++
    if (this.waiting.length > 0) {
      const resolve = this.waiting.shift()!
      this.permits--
      resolve()
    }
  }
}
