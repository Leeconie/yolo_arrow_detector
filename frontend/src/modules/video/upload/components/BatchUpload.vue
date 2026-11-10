<template>
  <div class="batch-upload">
    <!-- 文件选择区域 -->
    <div
      class="upload-drop-zone"
      :class="{ 'drag-over': isDragOver }"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
    >
      <div class="drop-zone-content">
        <el-icon size="48" class="upload-icon">
          <Upload />
        </el-icon>
        <h3 class="drop-title">拖拽文件到此处或点击选择</h3>
        <p class="drop-subtitle">支持同时选择多个视频文件</p>
        <el-button type="primary" size="large" @click="triggerFileSelect"> 选择文件 </el-button>
      </div>
      <input
        ref="fileInputRef"
        type="file"
        multiple
        accept="video/*"
        class="file-input"
        @change="handleFileSelect"
      />
    </div>

    <!-- 批量控制面板 -->
    <div v-if="totalTasks > 0" class="batch-controls">
      <div class="batch-stats">
        <span class="stat-item">总计: {{ totalTasks }}</span>
        <span class="stat-item">进行中: {{ uploadingTasks.length }}</span>
        <span class="stat-item">已完成: {{ completedTasks.length }}</span>
        <span class="stat-item">失败: {{ failedTasks.length }}</span>
      </div>

      <div class="control-buttons">
        <el-button type="primary" :disabled="state.isRunning" @click="startBatch">
          <el-icon><VideoPlay /></el-icon>
          开始上传
        </el-button>

        <el-button type="warning" :disabled="!state.isRunning" @click="pauseBatch">
          <el-icon><VideoPause /></el-icon>
          暂停全部
        </el-button>

        <el-button type="danger" @click="cancelBatch">
          <el-icon><Close /></el-icon>
          取消全部
        </el-button>
      </div>
    </div>

    <!-- 上传队列 -->
    <div v-if="totalTasks > 0" class="upload-queue">
      <div
        v-for="task in state.tasks"
        :key="task.id"
        class="upload-item"
        :class="`upload-item--${task.status}`"
      >
        <!-- 文件信息 -->
        <div class="file-info">
          <el-icon class="file-icon" size="20">
            <VideoPlay v-if="task.videoType === videoTypeEnum.HUMAN" />
            <Aim v-else />
          </el-icon>

          <div class="file-details">
            <div class="filename">{{ task.file.name }}</div>
            <div class="file-meta">
              {{ formatFileSize(task.file.size) }}
              <span v-if="task.speed > 0"> • {{ formatSpeed(task.speed) }}/s </span>
            </div>
          </div>
        </div>

        <!-- 进度条 -->
        <div class="progress-section">
          <el-progress
            :percentage="task.progress"
            :status="getProgressStatus(task.status)"
            :show-text="false"
            stroke-width="6"
            class="upload-progress"
          />
          <div class="progress-text">
            {{ Math.round(task.progress) }}%
            <span v-if="task.estimatedTime > 0"> • 剩余 {{ formatTime(task.estimatedTime) }} </span>
          </div>
        </div>

        <!-- 状态指示器 -->
        <div class="status-indicator">
          <el-tag :type="getStatusType(task.status)" size="small">
            {{ getStatusText(task.status) }}
          </el-tag>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <el-button
            v-if="task.status === 'failed'"
            size="small"
            type="warning"
            @click="retryTask(task.id)"
            :title="'重试上传 ' + task.file.name"
          >
            <el-icon><Refresh /></el-icon>
          </el-button>

          <el-button
            size="small"
            type="danger"
            @click="handleRemoveTask(task.id)"
            :title="'移除 ' + task.file.name"
          >
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </div>
    </div>

    <!-- 总体进度 -->
    <div v-if="totalTasks > 0" class="overall-progress">
      <div class="progress-summary">
        <span>总体进度: {{ Math.round(state.totalProgress) }}%</span>
        <span v-if="state.averageSpeed > 0">
          平均速度: {{ formatSpeed(state.averageSpeed) }}/s
        </span>
        <span v-if="state.estimatedTimeRemaining > 0">
          预计完成: {{ formatTime(state.estimatedTimeRemaining) }}
        </span>
      </div>

      <el-progress
        :percentage="state.totalProgress"
        status="success"
        stroke-width="8"
        class="overall-progress-bar"
      />
    </div>

    <!-- 持久化状态提示 -->
    <div v-if="persistenceReady && savedStatesCount > 0" class="persistence-notice">
      <el-alert type="info" :closable="false" show-icon class="persistence-alert">
        <template #title>
          <span>发现未完成的上传任务</span>
        </template>
        <span
          >系统检测到 {{ savedStatesCount }} 个之前未完成的上传任务，已自动恢复到上传队列中。</span
        >
        <template #description>
          <el-button size="small" type="primary" @click="clearSavedStates">
            清除所有保存状态
          </el-button>
        </template>
      </el-alert>
    </div>

    <!-- 空状态提示 -->
    <div v-if="totalTasks === 0" class="empty-state">
      <el-empty description="暂无上传任务">
        <template #image>
          <el-icon size="64" class="empty-icon"><Upload /></el-icon>
        </template>
      </el-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview 批量上传组件
 * @module modules/video/upload/components/BatchUpload
 * @author HeZaoCha
 * @date 2026-01-11
 * @description 批量文件上传UI组件，支持拖拽上传、进度显示、并发控制等功能
 * @dependencies vue, element-plus, @element-plus/icons-vue, ./composables/useBatchUpload
 */

