<template>
  <div class="video-uploader">
    <!-- 上传区域 -->
    <div
      ref="uploadAreaRef"
      class="upload-area"
      :class="{
        'upload-area--dragging': isDragging,
        'upload-area--uploading': isUploading,
        'upload-area--success': uploadSuccess,
        'upload-area--error': uploadError,
        'upload-area--disabled': disabled,
      }"
      role="button"
      tabindex="0"
      :aria-label="`点击或拖拽文件到此处上传视频${currentFile ? `，当前文件：${currentFile.name}` : ''}`"
      :aria-describedby="uploadHintId"
      @click="handleAreaClick"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
      @keydown.enter.space.prevent="handleAreaClick"
    >
      <!-- 隐藏的文件输入 -->
      <input
        ref="fileInputRef"
        type="file"
        :accept="accept"
        class="upload-area__input"
        @change="handleFileInputChange"
      />

      <!-- 空状态 -->
      <div v-if="!currentFile && !isUploading" class="upload-area__empty">
        <div class="upload-area__icon">
          <svg class="icon-upload" viewBox="0 0 1024 1024" aria-hidden="true">
            <path
              d="M544 160v320h160L512 672 320 480h160V160z m320 640H160v-64h704v64z"
              fill="currentColor"
            />
          </svg>
          <div class="icon-circle"></div>
        </div>
        <div class="upload-area__text">
          <p class="upload-area__primary-text">点击或拖拽视频文件到此处</p>
          <p :id="uploadHintId" class="upload-area__hint-text">
            支持格式：{{ allowedFormats.join('、') }} | 最大：{{ maxSizeText }}
          </p>
        </div>
      </div>

      <!-- 文件已选择 -->
      <div v-else-if="currentFile && !isUploading" class="upload-area__file-info">
        <div class="file-icon">
          <svg viewBox="0 0 1024 1024" aria-hidden="true">
            <path
              d="M854.6 288.6L639.4 73.4c-6-6-14.1-9.4-22.6-9.4H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V311.3c0-8.5-3.4-16.7-9.4-22.7zM790.2 326H602V137.8L790.2 326z m1.8 562H232V136h302v216c0 23.2 18.8 42 42 42h216v494z"
              fill="currentColor"
            />
          </svg>
        </div>
        <div class="file-details">
          <p class="file-name">{{ currentFile.name }}</p>
          <p class="file-size">{{ formatSize(currentFile.size) }}</p>
        </div>
        <button
          class="file-remove"
          type="button"
          aria-label="移除文件"
          @click.stop="handleRemoveFile"
        >
          <svg viewBox="0 0 1024 1024" aria-hidden="true">
            <path
              d="M563.8 512l262.5-312.9c4.4-5.2.7-13.1-6.1-13.1h-79.8c-4.7 0-9.2 2.1-12.3 5.7L511.6 449.8 295.1 191.7c-3-3.6-7.5-5.7-12.3-5.7H203c-6.8 0-10.5 7.9-6.1 13.1L459.4 512 196.9 824.9c-4.4 5.2-.7 13.1 6.1 13.1h79.8c4.7 0 9.2-2.1 12.3-5.7l216.5-258.1 216.5 258.1c3 3.6 7.5 5.7 12.3 5.7h79.8c6.8 0 10.5-7.9 6.1-13.1L563.8 512z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>

      <!-- 上传中 -->
      <div v-else-if="isUploading && currentTask" class="upload-area__uploading">
        <div class="uploading-progress">
          <svg class="progress-circle" viewBox="0 0 100 100" aria-hidden="true">
            <circle
              class="progress-circle__bg"
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke-width="6"
            />
            <circle
              class="progress-circle__bar"
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke-width="6"
              :stroke-dasharray="`${currentTask.progress.percentage * 2.827}, 282.7`"
            />
          </svg>
          <div class="progress-text">
            <span class="progress-percentage"
              >{{ Math.round(currentTask.progress.percentage) }}%</span
            >
          </div>
        </div>
        <div class="uploading-info">
          <p class="uploading-status">{{ uploadingStatusText }}</p>
          <div class="uploading-details">
            <span class="detail-item">
              <svg class="detail-icon" viewBox="0 0 1024 1024" aria-hidden="true">
                <path
                  d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z m0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z m-40-474H352c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8h120v180c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V444c0-4.4-3.6-8-8-8h-56z"
                  fill="currentColor"
                />
              </svg>
              {{ formatTime(currentTask.progress.remainingTime) }}
            </span>
            <span class="detail-item">
              <svg class="detail-icon" viewBox="0 0 1024 1024" aria-hidden="true">
                <path
                  d="M888 792H200V168c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v688c0 4.4 3.6 8 8 8h752c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8z"
                  fill="currentColor"
                />
              </svg>
              {{ formatSpeed(currentTask.progress.speed) }}
            </span>
            <span class="detail-item">
              {{ formatSize(currentTask.progress.loaded) }} /
              {{ formatSize(currentTask.progress.total) }}
            </span>
          </div>
        </div>
      </div>

      <!-- 成功状态 -->
      <div v-else-if="uploadSuccess" class="upload-area__success">
        <div class="success-icon">
          <svg viewBox="0 0 1024 1024" aria-hidden="true">
            <path
              d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z m193.5 301.7l-210.6 292c-12.7 17.7-39 17.7-51.7 0L318.5 484.9c-3.8-5.3 0-12.7 6.5-12.7h46.9c10.2 0 19.9 4.9 25.9 13.3l71.2 98.8 157.2-218c6-8.3 15.6-13.3 25.9-13.3H699c6.5 0 10.3 7.4 6.5 12.7z"
              fill="currentColor"
            />
          </svg>
        </div>
        <p class="success-text">上传成功！</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="uploadError" class="upload-area__error">
        <div class="error-icon">
          <svg viewBox="0 0 1024 1024" aria-hidden="true">
            <path
              d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z m165.4 618.2l-66-.3L512 563.4l-99.3 118.4-66.1.3c-4.4 0-8-3.5-8-8 0-1.9.7-3.7 1.9-5.2l130.1-155L340.5 359c-1.2-1.5-1.9-3.3-1.9-5.2 0-4.4 3.6-8 8-8l66.1.3L512 464.6l99.3-118.4 66-.3c4.4 0 8 3.5 8 8 0 1.9-.7 3.7-1.9 5.2L553.5 514l130 155c1.2 1.5 1.9 3.3 1.9 5.2 0 4.4-3.6 8-8 8z"
              fill="currentColor"
            />
          </svg>
        </div>
        <p class="error-text">上传失败</p>
        <button class="retry-button" type="button" @click.stop="handleRetry">重试</button>
      </div>
    </div>

    <!-- 控制按钮 -->
    <div v-if="showControls" class="upload-controls" role="group" aria-label="上传控制">
      <button
        v-if="currentTask?.status === 'uploading'"
        class="control-button control-button--pause"
        type="button"
        @click="handlePause"
      >
        <svg viewBox="0 0 1024 1024" aria-hidden="true">
          <path d="M304 176h80v672h-80z m336 0h80v672h-80z" fill="currentColor" />
        </svg>
        <span>暂停</span>
      </button>
      <button
        v-else-if="currentTask?.status === 'paused'"
        class="control-button control-button--resume"
        type="button"
        @click="handleResume"
      >
        <svg viewBox="0 0 1024 1024" aria-hidden="true">
          <path
            d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z m0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"
            fill="currentColor"
          />
          <path
            d="M719.4 499.1l-296.1-215c-7.5-5.4-17.3-.5-17.3 8.9v430c0 9.4 9.8 14.3 17.3 8.9l296.1-215c6.2-4.5 6.2-13.4 0-17.8z"
            fill="currentColor"
          />
        </svg>
        <span>继续</span>
      </button>
      <button
        v-if="currentTask && currentTask.status !== 'success'"
        class="control-button control-button--cancel"
        type="button"
        @click="handleCancel"
      >
        <svg viewBox="0 0 1024 1024" aria-hidden="true">
          <path
            d="M563.8 512l262.5-312.9c4.4-5.2.7-13.1-6.1-13.1h-79.8c-4.7 0-9.2 2.1-12.3 5.7L511.6 449.8 295.1 191.7c-3-3.6-7.5-5.7-12.3-5.7H203c-6.8 0-10.5 7.9-6.1 13.1L459.4 512 196.9 824.9c-4.4 5.2-.7 13.1 6.1 13.1h79.8c4.7 0 9.2-2.1 12.3-5.7l216.5-258.1 216.5 258.1c3 3.6 7.5 5.7 12.3 5.7h79.8c6.8 0 10.5-7.9 6.1-13.1L563.8 512z"
            fill="currentColor"
          />
        </svg>
        <span>取消</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview 视频上传组件 - UI重构版
 * @module modules/video/upload/components/VideoUploader
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 提供视频文件上传功能，采用现代化UI设计，支持拖拽上传、分片上传、进度显示、断点续传
 * @dependencies vue, element-plus, ./composables/useVideoUpload, ./types/uploadTypes
 * @accessibility 支持键盘导航和屏幕阅读器
 */

