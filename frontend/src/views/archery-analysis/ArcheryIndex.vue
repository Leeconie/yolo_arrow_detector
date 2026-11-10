<template>
  <div class="archery-page">
    <!-- 页面头部 -->
    <el-page-header content="射箭视频分析" @back="goBackHome">
      <el-button type="primary" :icon="Upload" @click="openUploadDialog"> 上传分析视频 </el-button>
    </el-page-header>

    <!-- 视频/图片展示区 -->
    <el-card class="video-card" shadow="hover">
      <!-- 视频切换按钮（未上传时隐藏） -->
      <div v-if="isVideoUploaded" class="video-switch">
        <el-radio-group v-model="videoType" @change="switchVideoType">
          <el-radio value="original">原始视频</el-radio>
          <el-radio value="processed">处理后视频</el-radio>
        </el-radio-group>
      </div>

      <!-- 核心布局：左（人物） 右（靶+坐标） -->
      <div class="content-container">
        <!-- 左侧：人物区域（宽度=右侧，高度=靶的2倍） -->
        <div class="person-area">
          <template v-if="isVideoUploaded">
            <video
              ref="archerVideoRef"
              :src="currentArcherVideo"
              controlsList="nodownload"
              @timeupdate="syncVideoTime"
              @loadedmetadata="initVideoDuration"
              @seeked="syncProgress"
              muted
              class="video-player"
            ></video>
          </template>
          <template v-else>
            <div class="default-img-wrapper">
              <img src="@/assets/images/default-person.png" alt="默认人物" class="default-img" />
              <div class="area-label">人</div>
            </div>
          </template>
        </div>

        <!-- 右侧：靶+坐标区域 -->
        <div class="target-coord-area">
          <!-- 上半部分：靶（正方形，绝对尺寸） -->
          <div class="target-subarea square">
            <template v-if="isVideoUploaded">
              <video
                ref="targetVideoRef"
                :src="currentTargetVideo"
                controlsList="nodownload"
                @timeupdate="syncVideoTime"
                @loadedmetadata="initVideoDuration"
                @seeked="syncProgress"
                muted
                class="video-player"
              ></video>
            </template>
            <template v-else>
              <div class="default-img-wrapper">
                <img src="@/assets/images/default-target.png" alt="默认靶" class="default-img" />
                <div class="area-label">靶</div>
              </div>
            </template>
          </div>

          <!-- 下半部分：坐标系（正方形，与靶同尺寸） -->
          <div class="coord-subarea square">
            <div ref="coordinateRef" class="target-coordinate">
              <div class="axis-x">X轴</div>
              <div class="axis-y">Y轴</div>
              <!-- 箭着点（仅上传视频后显示） -->
              <div
                v-if="isVideoUploaded"
                class="arrow-point"
                :style="{ left: arrowX + 'px', top: arrowY + 'px' }"
              ></div>
              <div v-else class="area-label coord-label">坐标</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 同步控制系统（未上传时隐藏） -->
      <div class="video-controls">
        <el-button :icon="VideoPlay" :disabled="!isVideoUploaded" @click="playVideo"
          >播放</el-button
        >
        <el-button :icon="VideoPause" :disabled="!isVideoUploaded" @click="pauseVideo"
          >暂停</el-button
        >
        <el-button :icon="ArrowLeft" :disabled="!isVideoUploaded" @click="prevFrame"
          >上一帧</el-button
        >
        <el-button :icon="ArrowRight" :disabled="!isVideoUploaded" @click="nextFrame"
          >下一帧</el-button
        >
        <!-- 进度条也可以禁用 -->
        <el-slider
          v-model="videoProgress"
          :max="videoDuration"
          :disabled="!isVideoUploaded"
          class="progress-slider"
          @input="seekVideo"
        ></el-slider>

        <!-- 时间显示 -->
        <div class="time-display">
          {{ formatTime(currentTime) }} / {{ formatTime(videoDuration) }}
        </div>
      </div>
    </el-card>

    <!-- 视频上传弹窗 -->
    <el-dialog v-model="uploadDialogVisible" title="上传射箭/箭靶视频" width="700px" center>
      <div class="upload-dialog-content">
        <div class="upload-item">
          <h4>射箭人视频</h4>
          <VideoUploader
            ref="archerUploaderRef"
            :max-size="MAX_SIZE"
            :allowed-formats="ALLOWED_FORMATS"
            @file-change="handleArcherFileChange"
          />
        </div>
        <div class="upload-item">
          <h4>箭靶视频</h4>
          <VideoUploader
            ref="targetUploaderRef"
            :max-size="MAX_SIZE"
            :allowed-formats="ALLOWED_FORMATS"
            @file-change="handleTargetFileChange"
          />
        </div>
      </div>

      <template #footer>
        <el-button @click="handleCancelUpload">取消</el-button>
        <el-button
          type="primary"
          :loading="uploadLoading"
          :disabled="!canUpload"
          @click="submitUpload"
        >
          上传并分析
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview 射箭分析主页面组件
 * @module views/archery-analysis/ArcheryIndex
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 射箭视频上传、播放和分析结果展示
 * @dependencies vue, vue-router, element-plus, @element-plus/icons-vue, @/core/api/archery, @/utils/date
 */