import { ref, onMounted, watchEffect } from 'vue'
import { Upload, VideoPlay, VideoPause, Close, Refresh, Aim } from '@element-plus/icons-vue'
import { useBatchUpload, UploadTaskStatus } from '../composables/useBatchUpload'
import { useUploadPersistence } from '../composables/useUploadPersistence'
import type { VideoType } from '../types/uploadTypes'
import { VideoType as VideoTypeEnum } from '../types/uploadTypes'
import { ElMessage, ElMessageBox } from 'element-plus'

// 组件Props
interface Props {
  /** 视频类型 */
  videoType?: VideoType
  /** 最大并发数 */
  maxConcurrent?: number
  /** 是否自动开始上传 */
  autoStart?: boolean
}

// 上传结果类型 - 暂时未使用，将来扩展时添加
// interface UploadResult {
//   fileId: string
//   success: boolean
//   error?: string
// }

const props = withDefaults(defineProps<Props>(), {
  maxConcurrent: 3,
  autoStart: true,
})

// 组件Emits - 暂时未使用，将来扩展时添加
// const emit = defineEmits<{
//   /** 上传完成事件 */
//   uploadComplete: [results: UploadResult[]]
//   /** 上传失败事件 */
//   uploadError: [error: Error]
// }>()

// 模板引用
const fileInputRef = ref<HTMLInputElement>()

// 拖拽状态
const isDragOver = ref(false)

// 持久化状态计数
const savedStatesCount = ref(0)

// 为模板提供枚举访问
const videoTypeEnum = VideoTypeEnum

// 使用批量上传组合式函数
const {
  state,
  totalTasks,
  uploadingTasks,
  completedTasks,
  failedTasks,
  addFiles,
  startBatch,
  pauseBatch,
  cancelBatch,
  removeTask,
  retryTask,
} = useBatchUpload({
  maxConcurrent: props.maxConcurrent,
  autoStart: props.autoStart,
})

// 使用上传状态持久化
const {
  isReady: persistenceReady,
  saveUploadState,
  restoreUploadStates,
  deleteUploadState,
  clearAllStates,
} = useUploadPersistence()

// 状态变化时自动保存
watchEffect(async () => {
  if (persistenceReady.value) {
    // 只保存正在进行中的任务状态
    const activeTasks = state.tasks.filter(
      (task) => task.status === 'uploading' || task.status === 'paused',
    )

    for (const task of activeTasks) {
      try {
        await saveUploadState({
          id: task.id,
          fileName: task.file.name,
          fileSize: task.file.size,
          progress: task.progress,
          status: task.status as
            | 'pending'
            | 'uploading'
            | 'paused'
            | 'completed'
            | 'failed'
            | 'cancelled',
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
          retryCount: task.retryCount,
          error: task.error ? task.error.message : undefined,
          chunksTotal: task.chunks?.length,
          chunksUploaded: task.chunks?.filter((chunk) => chunk.uploaded).length,
        })
      } catch (error) {
        console.warn('保存上传状态失败:', error)
      }
    }
  }
})

