/**
 * @fileoverview 历史记录查询组合函数
 * @module modules/video/upload/composables/useHistoryQuery
 * @author HeZaoCha
 * @date 2026-01-11
 * @description 提供历史记录查询相关的组合函数
 */

import { ref, computed, watch, onMounted, readonly } from 'vue'
import type { HistoryQuery, HistoryQueryResult, UploadHistoryRecord } from '../types/history'
import { HistorySortField, HistorySortOrder, HistoryRecordStatus } from '../types/history'
import { VideoType } from '../types/uploadTypes'
import { historyStorage } from '../services/history-storage'
import { logger } from '@/core/logger'
import { ElMessage } from 'element-plus'

/**
 * 历史记录查询组合函数
 * 提供查询、分页、筛选等功能
 */
export function useHistoryQuery() {
  // 查询状态
  const query = ref<HistoryQuery>({
    page: 1,
    pageSize: 20,
    sortBy: HistorySortField.UPLOAD_TIME,
    sortOrder: HistorySortOrder.DESC,
  })

  // 结果状态
  const records = ref<UploadHistoryRecord[]>([])
  const totalRecords = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const totalPages = computed(() => Math.ceil(totalRecords.value / query.value.pageSize))

  const hasNextPage = computed(() => query.value.page < totalPages.value)

  const hasPrevPage = computed(() => query.value.page > 1)

  const isEmpty = computed(() => !loading.value && records.value.length === 0)

  /**
   * 执行查询
   */
  const executeQuery = async (): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      const result: HistoryQueryResult = await historyStorage.queryRecords(query.value)

      records.value = result.records
      totalRecords.value = result.total

      logger.info('历史记录查询成功', {
        context: { module: 'history.query', function: 'executeQuery' },
        data: {
          page: query.value.page,
          pageSize: query.value.pageSize,
          total: result.total,
          recordsCount: result.records.length,
        },
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '查询失败'
      error.value = errorMessage

      logger.error('历史记录查询失败', {
        context: { module: 'history.query', function: 'executeQuery' },
        error: err instanceof Error ? err : new Error(String(err)),
      })

      ElMessage.error(`查询失败: ${errorMessage}`)
    } finally {
      loading.value = false
    }
  }

  /**
   * 设置分页参数
   */
  const setPage = (page: number): void => {
    if (page >= 1 && page <= totalPages.value) {
      query.value.page = page
    }
  }

  /**
   * 设置每页大小
   */
  const setPageSize = (pageSize: number): void => {
    query.value.pageSize = pageSize
    query.value.page = 1 // 重置到第一页
  }

  /**
   * 设置排序
   */
  const setSorting = (
    sortBy: HistorySortField,
    sortOrder: HistorySortOrder = HistorySortOrder.DESC,
  ): void => {
    query.value.sortBy = sortBy
    query.value.sortOrder = sortOrder
  }

  /**
   * 设置关键词搜索
   */
  const setKeyword = (keyword: string): void => {
    query.value.keyword = keyword || undefined
    query.value.page = 1 // 重置到第一页
  }

  /**
   * 设置视频类型筛选
   */
  const setVideoTypeFilter = (videoTypes: VideoType[]): void => {
    query.value.videoType = videoTypes.length > 0 ? videoTypes : undefined
    query.value.page = 1 // 重置到第一页
  }

  /**
   * 设置状态筛选
   */
  const setStatusFilter = (statuses: HistoryRecordStatus[]): void => {
    query.value.status = statuses.length > 0 ? statuses : undefined
    query.value.page = 1 // 重置到第一页
  }

  /**
   * 设置日期范围筛选
   */
  const setDateRangeFilter = (dateRange: [Date, Date] | null): void => {
    query.value.dateRange = dateRange || undefined
    query.value.page = 1 // 重置到第一页
  }

  /**
   * 重置所有筛选条件
   */
  const resetFilters = (): void => {
    query.value.keyword = undefined
    query.value.videoType = undefined
    query.value.status = undefined
    query.value.dateRange = undefined
    query.value.page = 1
  }

  /**
   * 刷新当前查询
   */
  const refresh = (): Promise<void> => {
    return executeQuery()
  }

  /**
   * 转到下一页
   */
  const nextPage = (): void => {
    if (hasNextPage.value) {
      setPage(query.value.page + 1)
    }
  }

  /**
   * 转到上一页
   */
  const prevPage = (): void => {
    if (hasPrevPage.value) {
      setPage(query.value.page - 1)
    }
  }

  /**
   * 转到第一页
   */
  const firstPage = (): void => {
    setPage(1)
  }

  /**
   * 转到最后一页
   */
  const lastPage = (): void => {
    setPage(totalPages.value)
  }

  // 监听查询参数变化，自动执行查询
  watch(
    () => query.value,
    () => {
      executeQuery()
    },
    { deep: true },
  )

  // 初始化时执行一次查询
  onMounted(() => {
    executeQuery()
  })

  return {
    // 状态
    query: readonly(query),
    records: readonly(records),
    totalRecords: readonly(totalRecords),
    loading: readonly(loading),
    error: readonly(error),

    // 计算属性
    totalPages,
    hasNextPage,
    hasPrevPage,
    isEmpty,

    // 方法
    executeQuery,
    setPage,
    setPageSize,
    setSorting,
    setKeyword,
    setVideoTypeFilter,
    setStatusFilter,
    setDateRangeFilter,
    resetFilters,
    refresh,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
  }
}