import { ref, nextTick, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Upload, VideoPlay, VideoPause, ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { uploadArcheryVideo } from '@/core/api/archery'
import type { UploadArcheryVideoRequest } from '@/types/archery'
import { formatTime } from '@/utils/date'
import VideoUploader, {
  type VideoUploaderInstance,
} from '@/modules/video/upload/components/VideoUploader.vue'
import { logger } from '@/core/logger'
import { APIFOX_CONFIG } from '@/core/config/constants'
import type { AxiosError } from 'axios'

defineOptions({
  name: 'ArcheryIndexPage',
})

const router = useRouter()

// ===== 核心状态 =====
const isVideoUploaded = ref(false)
const videoType = ref<'original' | 'processed'>('original')
const archerVideoRef = ref<HTMLVideoElement | null>(null)
const targetVideoRef = ref<HTMLVideoElement | null>(null)
const coordinateRef = ref<HTMLDivElement | null>(null)

// ===== 视频数据源 =====
const originalArcherVideo = ref('')
const originalTargetVideo = ref('')
const processedArcherVideo = ref('')
const processedTargetVideo = ref('')
const currentArcherVideo = ref('')
const currentTargetVideo = ref('')

// ===== 视频控制变量 =====
const videoProgress = ref(0)
const videoDuration = ref(0)
const currentTime = ref(0)
const frameStep = 0.04

// ===== 箭靶坐标系 =====
const arrowX = ref(0)
const arrowY = ref(0)

// ===== 上传相关 =====
const uploadDialogVisible = ref(false)
const uploadLoading = ref(false)
const ALLOWED_FORMATS = ['mp4', 'avi', 'mov', 'mkv']
// 单文件最大size：512MB（可自定义）
const MAX_SIZE = 512 * 1024 * 1024

// 上传组件引用
const archerUploaderRef = ref<VideoUploaderInstance>()
const targetUploaderRef = ref<VideoUploaderInstance>()

// 当前选中的文件
const archerFile = ref<File | null>(null)
const targetFile = ref<File | null>(null)

// 是否可以上传
const canUpload = computed(() => {
  return !!(archerFile.value && targetFile.value && !uploadLoading.value)
})

// ===== 视频切换逻辑 =====
const switchVideoType = () => {
  if (videoType.value === 'original') {
    currentArcherVideo.value = originalArcherVideo.value
    currentTargetVideo.value = originalTargetVideo.value
  } else {
    currentArcherVideo.value = processedArcherVideo.value
    currentTargetVideo.value = processedTargetVideo.value
  }
  nextTick(() => {
    if (archerVideoRef.value && targetVideoRef.value) {
      archerVideoRef.value.currentTime = currentTime.value
      targetVideoRef.value.currentTime = currentTime.value
      archerVideoRef.value.play()
      targetVideoRef.value.play()
    }
  })
}

// ===== 视频控制核心函数 =====
const playVideo = () => {
  archerVideoRef.value?.play()
  targetVideoRef.value?.play()
}

const pauseVideo = () => {
  archerVideoRef.value?.pause()
  targetVideoRef.value?.pause()
}

const prevFrame = () => {
  pauseVideo()
  const newTime = Math.max(0, currentTime.value - frameStep)
  seekToTime(newTime)
}

const nextFrame = () => {
  pauseVideo()
  const newTime = Math.min(videoDuration.value, currentTime.value + frameStep)
  seekToTime(newTime)
}

const seekToTime = (time: number) => {
  if (archerVideoRef.value && targetVideoRef.value) {
    archerVideoRef.value.currentTime = time
    targetVideoRef.value.currentTime = time
    currentTime.value = time
    videoProgress.value = time
    updateArrowPoint(time)
  }
}

const seekVideo = (value: number) => {
  seekToTime(value)
}

const syncVideoTime = () => {
  if (archerVideoRef.value && targetVideoRef.value) {
    currentTime.value = archerVideoRef.value.currentTime
    targetVideoRef.value.currentTime = currentTime.value
    videoProgress.value = currentTime.value
    updateArrowPoint(currentTime.value)
  }
}

const syncProgress = () => {
  if (archerVideoRef.value) {
    currentTime.value = archerVideoRef.value.currentTime
    videoProgress.value = currentTime.value
  }
}

const initVideoDuration = () => {
  if (archerVideoRef.value) {
    videoDuration.value = archerVideoRef.value.duration
    initCoordinate()
  }
}

// ===== 箭靶坐标系 =====
const initCoordinate = () => {
  nextTick(() => {
    if (!coordinateRef.value) return
    // 直接取坐标区域的DOM尺寸（不再依赖视频）
    const coordDom = coordinateRef.value
    const rect = coordDom.getBoundingClientRect()
    // 强制坐标系宽高等于父容器（靶区域）
    coordDom.style.width = '100%'
    coordDom.style.height = '100%'
    // 初始箭着点在正中心
    arrowX.value = rect.width / 2
    arrowY.value = rect.height / 2
  })
}

const updateArrowPoint = (time: number) => {
  if (!coordinateRef.value) return
  const coordRect = coordinateRef.value.getBoundingClientRect()
  arrowX.value = coordRect.width / 2 + Math.sin(time) * 50
  arrowY.value = coordRect.height / 2 + Math.cos(time) * 50
}

// ===== 上传相关函数 =====
// 射箭人视频文件变更
const handleArcherFileChange = (file: File | null) => {
  archerFile.value = file
}

// 箭靶视频文件变更
const handleTargetFileChange = (file: File | null) => {
  targetFile.value = file
}

const openUploadDialog = () => {
  uploadDialogVisible.value = true
  // 重置文件选择
  archerFile.value = null
  targetFile.value = null
  // 清除上传组件状态
  archerUploaderRef.value?.clear()
  targetUploaderRef.value?.clear()
}

const handleCancelUpload = () => {
  uploadDialogVisible.value = false
  archerFile.value = null
  targetFile.value = null
  archerUploaderRef.value?.cancel()
  targetUploaderRef.value?.cancel()
}

const submitUpload = async () => {
  if (!archerFile.value || !targetFile.value) {
    return ElMessage.error('请选择射箭人视频和箭靶视频！')
  }

  // 检查文件大小（使用512MB限制）
  // 注意：如果使用本地Mock服务器，需要确保服务器配置支持512MB文件上传
  // 为了提供更好的用户体验，我们在前端进行预检查
  const FILE_SIZE_LIMIT = 512 * 1024 * 1024 // 512MB
  const totalSize = (archerFile.value?.size || 0) + (targetFile.value?.size || 0)

  // 前端预检查文件大小，提供用户友好提示
  if (totalSize > FILE_SIZE_LIMIT) {
    const archerSizeMB = ((archerFile.value?.size || 0) / 1024 / 1024).toFixed(2)
    const targetSizeMB = ((targetFile.value?.size || 0) / 1024 / 1024).toFixed(2)
    const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2)

    // 用户友好的错误提示（不暴露技术细节）
    ElMessage.warning({
      message:
        `文件总大小超过限制（512MB）\n\n` +
        `射箭人视频：${archerSizeMB}MB\n` +
        `箭靶视频：${targetSizeMB}MB\n` +
        `总大小：${totalSizeMB}MB\n\n` +
        `请选择较小的文件后重试。`,
      duration: 10000,
      showClose: true,
    })

    // 记录详细日志（仅开发者可见）
    logger.warn('文件大小超过限制', {
      context: {
        module: 'views',
        function: 'submitUpload',
        view: 'ArcheryIndex',
      },
      data: {
        archerSize: archerFile.value?.size,
        targetSize: targetFile.value?.size,
        totalSize,
        fileSizeLimit: FILE_SIZE_LIMIT,
        mockType: APIFOX_CONFIG.MOCK_TYPE,
        enableMock: APIFOX_CONFIG.ENABLE_MOCK,
      },
    })
    return
  }

  uploadLoading.value = true

  try {
    // 调用API上传视频（使用专门的射箭分析API）
    // 注意：这里使用uploadArcheryVideo API而不是通用的视频上传模块
    // 因为射箭分析需要同时上传两个视频并进行分析
    const formData: UploadArcheryVideoRequest = {
      archerVideo: archerFile.value,
      targetVideo: targetFile.value,
    }

    await uploadArcheryVideo(formData)

    // 上传成功后，创建本地视频URL用于预览
    originalArcherVideo.value = URL.createObjectURL(archerFile.value)
    originalTargetVideo.value = URL.createObjectURL(targetFile.value)
    // 暂时使用原始视频作为处理后视频（实际应该从API获取）
    processedArcherVideo.value = originalArcherVideo.value
    processedTargetVideo.value = originalTargetVideo.value
    videoType.value = 'original'
    switchVideoType()
    ElMessage.success('视频上传并分析成功！')
    uploadDialogVisible.value = false
    isVideoUploaded.value = true

    // 可以在这里调用getArcheryDetail获取分析结果
    // const detail = await getArcheryDetail(result.taskId)
    // 处理分析结果...
  } catch (error: unknown) {
    // 使用用户友好的错误消息处理
    const { getUserFriendlyUploadError } = await import('@/core/api/user-friendly-errors')
    const totalSize = (archerFile.value?.size || 0) + (targetFile.value?.size || 0)
    const maxSize = 512 * 1024 * 1024 // 512MB

    const userFriendlyMessage = getUserFriendlyUploadError(error, totalSize, maxSize)

    ElMessage.error({
      message: userFriendlyMessage,
      duration: 10000,
      showClose: true,
    })

    // 记录详细错误日志（仅开发者可见，包含技术细节）
    const axiosError = error as AxiosError<{ ErrorCode?: string; ErrorMessage?: string }>
    logger.error('视频上传失败', {
      context: {
        module: 'views',
        function: 'handleUploadAndAnalyze',
        view: 'ArcheryIndex',
      },
      error: error instanceof Error ? error : new Error(String(error)),
      data: {
        hasArcherVideo: !!archerFile.value,
        hasTargetVideo: !!targetFile.value,
        archerSize: archerFile.value?.size,
        targetSize: targetFile.value?.size,
        totalSize,
        errorCode: axiosError.response?.data?.ErrorCode,
        errorMessage: axiosError.response?.data?.ErrorMessage,
        mockType: APIFOX_CONFIG.MOCK_TYPE,
        enableMock: APIFOX_CONFIG.ENABLE_MOCK,
      },
    })
  } finally {
    uploadLoading.value = false
  }
}