import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useVideoUpload } from '../composables/useVideoUpload'
import type { UploadConfig, VideoType, UploadTask } from '../types/uploadTypes'
import { logger } from '@/core/logger'

// 格式化时间（秒转时分秒）
function formatTime(seconds: number): string {
  if (seconds === 0 || !isFinite(seconds)) {
    return '--:--'
  }

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

/**
 * 组件Props
 */
interface Props {
  /** 接受的文件类型 */
  accept?: string
  /** 最大文件大小（字节） */
  maxSize?: number
  /** 允许的文件格式 */
  allowedFormats?: string[]
  /** 分片大小（字节） */
  chunkSize?: number
  /** 是否启用断点续传 */
  enableResume?: boolean
  /** 是否禁用 */
  disabled?: boolean
}

/**
 * 组件Emits
 */
interface Emits {
  /** 上传成功事件 */
  (e: 'upload-success', videoId: string): void
  /** 上传失败事件 */
  (e: 'upload-error', error: Error): void
  /** 文件选择事件 */
  (e: 'file-change', file: File | null): void
}

const props = withDefaults(defineProps<Props>(), {
  accept: '.mp4,.avi,.mov,.mkv',
  maxSize: 512 * 1024 * 1024, // 512MB
  allowedFormats: () => ['MP4', 'AVI', 'MOV', 'MKV'],
  chunkSize: 5 * 1024 * 1024, // 5MB
  enableResume: true,
  disabled: false,
})

const emit = defineEmits<Emits>()

// Refs
const uploadAreaRef = ref<HTMLDivElement>()
const fileInputRef = ref<HTMLInputElement>()
const uploadHintId = 'upload-hint-' + Math.random().toString(36).substr(2, 9)

// 状态
const currentFile = ref<File | null>(null)
const isDragging = ref(false)
const uploadSuccess = ref(false)
const uploadError = ref(false)

/**
 * 上传配置
 */
const uploadConfig: UploadConfig = {
  maxSize: props.maxSize,
  allowedFormats: props.allowedFormats.map((f) => f.toLowerCase()),
  chunkSize: props.chunkSize,
  enableResume: props.enableResume,
}

/**
 * 使用视频上传组合式函数
 */
const { currentTask, isUploading, upload, pause, resume, cancel, clear } = useVideoUpload(
  uploadConfig,
  {
    onSuccess: (task, videoId) => {
      uploadSuccess.value = true
      uploadError.value = false
      ElMessage.success('视频上传成功！')
      emit('upload-success', videoId)

      // 3秒后自动清除成功状态
      setTimeout(() => {
        clear()
        currentFile.value = null
        uploadSuccess.value = false
      }, 3000)
    },
    onError: async (task, error) => {
      uploadSuccess.value = false
      uploadError.value = true

      // 使用用户友好的错误消息
      const { getUserFriendlyUploadError } = await import('@/core/api/user-friendly-errors')
      const fileSize = currentFile.value?.size
      const maxSize = props.maxSize
      const userFriendlyMessage = getUserFriendlyUploadError(error, fileSize, maxSize)

      ElMessage.error(userFriendlyMessage)
      emit('upload-error', error)
    },
  },
)

// 计算属性
const maxSizeText = computed(() => {
  const sizeMB = props.maxSize / 1024 / 1024
  return `${sizeMB}MB`
})

const uploadingStatusText = computed(() => {
  if (!currentTask.value) return ''

  const status = currentTask.value.status
  if (status === 'uploading') return '正在上传...'
  if (status === 'paused') return '已暂停'
  if (status === 'pending') return '准备上传...'
  return ''
})

const showControls = computed(() => {
  return currentTask.value && currentTask.value.status !== 'success' && !uploadSuccess.value
})

// 监听上传状态
watch(
  () => currentTask.value?.status,
  (status) => {
    if (status === 'failed') {
      uploadError.value = true
    }
  },
)

/**
 * 格式化文件大小
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes}B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)}KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`
}

/**
 * 格式化上传速度
 */
function formatSpeed(bytesPerSecond: number): string {
  return `${formatSize(bytesPerSecond)}/s`
}

/**
 * 处理区域点击
 */
function handleAreaClick(): void {
  if (props.disabled || isUploading.value) return
  fileInputRef.value?.click()
}

/**
 * 处理文件输入变更
 */
function handleFileInputChange(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (file) {
    setCurrentFile(file)
  }

  // 重置input以允许选择相同文件
  input.value = ''
}

/**
 * 处理拖拽悬停
 */
function handleDragOver(event: DragEvent): void {
  if (props.disabled || isUploading.value) return

  event.dataTransfer!.dropEffect = 'copy'
  isDragging.value = true
}

/**
 * 处理拖拽离开
 */
function handleDragLeave(): void {
  isDragging.value = false
}

/**
 * 处理文件拖放
 */
function handleDrop(event: DragEvent): void {
  isDragging.value = false

  if (props.disabled || isUploading.value) return

  const file = event.dataTransfer?.files[0]
  if (file) {
    setCurrentFile(file)
  }
}

/**
 * 设置当前文件
 */
function setCurrentFile(file: File): void {
  currentFile.value = file
  uploadSuccess.value = false
  uploadError.value = false
  emit('file-change', file)

  logger.info('文件已选择', {
    context: {
      module: 'video.upload',
      function: 'setCurrentFile',
      component: 'VideoUploader',
    },
    data: {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    },
  })
}

/**
 * 处理移除文件
 */
function handleRemoveFile(): void {
  currentFile.value = null
  uploadSuccess.value = false
  uploadError.value = false
  clear()
  emit('file-change', null)
}

/**
 * 开始上传
 */
async function startUpload(videoType?: VideoType): Promise<void> {
  if (!currentFile.value) {
    ElMessage.warning('请先选择视频文件')
    return
  }

  uploadSuccess.value = false
  uploadError.value = false

  try {
    await upload(currentFile.value, videoType)
  } catch (error) {
    logger.error('视频上传失败', {
      context: {
        module: 'video.upload',
        function: 'startUpload',
        component: 'VideoUploader',
      },
      error: error instanceof Error ? error : new Error(String(error)),
      data: {
        fileName: currentFile.value?.name,
        fileSize: currentFile.value?.size,
        videoType,
      },
    })
  }
}

/**
 * 处理暂停
 */
function handlePause(): void {
  pause()
  ElMessage.info('上传已暂停')
}

/**
 * 处理恢复上传
 */
async function handleResume(): Promise<void> {
  try {
    await resume()
    ElMessage.success('上传已恢复')
  } catch {
    ElMessage.error('恢复上传失败')
  }
}

/**
 * 处理取消上传
 */
function handleCancel(): void {
  cancel()
  ElMessage.info('上传已取消')
}

/**
 * 处理重试
 */
function handleRetry(): void {
  if (currentFile.value) {
    uploadError.value = false
    startUpload()
  }
}

/**
 * 暴露方法供父组件调用
 */
export interface VideoUploaderInstance {
  startUpload: (videoType?: VideoType) => Promise<void>
  cancel: () => void
  clear: () => void
  currentFile: File | null
  currentTask: UploadTask | null
}

defineExpose<VideoUploaderInstance>({
  startUpload,
  cancel: handleCancel,
  clear,
  get currentFile() {
    return currentFile.value
  },
  get currentTask() {
    return currentTask.value
  },
})
</script>

<style scoped lang="scss">
// 色彩变量
$color-primary: #667eea;
$color-primary-light: #a0a6f5;
$color-success: #67c23a;
$color-danger: #f56c6c;
$color-warning: #e6a23c;
$color-text-primary: #303133;
$color-text-regular: #606266;
$color-text-secondary: #909399;
$color-border: #dcdfe6;
$color-bg-light: #f5f7fa;

// 渐变
$gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
$gradient-success: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);

