/**
 * @fileoverview 视频上传API接口
 * @module modules/video/upload/api/uploadApi
 * @description 提供视频上传相关的API接口封装，包括分片上传、文件校验、类型保存等
 * @author HeZaoCha
 * @date 2026-01-10
 * @dependencies @/core/api/request, ./types/uploadTypes
 */

import { post } from '@/core/api/request'
import type {
  ChunkUploadRequest,
  ChunkUploadResponse,
  ValidateVideoRequest,
  ValidateVideoResponse,
  SaveVideoTypeRequest,
  SaveVideoTypeResponse,
} from '../types/uploadTypes'
import { logger } from '@/core/logger'

/**
 * 分片上传视频文件
 * @param request 分片上传请求参数
 * @returns 返回上传响应，包含分片索引、上传状态、视频ID
 * @description 上传视频文件的一个分片，支持断点续传
 * @example
 * ```typescript
 * const result = await uploadVideoChunk({
 *   videoId: 'video_123',
 *   file: chunkBlob,
 *   chunkIndex: 0,
 *   totalChunks: 10,
 *   totalSize: 104857600,
 *   fileName: 'video.mp4',
 *   fileType: 'video/mp4'
 * })
 * console.log(result.uploaded) // true
 * ```
 */
export function uploadVideoChunk(request: ChunkUploadRequest): Promise<ChunkUploadResponse> {
  const formData = new FormData()
  formData.append('file', request.file)
  formData.append('videoId', request.videoId)
  formData.append('chunkIndex', request.chunkIndex.toString())
  formData.append('totalChunks', request.totalChunks.toString())
  formData.append('totalSize', request.totalSize.toString())
  formData.append('fileName', request.fileName)
  formData.append('fileType', request.fileType)

  logger.debug('上传视频分片', {
    context: {
      module: 'video.upload',
      function: 'uploadVideoChunk',
    },
    data: {
      videoId: request.videoId,
      chunkIndex: request.chunkIndex,
      totalChunks: request.totalChunks,
      fileName: request.fileName,
      fileSize: request.totalSize,
    },
  })

  // 注意：baseURL已经包含/api，所以这里只需要/video/upload
  return post<ChunkUploadResponse>('/video/upload', formData)
    .then((result) => {
      logger.debug('上传视频分片成功', {
        context: {
          module: 'video.upload',
          function: 'uploadVideoChunk',
        },
        data: {
          videoId: result.videoId,
          chunkIndex: result.chunkIndex,
          uploaded: result.uploaded,
        },
      })
      return result
    })
    .catch((error) => {
      logger.error('上传视频分片失败', {
        context: {
          module: 'video.upload',
          function: 'uploadVideoChunk',
        },
        error: error instanceof Error ? error : new Error(String(error)),
        data: {
          videoId: request.videoId,
          chunkIndex: request.chunkIndex,
        },
      })
      throw error
    })
}

/**
 * 校验视频文件
 * @param request 校验请求参数
 * @returns 返回校验结果，包含是否通过和校验消息
 * @description 在上传前校验视频文件的格式、大小等信息
 * @example
 * ```typescript
 * const result = await validateVideo({
 *   fileName: 'video.mp4',
 *   fileSize: 104857600,
 *   fileType: 'video/mp4'
 * })
 * if (result.valid) {
 *   console.log('文件校验通过')
 * } else {
 *   console.error(result.message)
 * }
 * ```
 */
export function validateVideo(request: ValidateVideoRequest): Promise<ValidateVideoResponse> {
  logger.debug('校验视频文件', {
    context: {
      module: 'video.upload',
      function: 'validateVideo',
    },
    data: {
      fileName: request.fileName,
      fileSize: request.fileSize,
      fileType: request.fileType,
    },
  })
  // 注意：baseURL已经包含/api，所以这里只需要/video/validate
  return post<ValidateVideoResponse>('/video/validate', request)
    .then((result) => {
      logger.debug('校验视频文件完成', {
        context: {
          module: 'video.upload',
          function: 'validateVideo',
        },
        data: {
          valid: result.valid,
          message: result.message,
        },
      })
      return result
    })
    .catch((error) => {
      logger.error('校验视频文件失败', {
        context: {
          module: 'video.upload',
          function: 'validateVideo',
        },
        error: error instanceof Error ? error : new Error(String(error)),
      })
      throw error
    })
}

/**
 * 保存视频类型
 * @param request 保存类型请求参数
 * @returns 返回保存结果
 * @description 保存视频的分析类型（运动人体视频/射箭视频）
 * @example
 * ```typescript
 * const result = await saveVideoType({
 *   videoId: 'video_123',
 *   videoType: VideoType.HUMAN
 * })
 * if (result.success) {
 *   console.log('类型保存成功')
 * }
 * ```
 */
export function saveVideoType(request: SaveVideoTypeRequest): Promise<SaveVideoTypeResponse> {
  logger.info('保存视频类型', {
    context: {
      module: 'video.upload',
      function: 'saveVideoType',
    },
    data: {
      videoId: request.videoId,
      videoType: request.videoType,
    },
  })
  // 注意：baseURL已经包含/api，所以这里只需要/video/saveType
  return post<SaveVideoTypeResponse>('/video/saveType', request)
    .then((result) => {
      logger.info('保存视频类型成功', {
        context: {
          module: 'video.upload',
          function: 'saveVideoType',
        },
        data: {
          videoId: request.videoId,
          success: result.success,
        },
      })
      return result
    })
    .catch((error) => {
      logger.error('保存视频类型失败', {
        context: {
          module: 'video.upload',
          function: 'saveVideoType',
        },
        error: error instanceof Error ? error : new Error(String(error)),
        data: {
          videoId: request.videoId,
        },
      })
      throw error
    })
}
