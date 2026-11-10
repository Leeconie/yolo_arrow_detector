<!--
  @fileoverview AI 视频识别页（对接 backend/ YOLO 服务）
  @description 上传射箭视频 → 调用 FastAPI 推理 → 展示标注视频、中箭计数与逐箭明细。
               这是「前端 + 识别后端」真正打通的入口页面，与原有 Mock 页面互不影响。
-->
<template>
  <div class="ai-page">
    <!-- 页头 -->
    <header class="page-head">
      <div class="head-text">
        <h1>AI 视频识别</h1>
        <p>上传射箭视频，由本地 YOLO 服务完成箭矢计数与人体姿态标注</p>
      </div>
      <div class="health" :class="healthState">
        <span class="dot" />
        <span>{{ healthText }}</span>
      </div>
    </header>

    <div class="layout">
      <!-- 左：上传与参数 -->
      <section class="panel">
        <h2 class="panel-title">1. 选择视频</h2>

        <div
          class="dropzone"
          :class="{ dragging, filled: !!file }"
          @click="openPicker"
          @dragover.prevent="dragging = true"
          @dragleave.prevent="dragging = false"
          @drop.prevent="onDrop"
        >
          <template v-if="!file">
            <div class="dz-icon">↑</div>
            <p class="dz-main">点击选择，或把视频拖到这里</p>
            <p class="dz-sub">支持 mp4 / mov / avi / mkv 等，最大 {{ MAX_VIDEO_SIZE_MB }}MB</p>
          </template>
          <template v-else>
            <video v-if="localUrl" class="dz-video" :src="localUrl" muted playsinline />
            <div class="dz-meta">
              <strong :title="file.name">{{ file.name }}</strong>
              <span>{{ formatSize(file.size) }}</span>
            </div>
          </template>
        </div>
        <input
          ref="inputRef"
          type="file"
          accept="video/*"
          class="hidden-input"
          @change="onFileChange"
        />

        <div v-if="file" class="file-actions">
          <el-button size="small" plain @click="openPicker">重新选择</el-button>
          <el-button size="small" plain type="danger" @click="clearFile">移除</el-button>
        </div>

        <h2 class="panel-title">2. 识别模式</h2>
        <div class="mode-list">
          <button
            v-for="item in MODES"
            :key="item.value"
            type="button"
            class="mode"
            :class="{ active: mode === item.value }"
            @click="mode = item.value"
          >
            <span class="mode-name">{{ item.label }}</span>
            <span class="mode-desc">{{ item.desc }}</span>
          </button>
        </div>

        <el-button
          class="run-btn"
          type="primary"
          size="large"
          :loading="busy"
          :disabled="!file || busy"
          @click="start"
        >
          {{ busy ? '识别中…' : '开始识别' }}
        </el-button>

        <div v-if="busy || status === 'error'" class="progress-box">
          <el-progress
            :percentage="progress"
            :stroke-width="10"
            :status="status === 'error' ? 'exception' : undefined"
          />
          <p class="progress-text">{{ progressText }}</p>
        </div>

        <p class="tip">
          首次请求会加载模型（约 10–30 秒）；推理速度取决于视频时长与 CPU，1 分钟视频通常需要
          1–3 分钟，请耐心等待。
        </p>
      </section>

      <!-- 右：结果 -->
      <section class="panel result-panel">
        <h2 class="panel-title">识别结果</h2>

        <div v-if="!resultUrl" class="empty">
          <div class="empty-icon">◎</div>
          <p>还没有结果</p>
          <p class="empty-sub">上传视频并开始识别后，这里会显示标注视频与统计数据</p>
        </div>

        <template v-else>
          <div class="stats">
            <div v-for="item in stats" :key="item.label" class="stat">
              <span class="stat-value">{{ item.value }}<em v-if="item.unit">{{ item.unit }}</em></span>
              <span class="stat-label">{{ item.label }}</span>
            </div>
          </div>

          <!-- 计数趋势 -->
          <div v-if="tracking" class="chart-card">
            <div class="chart-head">
              <span>中箭数累计趋势</span>
              <span class="chart-hint">横轴为帧序号</span>
            </div>
            <svg class="spark" viewBox="0 0 600 120" preserveAspectRatio="none">
              <polyline :points="spark.area" class="spark-area" />
              <polyline :points="spark.line" class="spark-line" />
            </svg>
          </div>

          <video class="result-video" :src="resultUrl" controls playsinline />

          <div class="result-actions">
            <el-button type="primary" plain @click="download">下载标注视频</el-button>
          </div>

          <!-- 逐箭明细 -->
          <div v-if="tracking && tracking.arrows.length" class="table-wrap">
            <div class="chart-head"><span>逐箭明细</span></div>
            <el-table :data="tracking.arrows" size="small" height="240" stripe>
              <el-table-column prop="arrow_id" label="编号" width="70" />
              <el-table-column label="置信度" width="90">
                <template #default="{ row }">{{ (row.confidence * 100).toFixed(1) }}%</template>
              </el-table-column>
              <el-table-column prop="first_seen_frame" label="首帧" width="80" />
              <el-table-column prop="last_seen_frame" label="末帧" width="80" />
              <el-table-column prop="stability_frames" label="稳定帧" width="90" />
              <el-table-column label="状态" width="90">
                <template #default="{ row }">
                  <el-tag :type="row.stable ? 'success' : 'warning'" size="small" effect="light">
                    {{ row.stable ? '已稳定' : '跟踪中' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </template>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  analyzeVideo,
  getAiHealth,
  MAX_VIDEO_SIZE_MB,
  resolveAssetUrl,
  validateVideoFile,
  type AiAnalyzeMode,
  type AiHealthResponse,
  type DetectResult,
  type PoseResult,
  type TrackingResult,
} from '@/core/api/aiBackend'

defineOptions({ name: 'AiAnalysis' })

interface ModeItem {
  value: AiAnalyzeMode
  label: string
  desc: string
}

const MODES: ModeItem[] = [
  { value: 'count', label: '箭头计数', desc: '追踪每支箭并统计中箭总数' },
  { value: 'detect', label: '箭头检测', desc: '逐帧框出箭矢，不做计数' },
  { value: 'pose', label: '姿态分析', desc: '识别人体骨骼关键点，检查动作' },
]

type Status = 'idle' | 'uploading' | 'processing' | 'done' | 'error'

const mode = ref<AiAnalyzeMode>('count')
const file = ref<File | null>(null)
const localUrl = ref('')
const dragging = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

const status = ref<Status>('idle')
const progress = ref(0)
const elapsed = ref(0)
const costMs = ref(0)

const resultUrl = ref('')
const downloadUrl = ref('')
const tracking = ref<TrackingResult | null>(null)
const pose = ref<PoseResult | null>(null)
const detectCount = ref(0)

const health = ref<AiHealthResponse | null>(null)
const healthError = ref('')

const busy = computed(() => status.value === 'uploading' || status.value === 'processing')

const healthState = computed(() => {
  if (healthError.value) return 'offline'
  if (!health.value) return 'checking'
  return health.value.models_ready ? 'online' : 'degraded'
})

const healthText = computed(() => {
  if (healthError.value) return '后端未连接'
  if (!health.value) return '检测服务状态…'
  if (health.value.models_ready) return '识别服务在线'
  return '模型未就绪'
})

const progressText = computed(() => {
  if (status.value === 'uploading') return `正在上传… ${progress.value}%`
  if (status.value === 'processing') return `视频上传完成，模型推理中… 已用时 ${elapsed.value}s`
  if (status.value === 'done') return `识别完成，总耗时 ${(costMs.value / 1000).toFixed(1)}s`
  if (status.value === 'error') return '识别失败，请检查后端服务日志'
  return ''
})

const stats = computed(() => {
  const items: { label: string; value: string | number; unit?: string }[] = []
  if (tracking.value) {
    items.push({ label: '中箭总数', value: tracking.value.total_arrows_shot, unit: ' 支' })
    items.push({ label: '稳定箭数', value: tracking.value.current_stable_arrows, unit: ' 支' })
    items.push({ label: '原始检测数', value: tracking.value.detection_count, unit: ' 次' })
    items.push({ label: '处理帧数', value: tracking.value.frame_count })
  } else if (pose.value) {
    items.push({ label: '检出帧数', value: pose.value.detected_frames })
    items.push({ label: '人体实例', value: pose.value.person_instances })
    items.push({
      label: '平均关键点置信度',
      value: (pose.value.avg_keypoint_confidence * 100).toFixed(1),
      unit: '%',
    })
    items.push({ label: '总耗时', value: (costMs.value / 1000).toFixed(1), unit: 's' })
  } else {
    items.push({ label: '检测实例', value: detectCount.value, unit: ' 次' })
    items.push({ label: '总耗时', value: (costMs.value / 1000).toFixed(1), unit: 's' })
  }
  return items
})

/** 趋势折线：把逐帧数据降采样到最多 160 个点，映射进 600x120 的 viewBox */
const spark = computed(() => {
  const trend = tracking.value?.trend ?? []
  if (trend.length < 2) return { line: '', area: '' }

  const step = Math.max(1, Math.ceil(trend.length / 160))
  const sampled = trend.filter((_, idx) => idx % step === 0)
  const max = Math.max(...sampled.map((p) => p.total), 1)
  const w = 600
  const h = 120

  const pts = sampled.map((p, idx) => {
    const x = (idx / Math.max(1, sampled.length - 1)) * w
    const y = h - (p.total / max) * (h - 12) - 6
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  return {
    line: pts.join(' '),
    area: `0,${h} ${pts.join(' ')} ${w},${h}`,
  }
})

function openPicker(): void {
  if (busy.value) return
  inputRef.value?.click()
}

function onFileChange(event: Event): void {
  const target = event.target as HTMLInputElement
  const picked = target.files?.[0]
  if (picked) pickFile(picked)
  // 允许重复选择同一个文件
  target.value = ''
}

function onDrop(event: DragEvent): void {
  dragging.value = false
  if (busy.value) return
  const dropped = event.dataTransfer?.files?.[0]
  if (dropped) pickFile(dropped)
}

function pickFile(picked: File): void {
  const error = validateVideoFile(picked)
  if (error) {
    ElMessage.error(error)
    return
  }
  clearObjectUrl()
  file.value = picked
  localUrl.value = URL.createObjectURL(picked)
  resetResult()
}

function clearFile(): void {
  clearObjectUrl()
  file.value = null
  resetResult()
}

function clearObjectUrl(): void {
  if (localUrl.value) {
    URL.revokeObjectURL(localUrl.value)
    localUrl.value = ''
  }
}

function resetResult(): void {
  status.value = 'idle'
  progress.value = 0
  elapsed.value = 0
  costMs.value = 0
  resultUrl.value = ''
  downloadUrl.value = ''
  tracking.value = null
  pose.value = null
  detectCount.value = 0
  stopTicker()
}

let ticker: ReturnType<typeof setInterval> | null = null
let startedAt = 0

function startTicker(): void {
  stopTicker()
  startedAt = Date.now()
  ticker = setInterval(() => {
    elapsed.value = Math.floor((Date.now() - startedAt) / 1000)
  }, 1000)
}

function stopTicker(): void {
  if (ticker) {
    clearInterval(ticker)
    ticker = null
  }
}

async function start(): Promise<void> {
  if (!file.value || busy.value) return

  resetResult()
  status.value = 'uploading'
  startTicker()
  const begin = Date.now()

  try {
    const response = await analyzeVideo<unknown>(file.value, mode.value, (percent) => {
      progress.value = percent
      // 上传到位后请求仍在等模型推理，界面切到"推理中"
      if (percent >= 99) status.value = 'processing'
    })

    costMs.value = Date.now() - begin
    resultUrl.value = resolveAssetUrl(response.preview_url || response.output_video_url)
    downloadUrl.value = resolveAssetUrl(response.output_video_url)

    const data = response.detection_results as Record<string, unknown>
    if (mode.value === 'count') {
      tracking.value = data as unknown as TrackingResult
    } else if (mode.value === 'pose') {
      pose.value = data as unknown as PoseResult
    } else {
      detectCount.value = Number((data as unknown as DetectResult).detection_count ?? 0)
    }

    progress.value = 100
    status.value = 'done'
    ElMessage.success('识别完成')
  } catch (error) {
    status.value = 'error'
    const message = error instanceof Error ? error.message : String(error)
    ElMessage.error(`识别失败：${message}`)
  } finally {
    stopTicker()
    elapsed.value = Math.floor((Date.now() - begin) / 1000)
  }
}

function download(): void {
  if (!downloadUrl.value) return
  const link = document.createElement('a')
  link.href = downloadUrl.value
  link.download = ''
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function formatSize(bytes: number): string {
  const mb = bytes / 1024 / 1024
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`
}

onMounted(async () => {
  try {
    health.value = await getAiHealth()
    if (!health.value.models_ready) {
      healthError.value = ''
      ElMessage.warning(`模型未就绪：${health.value.error || '请检查 backend/weights'}`)
    }
  } catch {
    healthError.value = '后端未连接，请先启动 backend（python dev.py 或 uvicorn main:app --port 8000）'
  }
})

onBeforeUnmount(() => {
  stopTicker()
  clearObjectUrl()
})
</script>

<style scoped>
.ai-page {
  max-width: 1180px;
  margin: 0 auto;
  padding: 24px 20px 48px;
  color: var(--color-text-primary, #303133);
  font-family: var(--font-family-base, system-ui, sans-serif);
}

.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.page-head h1 {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 700;
}

.head-text p {
  margin: 0;
  color: var(--color-text-secondary, #909399);
  font-size: 13px;
}

.health {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  white-space: nowrap;
  border: 1px solid var(--color-border-light, #e4e7ed);
  background: var(--color-bg-secondary, #f5f7fa);
  color: var(--color-text-regular, #606266);
}

.health .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #c0c4cc;
}

.health.online {
  border-color: #c2e7b0;
  background: #f0f9eb;
  color: #529b2e;
}
.health.online .dot {
  background: #67c23a;
}

.health.degraded {
  border-color: #f3d19e;
  background: #fdf6ec;
  color: #b88230;
}
.health.degraded .dot {
  background: #e6a23c;
}

.health.offline {
  border-color: #fab6b6;
  background: #fef0f0;
  color: #c45656;
}
.health.offline .dot {
  background: #f56c6c;
}

.layout {
  display: grid;
  grid-template-columns: 360px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

@media (max-width: 900px) {
  .layout {
    grid-template-columns: minmax(0, 1fr);
  }
}

.panel {
  background: #fff;
  border: 1px solid var(--color-border-lighter, #ebeef5);
  border-radius: 10px;
  padding: 18px;
}

.panel-title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary, #303133);
}

.panel-title:not(:first-child) {
  margin-top: 22px;
}

.dropzone {
  position: relative;
  border: 1.5px dashed var(--color-border-base, #dcdfe6);
  border-radius: 8px;
  background: var(--color-bg-secondary, #f5f7fa);
  min-height: 168px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 14px;
  cursor: pointer;
  transition:
    border-color 0.2s,
    background 0.2s;
  overflow: hidden;
  text-align: center;
}

.dropzone:hover,
.dropzone.dragging {
  border-color: var(--color-primary, #409eff);
  background: #ecf5ff;
}

.dropzone.filled {
  padding: 0;
  min-height: 0;
  background: #000;
  border-style: solid;
}

.dz-icon {
  font-size: 26px;
  line-height: 1;
  color: var(--color-primary, #409eff);
}

.dz-main {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-regular, #606266);
}

.dz-sub {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-secondary, #909399);
}

.dz-video {
  width: 100%;
  max-height: 200px;
  display: block;
  background: #000;
}

.dz-meta {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  font-size: 12px;
  color: #fff;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.72));
}

.dz-meta strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hidden-input {
  display: none;
}

.file-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.mode-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mode {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  padding: 10px 12px;
  border: 1px solid var(--color-border-light, #e4e7ed);
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  text-align: left;
  transition:
    border-color 0.2s,
    background 0.2s;
}

.mode:hover {
  border-color: var(--color-primary, #409eff);
}

.mode.active {
  border-color: var(--color-primary, #409eff);
  background: #ecf5ff;
}

.mode-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary, #303133);
}

.mode-desc {
  font-size: 12px;
  color: var(--color-text-secondary, #909399);
}

.run-btn {
  width: 100%;
  margin-top: 18px;
}

.progress-box {
  margin-top: 14px;
}

.progress-text {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--color-text-secondary, #909399);
}

.tip {
  margin: 14px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--color-text-placeholder, #a8abb2);
}

.result-panel {
  min-height: 520px;
}

.empty {
  height: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--color-text-secondary, #909399);
  font-size: 13px;
}

.empty-icon {
  font-size: 34px;
  color: var(--color-border-base, #dcdfe6);
}

.empty-sub {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-placeholder, #a8abb2);
}

.stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

@media (max-width: 640px) {
  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px;
  border-radius: 8px;
  background: var(--color-bg-secondary, #f5f7fa);
  border: 1px solid var(--color-border-lighter, #ebeef5);
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #1d6fb8;
  line-height: 1.2;
}

.stat-value em {
  font-size: 12px;
  font-weight: 500;
  font-style: normal;
  color: var(--color-text-secondary, #909399);
}

.stat-label {
  font-size: 12px;
  color: var(--color-text-secondary, #909399);
}

.chart-card {
  border: 1px solid var(--color-border-lighter, #ebeef5);
  border-radius: 8px;
  padding: 10px 12px 4px;
  margin-bottom: 14px;
}

.chart-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-regular, #606266);
  margin-bottom: 6px;
}

.chart-hint {
  font-weight: 400;
  color: var(--color-text-placeholder, #a8abb2);
}

.spark {
  width: 100%;
  height: 110px;
  display: block;
}

.spark-area {
  fill: rgba(64, 158, 255, 0.14);
  stroke: none;
}

.spark-line {
  fill: none;
  stroke: #409eff;
  stroke-width: 2;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}

.result-video {
  width: 100%;
  max-height: 420px;
  border-radius: 8px;
  background: #000;
  display: block;
}

.result-actions {
  display: flex;
  gap: 8px;
  margin: 12px 0 4px;
}

.table-wrap {
  margin-top: 14px;
}
</style>