.video-uploader {
  width: 100%;
}

.upload-area {
  position: relative;
  min-height: 280px;
  padding: 32px;
  background: linear-gradient(180deg, #fafbfc 0%, #ffffff 100%);
  border: 2px dashed $color-border;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  overflow: hidden;

  &:hover:not(&--disabled):not(&--uploading) {
    border-color: $color-primary;
    background: linear-gradient(180deg, #f0f2ff 0%, #ffffff 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15);
  }

  &:focus-visible {
    outline: 2px solid $color-primary;
    outline-offset: 2px;
  }

  &--dragging {
    border-color: $color-primary;
    background: linear-gradient(
      135deg,
      rgba(102, 126, 234, 0.05) 0%,
      rgba(118, 75, 162, 0.05) 100%
    );
    transform: scale(1.02);

    .icon-circle {
      animation: pulse 0.6s infinite;
    }
  }

  &--uploading {
    cursor: default;
    border-color: $color-primary-light;
  }

  &--success {
    border-color: $color-success;
    background: linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%);
  }

  &--error {
    border-color: $color-danger;
    background: linear-gradient(180deg, #fef0f0 0%, #ffffff 100%);
  }

  &--disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  &__input {
    display: none;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 216px;
  }

  &__icon {
    position: relative;
    width: 80px;
    height: 80px;
    margin-bottom: 24px;

    .icon-upload {
      width: 100%;
      height: 100%;
      color: $color-primary;
      filter: drop-shadow(0 4px 8px rgba(102, 126, 234, 0.2));
      transition: transform 0.3s;

      .upload-area:hover & {
        transform: translateY(-4px);
      }
    }

    .icon-circle {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 100px;
      height: 100px;
      border: 2px solid rgba(102, 126, 234, 0.2);
      border-radius: 50%;
      transform: translate(-50%, -50%);
    }
  }

  &__text {
    text-align: center;
  }

  &__primary-text {
    margin: 0 0 8px;
    font-size: 18px;
    font-weight: 500;
    color: $color-text-primary;
  }

  &__hint-text {
    margin: 0;
    font-size: 14px;
    color: $color-text-secondary;
  }

  &__file-info {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 24px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .file-icon {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    color: $color-primary;

    svg {
      width: 100%;
      height: 100%;
    }
  }

  .file-details {
    flex: 1;
    min-width: 0;
  }

  .file-name {
    margin: 0 0 4px;
    font-size: 16px;
    font-weight: 500;
    color: $color-text-primary;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .file-size {
    margin: 0;
    font-size: 14px;
    color: $color-text-secondary;
  }

  .file-remove {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    padding: 0;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: $color-text-secondary;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: rgba(245, 108, 108, 0.1);
      color: $color-danger;
    }

    svg {
      width: 20px;
      height: 20px;
    }
  }

  &__uploading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    padding: 24px 0;
  }

  .uploading-progress {
    position: relative;
    width: 120px;
    height: 120px;
  }

  .progress-circle {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);

    &__bg {
      stroke: #e5e7eb;
    }

    &__bar {
      stroke: url(#progressGradient);
      stroke-linecap: round;
      transition: stroke-dasharray 0.3s ease;
    }
  }

  .progress-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
  }

  .progress-percentage {
    font-size: 28px;
    font-weight: 600;
    background: $gradient-primary;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .uploading-info {
    text-align: center;
  }

  .uploading-status {
    margin: 0 0 12px;
    font-size: 16px;
    font-weight: 500;
    color: $color-text-primary;
  }

  .uploading-details {
    display: flex;
    justify-content: center;
    gap: 16px;
    font-size: 14px;
    color: $color-text-secondary;
  }

  .detail-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .detail-icon {
    width: 16px;
    height: 16px;
  }

  &__success,
  &__error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 216px;
    gap: 16px;
  }

  .success-icon,
  .error-icon {
    width: 80px;
    height: 80px;
    animation: scaleIn 0.4s ease-out;

    svg {
      width: 100%;
      height: 100%;
    }
  }

  .success-icon {
    color: $color-success;
  }

  .error-icon {
    color: $color-danger;
  }

  .success-text,
  .error-text {
    margin: 0;
    font-size: 18px;
    font-weight: 500;
  }

  .success-text {
    color: $color-success;
  }

  .error-text {
    color: $color-danger;
  }

  .retry-button {
    padding: 8px 24px;
    font-size: 14px;
    color: white;
    background: $gradient-primary;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    &:active {
      transform: translateY(0);
    }
  }
}

.upload-controls {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
}

.control-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  color: white;
  background: $gradient-primary;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  &--pause {
    background: linear-gradient(135deg, #e6a23c 0%, #f56c6c 100%);

    &:hover {
      box-shadow: 0 4px 12px rgba(230, 162, 60, 0.3);
    }
  }

  &--cancel {
    background: linear-gradient(135deg, #909399 0%, #606266 100%);

    &:hover {
      box-shadow: 0 4px 12px rgba(96, 98, 102, 0.3);
    }
  }
}

// 动画
@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }

  50% {
    transform: scale(1.1);
    opacity: 0.6;
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0);
    opacity: 0;
  }

  to {
    transform: scale(1);
    opacity: 1;
  }
}