// 组件挂载时恢复状态
onMounted(async () => {
  if (persistenceReady.value) {
    try {
      const savedStates = await restoreUploadStates()
      if (savedStates.length > 0) {
        ElMessage.info(`发现 ${savedStates.length} 个未完成的上传任务，正在恢复...`)

        // 恢复每个保存的状态
        for (const savedState of savedStates) {
          // 创建占位文件对象（用于UI显示）
          const placeholderFile = new File([], savedState.fileName)
          Object.defineProperty(placeholderFile, '_restoredState', {
            value: savedState,
            enumerable: false,
          })

          // 添加到上传队列
          await addFiles([placeholderFile], props.videoType)

          // 恢复任务状态（如果需要的话）
          // 注意：实际的文件内容已经上传，这里只恢复UI状态
        }

        savedStatesCount.value = savedStates.length
        ElMessage.success(`已恢复 ${savedStates.length} 个上传任务`)
      }
    } catch (error) {
      console.warn('恢复上传状态失败:', error)
      ElMessage.warning('无法恢复之前的上传状态')
    }
  }
})

/**
 * 移除任务（包含持久化清理）
 */
async function handleRemoveTask(taskId: string): Promise<void> {
  removeTask(taskId)

  // 同时删除持久化状态
  if (persistenceReady.value) {
    try {
      await deleteUploadState(taskId)
      savedStatesCount.value = Math.max(0, savedStatesCount.value - 1)
    } catch (error) {
      console.warn('删除持久化状态失败:', error)
    }
  }
}

/**
 * 清除所有保存的状态
 */
async function clearSavedStates(): Promise<void> {
  if (!persistenceReady.value) return

  try {
    await ElMessageBox.confirm('确定要清除所有保存的上传状态吗？此操作不可恢复。', '确认清除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    // 清除所有持久化状态
    await clearAllStates()
    savedStatesCount.value = 0

    ElMessage.success('已清除所有保存的上传状态')
  } catch (error) {
    if (error !== 'cancel') {
      console.warn('清除保存状态失败:', error)
      ElMessage.error('清除保存状态失败')
    }
  }
}

/**
 * 触发文件选择
 */
function triggerFileSelect(): void {
  fileInputRef.value?.click()
}

/**
 * 处理文件选择
 */
function handleFileSelect(event: Event): void {
  const target = event.target as HTMLInputElement
  const files = target.files

  if (files && files.length > 0) {
    const fileList = Array.from(files)
    addFiles(fileList, props.videoType)

    // 清空input值，允许选择相同文件
    target.value = ''

    ElMessage.success(`已添加 ${fileList.length} 个文件到上传队列`)
  }
}

/**
 * 处理拖拽进入
 */
function handleDragOver(): void {
  isDragOver.value = true
}

/**
 * 处理拖拽离开
 */
function handleDragLeave(): void {
  isDragOver.value = false
}

/**
 * 处理文件拖拽释放
 */
function handleDrop(event: DragEvent): void {
  isDragOver.value = false

  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    const fileList = Array.from(files).filter(
      (file) =>
        file.type.startsWith('video/') || file.name.match(/\.(mp4|avi|mov|mkv|wmv|flv|webm|m4v)$/i),
    )

    if (fileList.length > 0) {
      addFiles(fileList, props.videoType)
      ElMessage.success(`已添加 ${fileList.length} 个视频文件`)
    } else {
      ElMessage.warning('未找到有效的视频文件')
    }
  }
}

/**
 * 获取进度条状态
 */
function getProgressStatus(status: UploadTaskStatus): string | undefined {
  switch (status) {
    case UploadTaskStatus.COMPLETED:
      return 'success'
    case UploadTaskStatus.FAILED:
      return 'exception'
    default:
      return undefined
  }
}

/**
 * 获取状态标签类型
 */
