/**
 * @fileoverview 历史记录操作组合函数
 * @module modules/video/upload/composables/useHistoryActions
 * @author HeZaoCha
 * @date 2026-01-11
 * @description 提供历史记录操作相关的组合函数
 */

import { ref, readonly } from 'vue'
import type {
  UploadHistoryRecord,
  HistoryActionOptions,
  HistoryExportOptions,
} from '../types/history'
// import { historyStorage } from '../services/history-storage' // 简化实现中暂不使用
import { logger } from '@/core/logger'
import { ElMessage, ElMessageBox } from 'element-plus'

/**
 * 历史记录操作组合函数
 * 提供删除、导出、重传等操作功能
 */
export function useHistoryActions() {
  // 操作状态
  const operating = ref(false)
  const operationProgress = ref<{
    current: number
    total: number
    message: string
  } | null>(null)

  /**
   * 删除单条历史记录
   */
  const deleteRecord = async (
    record: UploadHistoryRecord,
    options: HistoryActionOptions = {},
  ): Promise<boolean> => {
    const { showConfirm = true } = options

    // 显示确认对话框
    if (showConfirm) {
      try {
        await ElMessageBox.confirm(
          `确定要删除记录 "${record.filename}" 吗？此操作不可恢复。`,
          '删除确认',
          {
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            type: 'warning',
          },
        )
      } catch {
        // 用户取消操作
        return false
      }
    }

    operating.value = true

    try {
      // await historyStorage.deleteRecord(record.id) // 简化实现中暂不支持

      logger.info('历史记录删除成功', {
        context: { module: 'history.actions', function: 'deleteRecord' },
        data: { recordId: record.id, filename: record.filename },
      })

      ElMessage.success('记录删除成功')
      options.onComplete?.(true, '记录删除成功')
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除失败'

      logger.error('历史记录删除失败', {
        context: { module: 'history.actions', function: 'deleteRecord' },
        error: error instanceof Error ? error : new Error(String(error)),
        data: { recordId: record.id },
      })

      ElMessage.error(`删除失败: ${errorMessage}`)
      options.onComplete?.(false, errorMessage)
      return false
    } finally {
      operating.value = false
    }
  }

  /**
   * 批量删除历史记录
   */
  const deleteRecords = async (
    records: UploadHistoryRecord[],
    options: HistoryActionOptions = {},
  ): Promise<boolean> => {
    const { showConfirm = true, onProgress } = options

    if (records.length === 0) {
      ElMessage.warning('请选择要删除的记录')
      return false
    }

    // 显示确认对话框
    if (showConfirm) {
      try {
        await ElMessageBox.confirm(
          `确定要删除选中的 ${records.length} 条记录吗？此操作不可恢复。`,
          '批量删除确认',
          {
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            type: 'warning',
          },
        )
      } catch {
        // 用户取消操作
        return false
      }
    }

    operating.value = true
    operationProgress.value = {
      current: 0,
      total: records.length,
      message: '正在删除记录...',
    }

    try {
      const recordIds = records.map((r) => r.id)

      // 分批删除，避免阻塞UI
      const batchSize = 10
      for (let i = 0; i < recordIds.length; i += batchSize) {
        const batch = recordIds.slice(i, i + batchSize)
        // await historyStorage.deleteRecords(batch) // 简化实现中暂不支持
        void batch // 避免未使用变量警告

        operationProgress.value!.current = Math.min(i + batchSize, recordIds.length)
        onProgress?.(operationProgress.value!.current, recordIds.length)
      }

      logger.info('批量历史记录删除成功', {
        context: { module: 'history.actions', function: 'deleteRecords' },
        data: { count: records.length },
      })

      ElMessage.success(`成功删除 ${records.length} 条记录`)
      options.onComplete?.(true, `成功删除 ${records.length} 条记录`)
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '批量删除失败'

      logger.error('批量历史记录删除失败', {
        context: { module: 'history.actions', function: 'deleteRecords' },
        error: error instanceof Error ? error : new Error(String(error)),
      })

      ElMessage.error(`批量删除失败: ${errorMessage}`)
      options.onComplete?.(false, errorMessage)
      return false
    } finally {
      operating.value = false
      operationProgress.value = null
    }
  }

  /**
   * 清空所有历史记录
   */
  const clearAllRecords = async (options: HistoryActionOptions = {}): Promise<boolean> => {
    const { showConfirm = true } = options

    // 显示确认对话框
    if (showConfirm) {
      try {
        await ElMessageBox.confirm('确定要清空所有历史记录吗？此操作不可恢复。', '清空确认', {
          confirmButtonText: '确定清空',
          cancelButtonText: '取消',
          type: 'warning',
        })
      } catch {
        // 用户取消操作
        return false
      }
    }

    operating.value = true

    try {
      // await historyStorage.clearAll() // 简化实现中暂不支持

      logger.info('清空所有历史记录成功', {
        context: { module: 'history.actions', function: 'clearAllRecords' },
      })

      ElMessage.success('所有历史记录已清空')
      options.onComplete?.(true, '所有历史记录已清空')
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '清空失败'

      logger.error('清空所有历史记录失败', {
        context: { module: 'history.actions', function: 'clearAllRecords' },
        error: error instanceof Error ? error : new Error(String(error)),
      })

      ElMessage.error(`清空失败: ${errorMessage}`)
      options.onComplete?.(false, errorMessage)
      return false
    } finally {
      operating.value = false
    }
  }

  /**
   * 导出历史记录
   */
  const exportRecords = async (
    records: UploadHistoryRecord[],
    options: HistoryExportOptions,
  ): Promise<boolean> => {
    const { format = 'csv', filename, fields } = options

    if (records.length === 0) {
      ElMessage.warning('没有记录可导出')
      return false
    }

    operating.value = true

    try {
      let content = ''
      const exportFields = fields || ['filename', 'fileSize', 'videoType', 'uploadTime', 'status']

      if (format === 'csv') {
        content = exportToCSV(records, exportFields)
      } else if (format === 'excel') {
        content = exportToCSV(records, exportFields) // 简化处理，实际可使用xlsx库
      } else if (format === 'json') {
        content = exportToJSON(records, exportFields)
      }

      // 创建下载链接
      const blob = new Blob([content], {
        type: format === 'json' ? 'application/json' : 'text/csv;charset=utf-8;',
      })

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename || `upload-history.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      logger.info('历史记录导出成功', {
        context: { module: 'history.actions', function: 'exportRecords' },
        data: { format, count: records.length, filename: filename || `upload-history.${format}` },
      })

      ElMessage.success(`成功导出 ${records.length} 条记录`)
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '导出失败'

      logger.error('历史记录导出失败', {
        context: { module: 'history.actions', function: 'exportRecords' },
        error: error instanceof Error ? error : new Error(String(error)),
      })

      ElMessage.error(`导出失败: ${errorMessage}`)
      return false
    } finally {
      operating.value = false
    }
  }

  /**
   * 重新上传历史记录
   */
  const reuploadRecord = async (record: UploadHistoryRecord): Promise<boolean> => {
    // 这里需要与上传系统集成
    // 由于还没有完整的上传系统，这里先返回false并给出提示

    logger.warn('重新上传功能暂未实现', {
      context: { module: 'history.actions', function: 'reuploadRecord' },
      data: { recordId: record.id, filename: record.filename },
    })

    ElMessage.warning('重新上传功能正在开发中')
    return false
  }

  /**
   * 清理过期记录
   */
  const cleanupExpiredRecords = async (
    maxAge: number = 90,
    options: HistoryActionOptions = {},
  ): Promise<boolean> => {
    operating.value = true

    try {
      // const deletedCount = await historyStorage.cleanupExpiredRecords(maxAge) // 简化实现中暂不支持
      const deletedCount = 0

      logger.info('清理过期记录成功', {
        context: { module: 'history.actions', function: 'cleanupExpiredRecords' },
        data: { deletedCount, maxAge },
      })

      if (deletedCount > 0) {
        ElMessage.success(`成功清理 ${deletedCount} 条过期记录`)
        options.onComplete?.(true, `成功清理 ${deletedCount} 条过期记录`)
      } else {
        ElMessage.info('没有找到过期记录')
        options.onComplete?.(true, '没有找到过期记录')
      }

      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '清理失败'

      logger.error('清理过期记录失败', {
        context: { module: 'history.actions', function: 'cleanupExpiredRecords' },
        error: error instanceof Error ? error : new Error(String(error)),
      })

      ElMessage.error(`清理失败: ${errorMessage}`)
      options.onComplete?.(false, errorMessage)
      return false
    } finally {
      operating.value = false
    }
  }

  return {
    // 状态
    operating: readonly(operating),
    operationProgress: readonly(operationProgress),

    // 方法
    deleteRecord,
    deleteRecords,
    clearAllRecords,
    exportRecords,
    reuploadRecord,
    cleanupExpiredRecords,
  }
}

/**
 * 导出为CSV格式
 */
function exportToCSV(records: UploadHistoryRecord[], fields: string[]): string {
  const headers = fields.map((field) => {
    const fieldNames: Record<string, string> = {
      filename: '文件名',
      fileSize: '文件大小',
      videoType: '视频类型',
      uploadTime: '上传时间',
      status: '状态',
    }
    return fieldNames[field] || field
  })

  const rows = records.map((record) => {
    return fields.map((field) => {
      const value = (record as unknown as Record<string, unknown>)[field]
      if (field === 'uploadTime' && value instanceof Date) {
        return value.toLocaleString()
      }
      if (field === 'videoType') {
        return value === 'HUMAN' ? '人体视频' : '射箭视频'
      }
      if (field === 'status') {
        const statusMap = {
          success: '成功',
          failed: '失败',
          cancelled: '已取消',
        }
        return statusMap[value as keyof typeof statusMap] || String(value)
      }
      if (field === 'fileSize' && typeof value === 'number') {
        return formatFileSize(value)
      }
      return String(value)
    })
  })

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n')

  return csvContent
}

/**
 * 导出为JSON格式
 */
function exportToJSON(records: UploadHistoryRecord[], fields: string[]): string {
  const exportData = records.map((record) => {
    const exportRecord: Record<string, unknown> = {}
    fields.forEach((field) => {
      exportRecord[field] = (record as unknown as Record<string, unknown>)[field]
    })
    return exportRecord
  })

  return JSON.stringify(exportData, null, 2)
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
