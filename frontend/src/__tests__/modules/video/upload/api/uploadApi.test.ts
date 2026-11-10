/**
 * @fileoverview 视频上传API单元测试
 * @module modules/video/upload/api/uploadApi.test
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 测试视频上传相关的API接口
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  uploadVideoChunk,
  validateVideo,
  saveVideoType,
} from '@/modules/video/upload/api/uploadApi'
import { VideoType } from '@/modules/video/upload/types/uploadTypes'
import { post } from '@/core/api/request'

// Mock API request
vi.mock('@/core/api/request', () => ({
  post: vi.fn(),
}))

describe('视频上传API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('uploadVideoChunk', () => {
    it('应该正确上传视频分片', async () => {
      const mockResponse = {
        chunkIndex: 0,
        uploaded: true,
        videoId: 'video_123',
      }

      ;(post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse)

      const request = {
        videoId: 'video_123',
        file: new Blob(['chunk data'], { type: 'video/mp4' }),
        chunkIndex: 0,
        totalChunks: 10,
        totalSize: 100 * 1024 * 1024,
        fileName: 'test.mp4',
        fileType: 'video/mp4',
      }

      const result = await uploadVideoChunk(request)

      // 注意：baseURL已经包含/api，所以这里只需要/video/upload
      expect(post).toHaveBeenCalledWith('/video/upload', expect.any(FormData))
      expect(result).toEqual(mockResponse)
    })

    it('应该正确构建FormData', async () => {
      const mockResponse = {
        chunkIndex: 0,
        uploaded: true,
        videoId: 'video_123',
      }

      ;(post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse)

      const request = {
        videoId: 'video_123',
        file: new Blob(['chunk data'], { type: 'video/mp4' }),
        chunkIndex: 5,
        totalChunks: 10,
        totalSize: 100 * 1024 * 1024,
        fileName: 'test.mp4',
        fileType: 'video/mp4',
      }

      await uploadVideoChunk(request)

      const formDataCall = (post as ReturnType<typeof vi.fn>).mock.calls[0][1] as FormData
      expect(formDataCall.get('videoId')).toBe('video_123')
      expect(formDataCall.get('chunkIndex')).toBe('5')
      expect(formDataCall.get('totalChunks')).toBe('10')
      expect(formDataCall.get('totalSize')).toBe('104857600')
      expect(formDataCall.get('fileName')).toBe('test.mp4')
      expect(formDataCall.get('fileType')).toBe('video/mp4')
    })
  })

  describe('validateVideo', () => {
    it('应该正确校验视频文件', async () => {
      const mockResponse = {
        valid: true,
        message: '文件格式正确',
      }

      ;(post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse)

      const request = {
        fileName: 'test.mp4',
        fileSize: 100 * 1024 * 1024,
        fileType: 'video/mp4',
      }

      const result = await validateVideo(request)

      // 注意：baseURL已经包含/api，所以这里只需要/video/validate
      expect(post).toHaveBeenCalledWith('/video/validate', request)
      expect(result).toEqual(mockResponse)
    })

    it('应该处理校验失败的情况', async () => {
      const mockResponse = {
        valid: false,
        message: '文件格式不支持',
      }

      ;(post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse)

      const request = {
        fileName: 'test.avi',
        fileSize: 100 * 1024 * 1024,
        fileType: 'video/avi',
      }

      const result = await validateVideo(request)

      expect(result.valid).toBe(false)
      expect(result.message).toBe('文件格式不支持')
    })
  })

  describe('saveVideoType', () => {
    it('应该正确保存视频类型', async () => {
      const mockResponse = {
        success: true,
      }

      ;(post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse)

      const request = {
        videoId: 'video_123',
        videoType: VideoType.HUMAN,
      }

      const result = await saveVideoType(request)

      // 注意：baseURL已经包含/api，所以这里只需要/video/saveType
      expect(post).toHaveBeenCalledWith('/video/saveType', request)
      expect(result).toEqual(mockResponse)
    })

    it('应该支持保存射箭视频类型', async () => {
      const mockResponse = {
        success: true,
      }

      ;(post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse)

      const request = {
        videoId: 'video_456',
        videoType: VideoType.ARCHERY,
      }

      const result = await saveVideoType(request)

      expect(result.success).toBe(true)
      expect((post as ReturnType<typeof vi.fn>).mock.calls[0][1]).toEqual(request)
    })
  })
})
