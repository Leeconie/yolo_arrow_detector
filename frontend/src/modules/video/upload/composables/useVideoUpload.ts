/**
 * @fileoverview 视频上传组合式函数
 * @module modules/video/upload/composables/useVideoUpload
 * @description 提供视频文件分片上传、断点续传、进度监控等核心功能
 * @author HeZaoCha
 * @date 2026-01-10
 * @dependencies vue, ./api/uploadApi, ./types/uploadTypes, @/utils/storage
 */

import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { uploadVideoChunk, validateVideo } from '../api/uploadApi'
import {
  UploadStatus,
  type UploadTask,
  type UploadConfig,
  type UploadCallbacks,
  type ChunkInfo,
  type VideoType,
} from '../types/uploadTypes'
import { getStorage, setStorage, removeStorage } from '@/utils/storage'
import { validateFileName } from '@/utils/file-validation' // 导入文件验证工具
import { logger } from '@/core/logger' // 导入logger

/**
 * 默认上传配置
 */
const DEFAULT_CONFIG: Required<UploadConfig> = {
  chunkSize: 5 * 1024 * 1024, // 5MB (将根据文件大小动态调整)
  maxSize: 512 * 1024 * 1024, // 512MB
  allowedFormats: ['mp4', 'avi', 'mov', 'mkv'],
  enableResume: true,
  retryCount: 3,
  retryDelay: 1000,
  concurrency: 3,
}

/**
 * 根据文件大小计算合适的分片大小
 * @param fileSize 文件大小（字节）
 * @returns 分片大小（字节）
 */
function calculateOptimalChunkSize(fileSize: number): number {
  // 小文件（< 50MB）：使用 5MB 分片
  if (fileSize < 50 * 1024 * 1024) {
    return 5 * 1024 * 1024 // 5MB
  }
  // 中等文件（50-200MB）：使用 10MB 分片
  if (fileSize < 200 * 1024 * 1024) {
    return 10 * 1024 * 1024 // 10MB
  }
  // 大文件（>= 200MB）：使用 20MB 分片
  return 20 * 1024 * 1024 // 20MB
}

/**
 * 存储键前缀（用于localStorage）
 */
const STORAGE_PREFIX = 'video_upload_task_'

/**
 * 生成任务ID（基于文件hash或时间戳）
 */
function generateTaskId(file: File): string {
  // 使用文件名+大小+修改时间生成唯一ID
  // 实际项目中可以使用文件hash（如MD5）生成更可靠的ID
  return `${file.name}_${file.size}_${file.lastModified}`
}

/**
 * 计算文件分片信息
 */
function calculateChunks(file: File, chunkSize: number): ChunkInfo[] {
  const chunks: ChunkInfo[] = []
  const totalChunks = Math.ceil(file.size / chunkSize)

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize
    const end = Math.min(start + chunkSize, file.size)
    chunks.push({
      index: i,
      start,
      end,
      size: end - start,
      uploaded: false,
    })
  }

  return chunks
}

/**
 * 从localStorage恢复上传任务
 */
function restoreTaskFromStorage(taskId: string): UploadTask | null {
  const stored = getStorage<UploadTask>(`${STORAGE_PREFIX}${taskId}`)
  if (!stored) {
    return null
  }

  // 验证任务是否过期（超过24小时的任务视为过期）
  const maxAge = 24 * 60 * 60 * 1000 // 24小时
  if (Date.now() - stored.createdAt > maxAge) {
    removeStorage(`${STORAGE_PREFIX}${taskId}`)
    return null
  }

  return stored
}

/**
 * 保存任务到localStorage
 */
function saveTaskToStorage(task: UploadTask): void {
  setStorage(`${STORAGE_PREFIX}${task.taskId}`, task, 24 * 60 * 60) // 24小时过期
}

/**
 * 删除任务存储
 */
function removeTaskFromStorage(taskId: string): void {
  removeStorage(`${STORAGE_PREFIX}${taskId}`)
}

/**
 * 计算上传速度
 */
function calculateSpeed(loaded: number, startTime: number): number {
  const elapsed = (Date.now() - startTime) / 1000 // 秒
  return elapsed > 0 ? loaded / elapsed : 0
}

/**
 * 计算剩余时间
 */
function calculateRemainingTime(loaded: number, total: number, speed: number): number {
  if (speed <= 0) {
    return 0
  }
  const remaining = total - loaded
  return Math.ceil(remaining / speed)
}

/**
 * 视频上传组合式函数
 * @param config 上传配置选项
 * @param callbacks 上传事件回调
 * @returns 上传相关的状态和方法
 * @example
 * ```typescript
 * const { upload, pause, resume, cancel, currentTask } = useVideoUpload({
 *   chunkSize: 5 * 1024 * 1024, // 将根据文件大小动态调整
 *   maxSize: 512 * 1024 * 1024 // 512MB
 * }, {
 *   onProgress: (task, progress) => {
 *     console.log(`上传进度: ${progress.percentage}%`)
 *   },
 *   onSuccess: (task, videoId) => {
 *     console.log(`上传成功，视频ID: ${videoId}`)
 *   }
 * })
 * ```
 */