// 响应式
@media (max-width: 768px) {
  .upload-area {
    min-height: 200px;
    padding: 24px 16px;

    &__icon {
      width: 60px;
      height: 60px;
      margin-bottom: 16px;

      .icon-circle {
        width: 80px;
        height: 80px;
      }
    }

    &__primary-text {
      font-size: 16px;
    }

    &__hint-text {
      font-size: 12px;
    }
  }

  .uploading-progress {
    width: 100px;
    height: 100px;
  }

  .progress-percentage {
    font-size: 24px;
  }

  .uploading-details {
    flex-direction: column;
    gap: 8px;
  }

  .control-button {
    padding: 8px 16px;
    font-size: 13px;
  }
}

// 深色模式支持
@media (prefers-color-scheme: dark) {
  .upload-area {
    background: linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%);
    border-color: #404040;

    &:hover:not(&--disabled):not(&--uploading) {
      background: linear-gradient(180deg, #252545 0%, #1a1a1a 100%);
    }

    &--dragging {
      background: linear-gradient(
        135deg,
        rgba(102, 126, 234, 0.1) 0%,
        rgba(118, 75, 162, 0.1) 100%
      );
    }
  }

  .file-info {
    background: #1a1a1a;
  }

  .progress-circle__bg {
    stroke: #404040;
  }
}
</style>
