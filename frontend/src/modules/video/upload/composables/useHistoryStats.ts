/**
 * @fileoverview 历史记录统计组合函数
 * @module modules/video/upload/composables/useHistoryStats
 * @author HeZaoCha
 * @date 2026-01-11
 * @description 提供历史记录统计相关的组合函数
 */

import { ref, computed, onMounted, readonly } from 'vue'
import type { UploadStatistics } from '../types/history'
import { historyStorage } from '../services/history-storage'
import { logger } from '@/core/logger'
import { ElMessage } from 'element-plus'

/**
 * 历史记录统计组合函数
 * 提供统计数据的获取和展示
 */
export function useHistoryStats() {
  // 统计数据状态
  const statistics = ref<UploadStatistics | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const totalUploads = computed(() => statistics.value?.totalUploads || 0)
  const totalSize = computed(() => statistics.value?.totalSize || 0)
  const successRate = computed(() => statistics.value?.successRate || 0)
  const averageUploadTime = computed(() => statistics.value?.averageUploadTime || 0)

  // 格式化的统计数据
  const formattedTotalSize = computed(() => formatFileSize(totalSize.value))
  const formattedSuccessRate = computed(() => `${successRate.value.toFixed(1)}%`)
  const formattedAverageTime = computed(() => formatDuration(averageUploadTime.value))

  // 类型分布数据（用于图表）
  const typeDistribution = computed(() => {
    if (!statistics.value?.typeDistribution) return []

    return Object.entries(statistics.value.typeDistribution).map(([type, count]) => ({
      name: type === 'HUMAN' ? '人体视频' : '射箭视频',
      value: count,
      percentage: totalUploads.value > 0 ? ((count / totalUploads.value) * 100).toFixed(1) : '0',
    }))
  })

  // 时间趋势数据
  const dailyTrend = computed(() => statistics.value?.dailyUploads || [])
  const weeklyTrend = computed(() => statistics.value?.weeklyUploads || [])
  const monthlyTrend = computed(() => statistics.value?.monthlyUploads || [])

  /**
   * 加载统计数据
   */
  const loadStatistics = async (): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      const stats = await historyStorage.calculateStatistics()
      statistics.value = stats

      logger.info('历史记录统计数据加载成功', {
        context: { module: 'history.stats', function: 'loadStatistics' },
        data: {
          totalUploads: stats.totalUploads,
          successRate: stats.successRate,
          totalSize: stats.totalSize,
        },
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '统计数据加载失败'
      error.value = errorMessage

      logger.error('历史记录统计数据加载失败', {
        context: { module: 'history.stats', function: 'loadStatistics' },
        error: err instanceof Error ? err : new Error(String(err)),
      })

      ElMessage.error(`统计数据加载失败: ${errorMessage}`)
    } finally {
      loading.value = false
    }
  }

  /**
   * 刷新统计数据
   */
  const refreshStatistics = (): Promise<void> => {
    return loadStatistics()
  }

  /**
   * 重置统计数据
   */
  const resetStatistics = (): void => {
    statistics.value = null
    error.value = null
  }

  /**
   * 获取存储信息
   */
  const getStorageInfo = async () => {
    try {
      // return await historyStorage.getStorageInfo() // 简化实现中暂不支持
      return { recordCount: 0, storageSize: 0 }
    } catch (err) {
      logger.error('获取存储信息失败', {
        context: { module: 'history.stats', function: 'getStorageInfo' },
        error: err instanceof Error ? err : new Error(String(err)),
      })
      return { recordCount: 0, storageSize: 0 }
    }
  }

  // 初始化时加载统计数据
  onMounted(() => {
    loadStatistics()
  })

  return {
    // 状态
    statistics: readonly(statistics),
    loading: readonly(loading),
    error: readonly(error),

    // 计算属性
    totalUploads,
    totalSize,
    successRate,
    averageUploadTime,
    formattedTotalSize,
    formattedSuccessRate,
    formattedAverageTime,
    typeDistribution,
    dailyTrend,
    weeklyTrend,
    monthlyTrend,

    // 方法
    loadStatistics,
    refreshStatistics,
    resetStatistics,
    getStorageInfo,
  }
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化的文件大小字符串
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 格式化时长
 * @param milliseconds 毫秒数
 * @returns 格式化的时长字符串
 */
function formatDuration(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`
  }

  const seconds = Math.floor(milliseconds / 1000)
  if (seconds < 60) {
    return `${seconds}s`
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  return `${hours}h ${remainingMinutes}m`
}
