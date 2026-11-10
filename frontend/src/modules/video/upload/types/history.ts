/**
 * @fileoverview 历史记录管理类型定义
 * @module modules/video/upload/types/history
 * @author HeZaoCha
 * @date 2026-01-11
 * @description 定义历史记录相关的数据结构和类型
 */

import type { VideoType } from './uploadTypes'

/**
 * 历史记录状态枚举
 */
export enum HistoryRecordStatus {
  /** 成功 */
  SUCCESS = 'success',
  /** 失败 */
  FAILED = 'failed',
  /** 已取消 */
  CANCELLED = 'cancelled',
}

/**
 * 排序字段枚举
 */
export enum HistorySortField {
  /** 上传时间 */
  UPLOAD_TIME = 'uploadTime',
  /** 文件大小 */
  FILE_SIZE = 'fileSize',
  /** 文件名 */
  FILENAME = 'filename',
}

/**
 * 排序方向枚举
 */
export enum HistorySortOrder {
  /** 升序 */
  ASC = 'asc',
  /** 降序 */
  DESC = 'desc',
}

/**
 * 历史记录数据结构
 */
export interface UploadHistoryRecord {
  /** 记录唯一标识 */
  id: string
  /** 用户ID */
  userId: string
  /** 文件名 */
  filename: string
  /** 文件大小（字节） */
  fileSize: number
  /** 视频类型 */
  videoType: VideoType
  /** 上传时间 */
  uploadTime: Date
  /** 视频时长（秒） */
  duration?: number
  /** 上传状态 */
  status: HistoryRecordStatus
  /** 错误信息 */
  errorMessage?: string
  /** 分析结果ID */
  analysisResultId?: string
  /** 缩略图URL */
  thumbnailUrl?: string
  /** 标签列表 */
  tags?: string[]
  /** 元数据 */
  metadata: Record<string, unknown>
}

/**
 * 历史记录查询参数
 */
export interface HistoryQuery {
  /** 搜索关键词 */
  keyword?: string
  /** 视频类型筛选 */
  videoType?: VideoType[]
  /** 状态筛选 */
  status?: HistoryRecordStatus[]
  /** 日期范围 */
  dateRange?: [Date, Date]
  /** 排序字段 */
  sortBy?: HistorySortField
  /** 排序方向 */
  sortOrder?: HistorySortOrder
  /** 当前页码 */
  page: number
  /** 每页大小 */
  pageSize: number
}

/**
 * 历史记录查询结果
 */
export interface HistoryQueryResult {
  /** 记录列表 */
  records: UploadHistoryRecord[]
  /** 总记录数 */
  total: number
  /** 当前页码 */
  page: number
  /** 每页大小 */
  pageSize: number
  /** 总页数 */
  totalPages: number
}

/**
 * 上传统计数据
 */
export interface UploadStatistics {
  /** 总上传次数 */
  totalUploads: number
  /** 总上传大小（字节） */
  totalSize: number
  /** 成功率（百分比） */
  successRate: number
  /** 平均上传时间（毫秒） */
  averageUploadTime: number
  /** 类型分布 */
  typeDistribution: Record<VideoType, number>
  /** 每日上传统计 */
  dailyUploads: Array<{
    date: string
    count: number
  }>
  /** 每周上传统计 */
  weeklyUploads: Array<{
    week: string
    count: number
  }>
  /** 每月上传统计 */
  monthlyUploads: Array<{
    month: string
    count: number
  }>
}

/**
 * 历史记录操作选项
 */
export interface HistoryActionOptions {
  /** 是否显示确认对话框 */
  showConfirm?: boolean
  /** 批量操作时的进度回调 */
  onProgress?: (current: number, total: number) => void
  /** 操作完成回调 */
  onComplete?: (success: boolean, message?: string) => void
}

/**
 * 历史记录导出选项
 */
export interface HistoryExportOptions {
  /** 导出格式 */
  format: 'csv' | 'excel' | 'json'
  /** 包含的字段 */
  fields?: (keyof UploadHistoryRecord)[]
  /** 文件名 */
  filename?: string
  /** 日期格式 */
  dateFormat?: string
}

/**
 * 历史记录过滤器
 */
export interface HistoryFilters {
  /** 搜索关键词 */
  keyword: string
  /** 视频类型 */
  videoType: VideoType | ''
  /** 状态 */
  status: HistoryRecordStatus | ''
  /** 日期范围 */
  dateRange: [Date, Date] | null
}

/**
 * 历史记录列表项显示数据
 */
export interface HistoryListItem {
  /** 记录ID */
  id: string
  /** 文件名 */
  filename: string
  /** 文件大小格式化字符串 */
  fileSizeText: string
  /** 视频类型文本 */
  videoTypeText: string
  /** 上传时间格式化字符串 */
  uploadTimeText: string
  /** 状态 */
  status: HistoryRecordStatus
  /** 状态文本 */
  statusText: string
  /** 状态图标类型 */
  statusIcon: string
  /** 是否可以重新上传 */
  canReupload: boolean
  /** 是否可以查看分析结果 */
  canViewAnalysis: boolean
  /** 缩略图URL */
  thumbnailUrl?: string
}

/**
 * 历史记录页面状态
 */
export interface HistoryPageState {
  /** 加载状态 */
  loading: boolean
  /** 筛选器 */
  filters: HistoryFilters
  /** 记录列表 */
  records: HistoryListItem[]
  /** 统计数据 */
  statistics: UploadStatistics | null
  /** 分页信息 */
  pagination: {
    current: number
    pageSize: number
    total: number
    totalPages: number
  }
  /** 选中的记录IDs */
  selectedIds: string[]
  /** 批量操作状态 */
  batchOperation: {
    operating: boolean
    current: number
    total: number
  } | null
}

/**
 * 历史记录存储配置
 */
export interface HistoryStorageConfig {
  /** 数据库名称 */
  dbName: string
  /** 数据库版本 */
  version: number
  /** 存储名称 */
  storeName: string
  /** 索引定义 */
  indexes: Array<{
    name: string
    keyPath: string | string[]
    options?: IDBIndexParameters
  }>
  /** 数据保留天数 */
  retentionDays: number
  /** 最大存储记录数 */
  maxRecords: number
}

/**
 * 默认存储配置
 */
export const DEFAULT_HISTORY_STORAGE_CONFIG: HistoryStorageConfig = {
  dbName: 'aim-upload-history',
  version: 1,
  storeName: 'history_records',
  indexes: [
    {
      name: 'uploadTime',
      keyPath: 'uploadTime',
      options: { unique: false },
    },
    {
      name: 'videoType',
      keyPath: 'videoType',
      options: { unique: false },
    },
    {
      name: 'status',
      keyPath: 'status',
      options: { unique: false },
    },
    {
      name: 'filename',
      keyPath: 'filename',
      options: { unique: false },
    },
  ],
  retentionDays: 90,
  maxRecords: 10000,
}