// ===== 页面导航 =====
const goBackHome = () => {
  router.push('/home')
}

onMounted(() => {
  initCoordinate() // 页面加载就初始化坐标系
})
</script>

<style scoped>
.archery-page {
  min-height: 100vh;
  padding: 20px;
  background-color: #f5f7fa;
}

.video-card {
  max-width: 900px; /* 页面整体宽度 */
  margin: 0 auto;
  border-radius: 12px;
  padding: 20px;
}

.video-switch {
  margin-bottom: 20px;
  text-align: center;
}

/* 核心布局：左（人物） 右（靶+坐标） */
.content-container {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  width: 100%;
}

/* 左侧：人物区域（宽度=右侧，高度=靶的2倍，绝对尺寸） */
.person-area {
  width: 400px; /* 与右侧区域宽度一致 */
  height: 820px; /* 靶高度的2倍（400*2 + 20间隔） */
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #000; /* 黑色边框 */
  border-radius: 8px;
  background-color: #000; /* 黑色背景 */
  overflow: hidden;
}

/* 右侧：靶+坐标区域（宽度=人物区域） */
.target-coord-area {
  width: 400px; /* 与人物区域宽度一致 */
  display: flex;
  flex-direction: column;
  gap: 20px; /* 靶和坐标的间隔 */
}