function getStatusType(status: UploadTaskStatus): string {
  switch (status) {
    case UploadTaskStatus.PENDING:
      return 'info'
    case UploadTaskStatus.UPLOADING:
      return 'primary'
    case UploadTaskStatus.PAUSED:
      return 'warning'
    case UploadTaskStatus.COMPLETED:
      return 'success'
    case UploadTaskStatus.FAILED:
      return 'danger'
    case UploadTaskStatus.CANCELLED:
      return 'info'
    default:
      return 'info'
  }
}

/**
 * 获取状态文本
 */
function getStatusText(status: UploadTaskStatus): string {
  switch (status) {
    case UploadTaskStatus.PENDING:
      return '等待中'
    case UploadTaskStatus.UPLOADING:
      return '上传中'
    case UploadTaskStatus.PAUSED:
      return '已暂停'
    case UploadTaskStatus.COMPLETED:
      return '已完成'
    case UploadTaskStatus.FAILED:
      return '失败'
    case UploadTaskStatus.CANCELLED:
      return '已取消'
    default:
      return '未知'
  }
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

/**
 * 格式化速度
 */
function formatSpeed(bytesPerSecond: number): string {
  return formatFileSize(bytesPerSecond)
}

/**
 * 格式化时间
 */
function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}秒`
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    return `${minutes}分${remainingSeconds}秒`
  } else {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}时${minutes}分`
  }
}

// 监听上传完成
onMounted(() => {
  // 可以在这里添加上传完成后的处理逻辑
})
</script>

<style scoped>
.batch-upload {
  max-width: 1000px;
  margin: 0 auto;
}

/* 文件拖拽区域 */
.upload-drop-zone {
  border: 2px dashed var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  padding: 40px;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
  background: var(--el-bg-color);
}

.upload-drop-zone:hover {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.upload-drop-zone.drag-over {
  border-color: var(--el-color-success);
  background: var(--el-color-success-light-9);
  transform: scale(1.02);
}

.drop-zone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.upload-icon {
  color: var(--el-text-color-secondary);
}

.drop-title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.drop-subtitle {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.file-input {
  display: none;
}

/* 批量控制面板 */
.batch-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 24px 0;
  padding: 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--el-border-radius-base);
}

.batch-stats {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.stat-item {
  padding: 4px 8px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
}

.control-buttons {
  display: flex;
  gap: 12px;
}

/* 上传队列 */
.upload-queue {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.upload-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--el-border-radius-base);
  background: var(--el-bg-color);
  transition: all 0.2s ease;
}

.upload-item:hover {
  box-shadow: var(--el-box-shadow-light);
  border-color: var(--el-border-color);
}

.upload-item--uploading {
  border-left: 4px solid var(--el-color-primary);
}

.upload-item--completed {
  border-left: 4px solid var(--el-color-success);
  opacity: 0.8;
}

.upload-item--failed {
  border-left: 4px solid var(--el-color-danger);
}

.upload-item--paused {
  border-left: 4px solid var(--el-color-warning);
}

.file-info {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.file-icon {
  margin-right: 12px;
  flex-shrink: 0;
}

.file-details {
  flex: 1;
  min-width: 0;
}

.filename {
  font-weight: 500;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}

.file-meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.progress-section {
  width: 200px;
  margin: 0 24px;
}

.upload-progress {
  margin-bottom: 4px;
}

.progress-text {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

.status-indicator {
  width: 80px;
  text-align: center;
}

.action-buttons {
  display: flex;
  gap: 8px;
  margin-left: 16px;
}

/* 总体进度 */
.overall-progress {
  margin-top: 24px;
  padding: 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--el-border-radius-base);
}

.progress-summary {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.overall-progress-bar {
  width: 100%;
}

/* 空状态 */
.empty-state {
  margin-top: 40px;
}

.empty-icon {
  color: var(--el-text-color-disabled);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .upload-drop-zone {
    padding: 24px;
  }

  .batch-controls {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .batch-stats {
    justify-content: center;
    flex-wrap: wrap;
  }

  .control-buttons {
    justify-content: center;
  }

  .upload-item {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .progress-section {
    width: 100%;
    margin: 0;
  }

  .status-indicator,
  .action-buttons {
    align-self: center;
  }

  .progress-summary {
    flex-direction: column;
    gap: 8px;
    align-items: center;
  }
}
</style>
