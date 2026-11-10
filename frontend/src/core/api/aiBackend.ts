/**
 * @fileoverview AI 识别服务接口封装（对接 backend/ FastAPI + YOLO）
 * @module core/api/aiBackend
 * @date 2026-11-10
 * @description 独立于 core/api/request 的 axios 实例。
 *              原因：request.ts 的响应拦截器假定后端返回 { code, data, message } 信封结构，
 *              而 Python 服务直接返回业务对象，两者契约不同，强行复用会被拦截器判为异常。
 *              因此这里单开一个实例，互不干扰，也不改动原有 Mock 链路。
 * @dependencies axios
 */

import axios, { type AxiosInstance, type AxiosProgressEvent } from 'axios'

/** 代理前缀：开发环境经 Vite 代理转到 http://127.0.0.1:8000 */
export const AI_BACKEND_BASE: string = import.meta.env.VITE_AI_BACKEND_BASE || '/ai-api'

/** 识别模式：count=箭头计数、detect=箭头检测、pose=姿态分析 */
export type AiAnalyzeMode = 'count' | 'detect' | 'pose'

/** 单个视频文件大小上限（与后端 MAX_UPLOAD_MB 保持一致） */
export const MAX_VIDEO_SIZE_MB = 512

/** 后端支持的视频扩展名 */
export const SUPPORTED_VIDEO_EXTENSIONS = [
  '.mp4',
  '.avi',
  '.mov',
  '.mkv',
  '.wmv',
  '.flv',
  '.webm',
  '.m4v',
]

const aiClient: AxiosInstance = axios.create({
  baseURL: AI_BACKEND_BASE,
  // YOLO 逐帧推理是 CPU 密集操作，短视频也可能跑几分钟，超时给足
  timeout: 30 * 60 * 1000,
})

/** 视频基本信息 */
export interface VideoInfo {
  fps: number
  width: number
  height: number
  total_frames: number
}

/** 单支箭的追踪信息 */
export interface TrackedArrow {
  arrow_id: number
  bbox: number[]
  confidence: number
  stable: boolean
  appeared: boolean
  first_seen_frame: number
  last_seen_frame: number
  stability_frames: number
}

/** 每帧计数趋势（后端已精简为三字段） */
export interface TrackingTrendPoint {
  frame: number
  total: number
  stable: number
}

/** 箭头计数结果 */
export interface TrackingResult {
  video_info: VideoInfo
  total_arrows_shot: number
  current_stable_arrows: number
  frame_count: number
  arrows: TrackedArrow[]
  trend: TrackingTrendPoint[]
  detection_count: number
}

/** 姿态分析结果 */
export interface PoseResult {
  video_info: VideoInfo
  detected_frames: number
  person_instances: number
  avg_keypoint_confidence: number
}

/** 箭头检测结果 */
export interface DetectResult {
  video_info: VideoInfo
  detection_count: number
}

/** 三种接口统一的返回结构 */
export interface AiAnalyzeResponse<T> {
  status: string
  output_video_url: string
  preview_url: string
  detection_results: T
}

/** 健康检查返回 */
export interface AiHealthResponse {
  status: string
  models_ready: boolean
  weights: Record<string, boolean>
  weights_dir: string
  error: string | null
}

/** 把后端返回的相对路径（/media/xxx）拼成浏览器可请求的地址 */
export function resolveAssetUrl(path: string): string {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  return `${AI_BACKEND_BASE}${path.startsWith('/') ? path : `/${path}`}`
}

/** 前端侧的文件前置校验，返回错误文案；通过则返回 null */
export function validateVideoFile(file: File): string | null {
  const name = file.name.toLowerCase()
  const ext = name.slice(name.lastIndexOf('.'))
  if (!SUPPORTED_VIDEO_EXTENSIONS.includes(ext)) {
    return `不支持的格式 ${ext || '(无扩展名)'}，请上传 ${SUPPORTED_VIDEO_EXTENSIONS.join(' / ')}`
  }
  const sizeMb = file.size / 1024 / 1024
  if (sizeMb > MAX_VIDEO_SIZE_MB) {
    return `文件 ${sizeMb.toFixed(1)}MB 超出上限 ${MAX_VIDEO_SIZE_MB}MB`
  }
  return null
}

/** 健康检查：确认后端服务与模型是否就绪 */
export async function getAiHealth(): Promise<AiHealthResponse> {
  const { data } = await aiClient.get<AiHealthResponse>('/health', { timeout: 8000 })

  // 生产构建若未配置反向代理，/ai-api/health 会命中前端静态资源（返回 index.html），
  // 此时 axios 也能拿到 200，但拿到的是一段 HTML 字符串。这里做结构校验，
  // 避免把"没连上后端"误报成"模型未就绪"。
  if (!data || typeof data.models_ready !== 'boolean') {
    throw new Error('/health 返回的不是预期的健康检查数据，请确认 /ai-api 已代理到后端服务')
  }
  return data
}

/**
 * 上传视频并执行识别
 * @param file 视频文件
 * @param mode 识别模式
 * @param onProgress 上传进度回调（0-100）
 */
export async function analyzeVideo<T = TrackingResult>(
  file: File,
  mode: AiAnalyzeMode,
  onProgress?: (percent: number) => void,
): Promise<AiAnalyzeResponse<T>> {
  const endpoint =
    mode === 'count' ? '/upload/arrow/tracked' : mode === 'pose' ? '/upload/pose' : '/upload/arrow'

  const form = new FormData()
  form.append('file', file)

  const { data } = await aiClient.post<AiAnalyzeResponse<T>>(endpoint, form, {
    onUploadProgress: (event: AxiosProgressEvent) => {
      if (!onProgress) return
      const total = event.total ?? file.size
      if (!total) return
      const percent = Math.min(99, Math.round((event.loaded / total) * 100))
      onProgress(percent)
    },
  })

  return data
}
