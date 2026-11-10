/**
 * @fileoverview 视频上传模块类型定义
 * @module modules/video/upload/types/uploadTypes
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 定义视频上传相关的类型，包括请求参数、响应数据、上传状态等
 */

/**
 * 视频类型枚举
 * @description 支持的分析类型
 */
export enum VideoType {
  /** 运动人体视频 */
  HUMAN = 'human',
  /** 射箭视频 */
  ARCHERY = 'archery',
}

/**
 * 上传状态枚举
 * @description 文件上传的各个状态
 */
export enum UploadStatus {
  /** 待上传 */
  PENDING = 'pending',
  /** 上传中 */
  UPLOADING = 'uploading',
  /** 上传成功 */
  SUCCESS = 'success',
  /** 上传失败 */
  FAILED = 'failed',
  /** 已暂停 */
  PAUSED = 'paused',
}

/**
 * 分片上传请求参数
 */
export interface ChunkUploadRequest {
  /** 视频ID */
  videoId: string
  /** 分片文件 */
  file: Blob
  /** 分片索引（从0开始） */
  chunkIndex: number
  /** 总分片数 */
  totalChunks: number
  /** 文件总大小（字节） */
  totalSize: number
  /** 文件名 */
  fileName: string
  /** 文件类型 */
  fileType: string
}

/**
 * 分片上传响应
 */
export interface ChunkUploadResponse {
  /** 分片索引 */
  chunkIndex: number
  /** 是否上传成功 */
  uploaded: boolean
  /** 视频ID */
  videoId: string
}

/**
 * 视频校验请求参数
 */
export interface ValidateVideoRequest {
  /** 文件名 */
  fileName: string
  /** 文件大小（字节） */
  fileSize: number
  /** 文件MIME类型 */
  fileType: string
}

/**
 * 视频校验响应
 */
export interface ValidateVideoResponse {
  /** 是否校验通过 */
  valid: boolean
  /** 校验消息 */
  message: string
}

/**
 * 保存视频类型请求参数
 */
export interface SaveVideoTypeRequest {
  /** 视频ID */
  videoId: string
  /** 视频类型 */
  videoType: VideoType
}

/**
 * 保存视频类型响应
 */
export interface SaveVideoTypeResponse {
  /** 是否保存成功 */
  success: boolean
}

/**
 * 上传进度信息
 */
export interface UploadProgress {
  /** 已上传字节数 */
  loaded: number
  /** 总字节数 */
  total: number
  /** 上传百分比（0-100） */
  percentage: number
  /** 上传速度（字节/秒） */
  speed: number
  /** 剩余时间（秒） */
  remainingTime: number
}

/**
 * 分片信息
 */
export interface ChunkInfo {
  /** 分片索引 */
  index: number
  /** 分片起始位置 */
  start: number
  /** 分片结束位置 */
  end: number
  /** 分片大小 */
  size: number
  /** 是否已上传 */
  uploaded: boolean
}

/**
 * 上传任务信息
 */
export interface UploadTask {
  /** 任务ID（使用文件hash或时间戳） */
  taskId: string
  /** 文件对象 */
  file: File
  /** 视频ID（上传后由服务器返回） */
  videoId?: string
  /** 上传状态 */
  status: UploadStatus
  /** 上传进度 */
  progress: UploadProgress
  /** 分片信息列表 */
  chunks: ChunkInfo[]
  /** 错误信息 */
  error?: string
  /** 创建时间 */
  createdAt: number
  /** 更新时间 */
  updatedAt: number
}

/**
 * 上传配置选项
 */
export interface UploadConfig {
  /** 分片大小（字节），默认5MB */
  chunkSize?: number
  /** 最大文件大小（字节），默认512MB */
  maxSize?: number
  /** 允许的文件格式，默认['mp4', 'avi', 'mov', 'mkv'] */
  allowedFormats?: string[]
  /** 是否启用断点续传，默认true */
  enableResume?: boolean
  /** 重试次数，默认3次 */
  retryCount?: number
  /** 重试延迟（毫秒），默认1000ms */
  retryDelay?: number
  /** 并发上传数，默认3 */
  concurrency?: number
}

/**
 * 上传事件回调
 */
export interface UploadCallbacks {
  /** 上传开始回调 */
  onStart?: (task: UploadTask) => void
  /** 进度更新回调 */
  onProgress?: (task: UploadTask, progress: UploadProgress) => void
  /** 分片上传成功回调 */
  onChunkSuccess?: (task: UploadTask, chunkIndex: number) => void
  /** 上传成功回调 */
  onSuccess?: (task: UploadTask, videoId: string) => void
  /** 上传失败回调 */
  onError?: (task: UploadTask, error: Error) => void
  /** 上传暂停回调 */
  onPause?: (task: UploadTask) => void
  /** 上传恢复回调 */
  onResume?: (task: UploadTask) => void
}