/* 靶和坐标：正方形，绝对尺寸 */
.square {
  width: 400px;
  height: 400px; /* 正方形 */
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #000; /* 黑色边框 */
  border-radius: 8px;
  background-color: #000; /* 黑色背景 */
  overflow: hidden;
}

/* 默认图片样式 */
.default-img-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.default-img {
  width: 80%; /* 画布宽度（可改70%/60%缩小） */
  height: auto; /* 保持宽高比 */
  object-fit: contain;
  background-color: #ffffff; /* 白色画布背景 */
  padding: 10px; /* 画布内边距（可选） */
  border: 1px solid #eee; /* 画布边框（可选） */
}

/* 区域标签（白色大号字体） */
.area-label {
  font-size: 28px;
  color: #fff;
  font-weight: bold;
  margin-top: 10px;
}
.coord-label {
  position: absolute;
  bottom: 10px;
  right: 10px;
  margin: 0;
}

/* 视频播放器 */
.video-player {
  width: 80%; /* 和图片画布宽度一致 */
  height: auto; /* 保持宽高比 */
  object-fit: contain;
  background-color: #ffffff; /* 白色画布背景 */
  padding: 10px; /* 画布内边距（可选） */
  border: 1px solid #eee; /* 画布边框（可选） */
}

/* 坐标系（红色轴） */
.target-coordinate {
  position: relative;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.axis-x {
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: red;
  text-align: center;
  font-size: 16px;
  color: red;
  transform: translateY(-50%);
}
.axis-y {
  position: absolute;
  top: 0;
  left: 50%;
  width: 2px;
  height: 100%;
  background-color: red;
  text-align: center;
  font-size: 16px;
  color: red;
  writing-mode: vertical-lr;
  transform: translateX(-50%);
}
.arrow-point {
  position: absolute;
  width: 10px;
  height: 10px;
  background-color: red;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

/* 视频控制系统 */
.video-controls {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 20px;
}
.progress-slider {
  width: 400px;
}
.time-display {
  min-width: 100px;
  text-align: center;
  font-size: 14px;
  color: #666;
}

/* 上传弹窗样式 */
.upload-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.upload-item {
  width: 100%;
}

.upload-item h4 {
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}
</style>
