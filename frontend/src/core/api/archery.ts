/**
 * @fileoverview 射箭分析API接口
 * @module core/api/archery
 * @description 提供射箭分析相关的API接口，包括统计数据、视频上传、分析详情等
 * @author HeZaoCha
 * @date 2026-01-10
 * @dependencies @/core/api/request, @/types/archery
 */

import { get, post } from './request'
import type {
  ArcheryStats,
  ArcheryDetail,
  UploadArcheryVideoRequest,
  UploadArcheryVideoResponse,
} from '@/types/archery'
import { logger } from '@/core/logger'

/**
 * 获取最近射箭分析统计数据（首页展示用）
 * @returns 返回稳定性、偏差值、分析次数等数据
 * @description 获取用户最近的射箭分析统计数据，用于首页展示
 * @example
 * ```typescript
 * const stats = await getArcheryStats()
 * console.log(stats.stability) // 平均撒放稳定性
 * ```
 */
export function getArcheryStats(): Promise<ArcheryStats> {
  logger.debug('获取射箭统计数据', {
    context: {
      module: 'api',
      function: 'getArcheryStats',
    },
  })
  // 注意：baseURL已经包含/api，所以这里只需要/archery/stats
  return get<ArcheryStats>('/archery/stats')
    .then((result) => {
      logger.debug('获取射箭统计数据成功', {
        context: {
          module: 'api',
          function: 'getArcheryStats',
        },
        data: {
          analysisCount: result.analysisCount,
          stability: result.stability,
        },
      })
      return result
    })
    .catch((error) => {
      logger.error('获取射箭统计数据失败', {
        context: {
          module: 'api',
          function: 'getArcheryStats',
        },
        error: error instanceof Error ? error : new Error(String(error)),
      })
      throw error
    })
}

/**
 * 上传射箭视频（用于分析）
 * @param formData 包含射箭人视频和箭靶视频的FormData对象
 * @returns 返回分析任务ID
 * @description 上传射箭视频文件，系统将进行自动分析并返回任务ID
 * @example
 * ```typescript
 * const formData = new FormData()
 * formData.append('archerVideo', archerFile)
 * formData.append('targetVideo', targetFile)
 * formData.append('note', '测试视频')
 * const result = await uploadArcheryVideo(formData)
 * console.log(result.taskId) // 分析任务ID
 * ```
 */
export function uploadArcheryVideo(
  formData: UploadArcheryVideoRequest | FormData,
): Promise<UploadArcheryVideoResponse> {
  // 如果传入的是UploadArcheryVideoRequest对象，转换为FormData
  let requestFormData: FormData
  if (formData instanceof FormData) {
    requestFormData = formData
  } else {
    requestFormData = new FormData()
    requestFormData.append('archerVideo', formData.archerVideo)
    requestFormData.append('targetVideo', formData.targetVideo)
    if (formData.note) {
      requestFormData.append('note', formData.note)
    }
  }

  logger.info('上传射箭视频', {
    context: {
      module: 'api',
      function: 'uploadArcheryVideo',
    },
    data: {
      hasArcherVideo:
        formData instanceof FormData ? formData.has('archerVideo') : !!formData.archerVideo,
      hasTargetVideo:
        formData instanceof FormData ? formData.has('targetVideo') : !!formData.targetVideo,
      note: formData instanceof FormData ? formData.get('note') : formData.note,
    },
  })

  // FormData会自动设置Content-Type为multipart/form-data，无需手动设置
  // 直接调用post函数，axios会自动识别FormData并设置正确的headers
  // 注意：baseURL已经包含/api，所以这里只需要/archery/upload
  return post<UploadArcheryVideoResponse>('/archery/upload', requestFormData)
    .then((result) => {
      logger.info('上传射箭视频成功', {
        context: {
          module: 'api',
          function: 'uploadArcheryVideo',
        },
        data: {
          taskId: result.taskId,
        },
      })
      return result
    })
    .catch((error) => {
      logger.error('上传射箭视频失败', {
        context: {
          module: 'api',
          function: 'uploadArcheryVideo',
        },
        error: error instanceof Error ? error : new Error(String(error)),
      })
      throw error
    })
}

/**
 * 获取单条射箭分析的详细数据
 * @param taskId 分析任务ID
 * @returns 返回详细的撒放轨迹、偏差分析等数据
 * @description 根据任务ID获取射箭分析的详细数据，包括命中点、轨迹等
 * @example
 * ```typescript
 * const detail = await getArcheryDetail('task-123')
 * console.log(detail.hitPoints) // 命中点列表
 * console.log(detail.trajectory) // 撒放轨迹
 * ```
 */
export function getArcheryDetail(taskId: string): Promise<ArcheryDetail> {
  logger.debug('获取射箭分析详情', {
    context: {
      module: 'api',
      function: 'getArcheryDetail',
    },
    data: {
      taskId,
    },
  })
  // 注意：baseURL已经包含/api，所以这里只需要/archery/detail/${taskId}
  return get<ArcheryDetail>(`/archery/detail/${taskId}`)
    .then((result) => {
      logger.debug('获取射箭分析详情成功', {
        context: {
          module: 'api',
          function: 'getArcheryDetail',
        },
        data: {
          taskId: result.taskId,
          hitPointsCount: result.hitPoints?.length || 0,
          trajectoryPointsCount: result.trajectory?.length || 0,
        },
      })
      return result
    })
    .catch((error) => {
      logger.error('获取射箭分析详情失败', {
        context: {
          module: 'api',
          function: 'getArcheryDetail',
        },
        error: error instanceof Error ? error : new Error(String(error)),
        data: {
          taskId,
        },
      })
      throw error
    })
}
