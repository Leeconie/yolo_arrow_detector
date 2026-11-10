/**
 * @fileoverview 视频上传API接口
 * @module core/api/video-upload
 * @author HeZaoCha
 * @date 2026-01-11
 * @description 提供视频上传、验证、分片上传等相关API接口
 * @dependencies @/core/api/request, @/types/common
 */

import { post } from './request'
import { logger } from '@/core/logger'

// 支持的视频格式
const SUPPORTED_VIDEO_TYPES = [
  'video/mp4',
  'video/avi',
  'video/mov',
  'video/mkv',
  'video/wmv',
  'video/flv',
  'video/webm',
  'video/m4v',
]

// 最大文件大小 (512MB)
const MAX_FILE_SIZE = 512 * 1024 * 1024

/**
 * 视频文件验证错误
 */
export class VideoValidationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message)
    this.name = 'VideoValidationError'
  }
}

/**
 * 验证视频文件
 * @param file 待验证的文件
 * @throws {VideoValidationError} 当文件不符合要求时抛出错误
 */
export function validateVideoFile(file: File): void {
  // 检查文件类型
  if (!SUPPORTED_VIDEO_TYPES.includes(file.type)) {
    const supportedFormats = ['MP4', 'AVI', 'MOV', 'MKV', 'WMV', 'FLV', 'WebM', 'M4V']
    throw new VideoValidationError(
      `不支持的文件格式。支持的格式：${supportedFormats.join('、')}`,
      'UNSUPPORTED_FORMAT',
    )
  }

  // 检查文件大小
  if (file.size > MAX_FILE_SIZE) {
    const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024)
    throw new VideoValidationError(`文件过大。最大支持 ${maxSizeMB}MB`, 'FILE_TOO_LARGE')
  }

  // 检查文件大小是否为0
  if (file.size === 0) {
    throw new VideoValidationError('文件为空，请选择有效的视频文件', 'EMPTY_FILE')
  }

  logger.debug('视频文件验证通过', {
    context: { module: 'video-upload', function: 'validateVideoFile' },
    data: {
      filename: file.name,
      size: file.size,
      type: file.type,
    },
  })
}

/**
 * 上传视频分片
 * @param params 上传参数
 * @returns 上传结果
 */
export async function uploadVideoChunk(params: {
  fileId: string
  chunkIndex: number
  chunkData: Blob
  totalChunks: number
  videoType?: string
}): Promise<{
  chunkId: string
  uploaded: boolean
  uploadUrl?: string
}> {
  const { fileId, chunkIndex, chunkData, totalChunks, videoType } = params

  logger.debug('上传视频分片', {
    context: { module: 'video-upload', function: 'uploadVideoChunk' },
    data: {
      fileId,
      chunkIndex,
      totalChunks,
      chunkSize: chunkData.size,
      videoType,
    },
  })

  try {
    // 创建FormData
    const formData = new FormData()
    formData.append('fileId', fileId)
    formData.append('chunkIndex', chunkIndex.toString())
    formData.append('totalChunks', totalChunks.toString())
    formData.append('chunk', chunkData)
    if (videoType) {
      formData.append('videoType', videoType)
    }

    // 发送请求
    const response = await post<{
      code: number
      message: string
      data: {
        chunkId: string
        uploaded: boolean
        uploadUrl?: string
      }
    }>('/video/upload/chunk', formData, {
      timeout: 60000, // 分片上传超时时间较长
    })

    if (response.code !== 200) {
      throw new Error(response.message || '上传分片失败')
    }

    logger.debug('视频分片上传成功', {
      context: { module: 'video-upload', function: 'uploadVideoChunk' },
      data: {
        fileId,
        chunkIndex,
        chunkId: response.data.chunkId,
      },
    })

    return response.data
  } catch (error) {
    logger.error('视频分片上传失败', {
      context: { module: 'video-upload', function: 'uploadVideoChunk' },
      error: error instanceof Error ? error : new Error(String(error)),
      data: { fileId, chunkIndex },
    })

    throw error
  }
}

/**
 * 获取支持的视频格式列表
 */
export function getSupportedVideoFormats(): string[] {
  return ['MP4', 'AVI', 'MOV', 'MKV', 'WMV', 'FLV', 'WebM', 'M4V']
}

/**
 * 获取最大文件大小（字节）
 */
export function getMaxFileSize(): number {
  return MAX_FILE_SIZE
}

/**
 * 获取最大文件大小（格式化字符串）
 */
export function getMaxFileSizeText(): string {
  const sizeMB = MAX_FILE_SIZE / (1024 * 1024)
  return `${sizeMB}MB`
}

/**
 * 检查文件是否为视频文件
 */
export function isVideoFile(file: File): boolean {
  return (
    SUPPORTED_VIDEO_TYPES.includes(file.type) ||
    file.name.match(/\.(mp4|avi|mov|mkv|wmv|flv|webm|m4v)$/i) !== null
  )
}
