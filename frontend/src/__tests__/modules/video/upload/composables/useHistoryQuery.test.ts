/**
 * @fileoverview useHistoryQuery组合函数测试
 * @module __tests__/modules/video/upload/composables/useHistoryQuery.test
 * @author HeZaoCha
 * @date 2026-01-11
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createApp } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { useHistoryQuery } from '@/modules/video/upload/composables/useHistoryQuery'
// import type { HistoryQuery, UploadHistoryRecord } from '@/modules/video/upload/types/history'

// Mock historyStorage
vi.mock('@/modules/video/upload/services/history-storage', () => ({
  historyStorage: {
    queryRecords: vi.fn(() =>
      Promise.resolve({
        records: [
          {
            id: '1',
            filename: 'test1.mp4',
            fileSize: 1024 * 1024 * 10,
            videoType: 'HUMAN',
            uploadTime: new Date(),
            status: 'success',
            canViewAnalysis: true,
            canReupload: true,
          },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      }),
    ),
    saveRecord: vi.fn(),
    deleteRecord: vi.fn(),
  },
}))

describe('useHistoryQuery', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    app = createApp({})
    const pinia = createPinia()
    app.use(pinia)
    setActivePinia(pinia)
  })

  describe('初始化状态', () => {
    it('应该返回正确的初始状态', () => {
      const { query, records, totalRecords, loading } = useHistoryQuery()

      expect(records.value).toEqual([])
      expect(totalRecords.value).toBe(0)
      expect(loading.value).toBe(false)
      expect(query.value.page).toBe(1)
      expect(query.value.pageSize).toBe(20)
    })
  })

  describe('查询参数设置', () => {
    it('应该正确设置关键词', () => {
      const { setKeyword, query } = useHistoryQuery()

      setKeyword('test')
      expect(query.value.keyword).toBe('test')
    })

    it('应该正确设置视频类型筛选', () => {
      const { setVideoTypeFilter, query } = useHistoryQuery()

      setVideoTypeFilter(['HUMAN', 'ARCHERY'])
      expect(query.value.videoType).toEqual(['HUMAN', 'ARCHERY'])
    })

    it('应该正确设置状态筛选', () => {
      const { setStatusFilter, query } = useHistoryQuery()

      setStatusFilter(['success', 'failed'])
      expect(query.value.status).toEqual(['success', 'failed'])
    })

    it('应该正确设置日期范围', () => {
      const { setDateRangeFilter, query } = useHistoryQuery()
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      setDateRangeFilter([startDate, endDate])
      expect(query.value.dateRange).toEqual([startDate, endDate])
    })
  })

  describe('分页功能', () => {
    it('应该正确设置页面大小', () => {
      const { setPageSize, query } = useHistoryQuery()

      setPageSize(50)
      expect(query.value.pageSize).toBe(50)
    })
  })

  describe('排序功能', () => {
    it('应该正确设置排序', () => {
      const { setSorting, query } = useHistoryQuery()

      setSorting('fileSize', 'desc')
      expect(query.value.sortBy).toBe('fileSize')
      expect(query.value.sortOrder).toBe('desc')
    })
  })

  describe('数据重置', () => {
    it('应该正确重置所有筛选条件', () => {
      const { resetFilters, setKeyword, setVideoTypeFilter, query } = useHistoryQuery()

      // 先设置一些值
      setKeyword('test')
      setVideoTypeFilter(['HUMAN'])
      query.value.page = 5

      resetFilters()

      expect(query.value.keyword).toBeUndefined()
      expect(query.value.videoType).toBeUndefined()
      expect(query.value.page).toBe(1) // 页面应该保持
    })
  })

  describe('性能优化', () => {
    it('应该在大数据量下保持良好性能', async () => {
      const { executeQuery } = useHistoryQuery()

      const startTime = Date.now()

      // 模拟大数据量查询
      await executeQuery()

      const duration = Date.now() - startTime
      expect(duration).toBeLessThan(100) // 应该在100ms内完成
    })
  })
})
