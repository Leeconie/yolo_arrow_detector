/**
 * @fileoverview 射箭分析相关类型定义
 * @module types/archery
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 定义射箭分析相关的API响应类型、请求参数类型等
 */

/**
 * 射箭统计数据
 * @description 用于首页展示的射箭分析统计数据
 */
export interface ArcheryStats {
  /** 平均撒放稳定性（分，0-100） */
  stability: number
  /** 箭道偏差值（cm） */
  deviation: number
  /** 有效分析次数 */
  analysisCount: number
  /** 稳定性评分（兼容字段） */
  stabilityScore?: number
  /** 平均偏差值（兼容字段） */
  averageDeviation?: number
  /** 最近分析时间（兼容字段） */
  lastAnalysisTime?: string
}

/**
 * 命中点坐标
 */
export interface HitPoint {
  /** X坐标 */
  x: number
  /** Y坐标 */
  y: number
  /** 环数（1-10） */
  ring: number
  /** 时间戳（毫秒） */
  timestamp: number
}

/**
 * 撒放轨迹点
 */
export interface TrajectoryPoint {
  /** X坐标 */
  x: number
  /** Y坐标 */
  y: number
  /** 时间（秒） */
  time: number
}

/**
 * 射箭分析详情
 * @description 单条射箭分析的详细数据，包括命中点、轨迹等
 */
export interface ArcheryDetail {
  /** 任务ID */
  taskId: string
  /** 命中点列表 */
  hitPoints: HitPoint[]
  /** 撒放轨迹 */
  trajectory: TrajectoryPoint[]
}

/**
 * 上传射箭视频请求参数
 */
export interface UploadArcheryVideoRequest {
  /** 射箭人视频文件 */
  archerVideo: File
  /** 箭靶视频文件 */
  targetVideo: File
  /** 备注（可选） */
  note?: string
}

/**
 * 上传射箭视频响应
 */
export interface UploadArcheryVideoResponse {
  /** 分析任务ID */
  taskId: string
}