export function useVideoUpload(config: UploadConfig = {}, callbacks: UploadCallbacks = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  const currentTask = ref<UploadTask | null>(null)
  const isUploading = computed(() => currentTask.value?.status === UploadStatus.UPLOADING)

  /**
   * 校验视频文件
   */
  async function validateFile(file: File): Promise<boolean> {
    // 1. 文件名验证（防止路径遍历攻击）
    const fileNameValidation = validateFileName(file.name)
    if (!fileNameValidation.valid) {
      ElMessage.error(fileNameValidation.message || '文件名不合法')
      logger.warn('文件名验证失败', {
        context: {
          module: 'video.upload',
          function: 'validateFile',
        },
        data: {
          fileName: file.name,
          reason: fileNameValidation.message,
        },
      })
      return false
    }

    // 2. 格式校验
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    if (!fileExt || !finalConfig.allowedFormats.includes(fileExt)) {
      ElMessage.error(`文件格式不支持！仅支持 ${finalConfig.allowedFormats.join('、')} 格式`)
      return false
    }

    // 3. 大小校验
    if (file.size > finalConfig.maxSize) {
      ElMessage.error(`文件大小超出限制！最大支持 ${finalConfig.maxSize / 1024 / 1024}MB`)
      return false
    }

    // 调用后端校验接口（可选）
    try {
      const result = await validateVideo({
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || `video/${fileExt}`,
      })

      if (!result.valid) {
        ElMessage.error(result.message || '文件校验失败')
        return false
      }
    } catch (error) {
      // 如果后端校验失败，仅记录错误，不阻止上传（允许前端校验通过即可）
      // 使用动态导入避免循环依赖
      import('@/core/logger').then(({ logger }) => {
        logger.warn('后端校验失败，使用前端校验结果', {
          context: {
            module: 'video.upload',
            function: 'validateFile',
          },
          error: error instanceof Error ? error : new Error(String(error)),
        })
      })
    }

    return true
  }

  /**
   * 创建上传任务
   */
  function createTask(file: File): UploadTask {
    const taskId = generateTaskId(file)
    // 根据文件大小动态计算分片大小
    const optimalChunkSize = calculateOptimalChunkSize(file.size)
    const chunks = calculateChunks(file, optimalChunkSize)

    const task: UploadTask = {
      taskId,
      file,
      status: UploadStatus.PENDING,
      progress: {
        loaded: 0,
        total: file.size,
        percentage: 0,
        speed: 0,
        remainingTime: 0,
      },
      chunks,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    // 尝试从localStorage恢复任务（断点续传）
    if (finalConfig.enableResume) {
      const restored = restoreTaskFromStorage(taskId)
      if (restored && restored.chunks.some((chunk) => chunk.uploaded)) {
        // 恢复已上传的分片信息
        task.chunks = restored.chunks
        task.progress.loaded = restored.chunks
          .filter((chunk) => chunk.uploaded)
          .reduce((sum, chunk) => sum + chunk.size, 0)
        task.progress.percentage = (task.progress.loaded / task.progress.total) * 100
        task.videoId = restored.videoId
      }
    }

    return task
  }

  /**
   * 上传单个分片
   */
  async function uploadChunk(task: UploadTask, chunk: ChunkInfo, retryCount = 0): Promise<void> {
    if (!task.videoId) {
      throw new Error('视频ID未生成，无法上传分片')
    }

    const chunkBlob = task.file.slice(chunk.start, chunk.end)

    try {
      await uploadVideoChunk({
        videoId: task.videoId,
        file: chunkBlob,
        chunkIndex: chunk.index,
        totalChunks: task.chunks.length,
        totalSize: task.file.size,
        fileName: task.file.name,
        fileType: task.file.type || 'video/mp4',
      })

      // 标记分片已上传
      chunk.uploaded = true
      task.updatedAt = Date.now()
      saveTaskToStorage(task)

      // 触发分片上传成功回调
      callbacks.onChunkSuccess?.(task, chunk.index)
    } catch (error) {
      // 重试逻辑
      if (retryCount < finalConfig.retryCount) {
        await new Promise((resolve) => setTimeout(resolve, finalConfig.retryDelay))
        return uploadChunk(task, chunk, retryCount + 1)
      }

      throw error
    }
  }

  /**
   * 更新上传进度
   */
  function updateProgress(task: UploadTask, startTime: number): void {
    const loaded = task.chunks
      .filter((chunk) => chunk.uploaded)
      .reduce((sum, chunk) => sum + chunk.size, 0)

    const speed = calculateSpeed(loaded, startTime)
    const remainingTime = calculateRemainingTime(loaded, task.progress.total, speed)
    const percentage = (loaded / task.progress.total) * 100

    task.progress = {
      loaded,
      total: task.progress.total,
      percentage: Math.min(percentage, 100),
      speed,
      remainingTime,
    }

    task.updatedAt = Date.now()
    saveTaskToStorage(task)

    // 触发进度更新回调
    callbacks.onProgress?.(task, task.progress)
  }

  /**
   * 上传文件
   * @param file 要上传的文件
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function upload(file: File, _videoType?: VideoType): Promise<string> {
    // 校验文件
    const isValid = await validateFile(file)
    if (!isValid) {
      throw new Error('文件校验失败')
    }

    // 创建上传任务
    const task = createTask(file)
    currentTask.value = task
    task.status = UploadStatus.UPLOADING

    // 生成视频ID（如果还没有）
    if (!task.videoId) {
      // 实际项目中应该调用后端接口生成videoId
      // 这里使用临时ID，上传第一个分片后服务器会返回真实ID
      task.videoId = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`
    }

    saveTaskToStorage(task)
    callbacks.onStart?.(task)

    const startTime = Date.now()
    const pendingChunks = task.chunks.filter((chunk) => !chunk.uploaded)
    const totalChunks = pendingChunks.length

    try {
      // 并发上传分片
      const uploadPromises: Promise<void>[] = []
      let currentIndex = 0

      // 使用并发控制
      while (currentIndex < totalChunks || uploadPromises.length > 0) {
        // 启动新的上传任务（不超过并发数）
        while (uploadPromises.length < finalConfig.concurrency && currentIndex < totalChunks) {
          const chunk = pendingChunks[currentIndex]
          if (!chunk) {
            currentIndex++
            continue
          }
          const promise = uploadChunk(task, chunk)
            .then(() => {
              updateProgress(task, startTime)
            })
            .catch((error) => {
              throw error
            })
            .finally(() => {
              // 从promises数组中移除
              const index = uploadPromises.indexOf(promise)
              if (index > -1) {
                uploadPromises.splice(index, 1)
              }
            })

          uploadPromises.push(promise)
          currentIndex++
        }

        // 等待至少一个任务完成
        if (uploadPromises.length > 0) {
          await Promise.race(uploadPromises)
        }
      }

      // 所有分片上传完成
      if (task.chunks.every((chunk) => chunk.uploaded)) {
        task.status = UploadStatus.SUCCESS
        task.updatedAt = Date.now()

        // 清理存储
        removeTaskFromStorage(task.taskId)

        // 触发成功回调
        callbacks.onSuccess?.(task, task.videoId!)

        return task.videoId!
      } else {
        throw new Error('部分分片上传失败')
      }
    } catch (error) {
      task.status = UploadStatus.FAILED
      task.error = error instanceof Error ? error.message : String(error)
      task.updatedAt = Date.now()
      saveTaskToStorage(task)

      // 触发错误回调
      callbacks.onError?.(task, error instanceof Error ? error : new Error(String(error)))

      throw error
    }
  }

  /**
   * 暂停上传
   */
  function pause(): void {
    if (currentTask.value && currentTask.value.status === UploadStatus.UPLOADING) {
      currentTask.value.status = UploadStatus.PAUSED
      currentTask.value.updatedAt = Date.now()
      saveTaskToStorage(currentTask.value)
      callbacks.onPause?.(currentTask.value)
    }
  }

  /**
   * 恢复上传
   */
  async function resume(): Promise<string | void> {
    if (!currentTask.value || currentTask.value.status !== UploadStatus.PAUSED) {
      return
    }

    currentTask.value.status = UploadStatus.UPLOADING
    callbacks.onResume?.(currentTask.value)

    try {
      return await upload(currentTask.value.file)
    } catch (error) {
      // 错误已在upload函数中处理
      throw error
    }
  }

  /**
   * 取消上传
   */
  function cancel(): void {
    if (currentTask.value) {
      currentTask.value.status = UploadStatus.FAILED
      currentTask.value.error = '用户取消上传'
      currentTask.value.updatedAt = Date.now()

      // 清理存储
      removeTaskFromStorage(currentTask.value.taskId)
      currentTask.value = null
    }
  }

  /**
   * 清除当前任务
   */
  function clear(): void {
    if (currentTask.value) {
      removeTaskFromStorage(currentTask.value.taskId)
      currentTask.value = null
    }
  }

  return {
    /** 当前上传任务 */
    currentTask,
    /** 是否正在上传 */
    isUploading,
    /** 上传文件 */
    upload,
    /** 暂停上传 */
    pause,
    /** 恢复上传 */
    resume,
    /** 取消上传 */
    cancel,
    /** 清除任务 */
    clear,
  }
}
