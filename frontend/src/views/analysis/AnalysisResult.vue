<template>
  <div class="analysis-result">
    <div class="page-header">
      <h1 class="page-title">
        <el-icon><DataAnalysis /></el-icon>
        分析结果
      </h1>
      <p class="page-description">AI分析完成，以下是您的射箭技术详细报告</p>
    </div>

    <div class="result-content" v-loading="loading">
      <el-alert
        v-if="analysisData"
        :title="`分析完成 - ${formatDate(analysisData.completedAt)}`"
        type="success"
        :closable="false"
        show-icon
        class="result-alert"
      />

      <!-- 总体评分 -->
      <el-card class="score-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon size="24"><Trophy /></el-icon>
            <span>总体评分</span>
          </div>
        </template>
        <div class="score-content">
          <div class="main-score">
            <div class="score-circle">
              <div class="score-number">{{ analysisData?.overallScore || 85 }}</div>
              <div class="score-label">总分</div>
            </div>
            <div class="score-details">
              <div class="score-item">
                <span class="label">稳定性：</span>
                <el-tag :type="getScoreType(analysisData?.stabilityScore || 0)">
                  {{ analysisData?.stabilityScore || 0 }}/100
                </el-tag>
              </div>
              <div class="score-item">
                <span class="label">精准度：</span>
                <el-tag :type="getPrecisionType(analysisData?.precisionScore || 0)">
                  {{ analysisData?.precisionScore || 0 }}/100
                </el-tag>
              </div>
              <div class="score-item">
                <span class="label">技术规范：</span>
                <el-tag :type="getTechniqueType(analysisData?.techniqueScore || 0)">
                  {{ analysisData?.techniqueScore || 0 }}/100
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <el-row :gutter="20">
        <el-col :span="12">
          <!-- 技术分析 -->
          <el-card class="analysis-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <el-icon size="20"><Target /></el-icon>
                <span>技术分析</span>
              </div>
            </template>
            <div class="analysis-content">
              <div class="metric-item">
                <span class="metric-label">平均偏差：</span>
                <span class="metric-value">{{ analysisData?.averageDeviation || '2.3' }}cm</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">姿势稳定性：</span>
                <span class="metric-value">{{ analysisData?.poseStability || '良好' }}</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">瞄准时间：</span>
                <span class="metric-value">{{ analysisData?.aimingTime || '2.1' }}秒</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">释放平稳度：</span>
                <span class="metric-value">{{ analysisData?.releaseSmoothness || '85%' }}</span>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="12">
          <!-- 改进建议 -->
          <el-card class="suggestion-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <el-icon size="20"><Lightbulb /></el-icon>
                <span>改进建议</span>
              </div>
            </template>
            <div class="suggestions">
              <el-alert
                v-for="(suggestion, index) in suggestions"
                :key="index"
                :title="suggestion.title"
                :description="suggestion.description"
                :type="suggestion.type"
                :closable="false"
                show-icon
                class="suggestion-item"
              />
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 详细数据 -->
      <el-card class="detail-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon size="20"><BarChart /></el-icon>
            <span>详细数据</span>
          </div>
        </template>
        <el-table :data="shotData" stripe style="width: 100%">
          <el-table-column prop="shotNumber" label="箭序" width="80" />
          <el-table-column prop="deviation" label="偏差(cm)" width="100" />
          <el-table-column prop="stability" label="稳定性" width="100">
            <template #default="scope">
              <el-tag :type="getScoreType(scope.row.stability)">
                {{ scope.row.stability }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="technique" label="技术评分" width="120">
            <template #default="scope">
              <el-tag :type="getTechniqueType(scope.row.technique)">
                {{ scope.row.technique }}/100
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="notes" label="备注" />
        </el-table>
      </el-card>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <el-button type="primary" @click="downloadReport">
        <el-icon><Download /></el-icon>
        下载报告
      </el-button>
      <el-button type="success" @click="goToHistory">
        <el-icon><Clock /></el-icon>
        查看历史
      </el-button>
      <el-button @click="startNewAnalysis">
        <el-icon><Refresh /></el-icon>
        重新分析
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview 分析结果页面
 * @module views/analysis/AnalysisResult
 * @author HeZaoCha
 * @date 2026-01-11
 * @description 显示AI分析结果和详细报告
 * @dependencies vue, vue-router, element-plus, @element-plus/icons-vue
 */

import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  DataAnalysis,
  Trophy,
  Aim as Target,
  InfoFilled as Lightbulb,
  PieChart as BarChart,
  Download,
  Clock,
  Refresh,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()

/**
 * 分析数据接口
 */
interface AnalysisData {
  overallScore: number
  stabilityScore: number
  precisionScore: number
  techniqueScore: number
  averageDeviation: string
  poseStability: string
  aimingTime: string
  releaseSmoothness: string
  completedAt: string
  shotData: Array<{
    shotNumber: number
    deviation: string
    stability: number
    technique: number
    notes: string
  }>
}

/**
 * 建议接口
 */
interface Suggestion {
  title: string
  description: string
  type: 'warning' | 'info' | 'success'
}

// 响应式数据
const loading = ref(true)
const analysisData = ref<AnalysisData | null>(null)
const suggestions = ref<Suggestion[]>([
  {
    title: '提高瞄准稳定性',
    description: '建议增加核心肌群训练，减少瞄准时的抖动',
    type: 'warning',
  },
  {
    title: '优化释放时机',
    description: '释放时机略早，建议练习在最佳点释放弓弦',
    type: 'info',
  },
  {
    title: '保持良好姿势',
    description: '整体姿势保持良好，继续保持当前水平',
    type: 'success',
  },
])

const shotData = ref([
  { shotNumber: 1, deviation: '1.2', stability: 88, technique: 85, notes: '姿势稳定' },
  { shotNumber: 2, deviation: '2.8', stability: 75, technique: 78, notes: '释放稍早' },
  { shotNumber: 3, deviation: '1.8', stability: 82, technique: 80, notes: '瞄准时间较长' },
  { shotNumber: 4, deviation: '3.1', stability: 70, technique: 72, notes: '姿势略倾斜' },
  { shotNumber: 5, deviation: '2.0', stability: 85, technique: 83, notes: '表现良好' },
  { shotNumber: 6, deviation: '1.5', stability: 90, technique: 88, notes: '技术优秀' },
])

/**
 * 获取评分类型
 */
const getScoreType = (score: number): 'success' | 'warning' | 'danger' => {
  if (score >= 80) return 'success'
  if (score >= 60) return 'warning'
  return 'danger'
}

const getPrecisionType = (score: number): 'success' | 'warning' | 'danger' => {
  if (score >= 85) return 'success'
  if (score >= 70) return 'warning'
  return 'danger'
}

const getTechniqueType = (score: number): 'success' | 'warning' | 'danger' => {
  if (score >= 80) return 'success'
  if (score >= 65) return 'warning'
  return 'danger'
}

/**
 * 格式化日期
 */
const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

/**
 * 加载分析数据
 */
const loadAnalysisData = async () => {
  try {
    // 模拟加载数据
    await new Promise((resolve) => setTimeout(resolve, 2000))

    analysisData.value = {
      overallScore: 78,
      stabilityScore: 75,
      precisionScore: 82,
      techniqueScore: 76,
      averageDeviation: '2.3',
      poseStability: '良好',
      aimingTime: '2.1',
      releaseSmoothness: '85%',
      completedAt: new Date().toISOString(),
      shotData: shotData.value,
    }
  } catch (error) {
    ElMessage.error('加载分析数据失败')
    console.error('Load analysis data error:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 下载报告
 */
const downloadReport = () => {
  ElMessage.success('报告下载功能开发中...')
}

/**
 * 跳转到历史页面
 */
const goToHistory = () => {
  router.push('/analysis/history')
}

/**
 * 开始新的分析
 */
const startNewAnalysis = () => {
  router.push('/video/upload')
}

// 组件挂载时加载数据
onMounted(() => {
  loadAnalysisData()
})
</script>

<style scoped>
.analysis-result {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 32px;
}

.page-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
}

.page-description {
  color: #6b7280;
  font-size: 1.1rem;
}

.result-content {
  margin-bottom: 32px;
  min-height: 400px;
}

.result-alert {
  margin-bottom: 24px;
}

.score-card,
.analysis-card,
.suggestion-card,
.detail-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.score-content {
  text-align: center;
  padding: 20px 0;
}

.main-score {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40px;
}

.score-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
}

.score-number {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1;
}

.score-label {
  font-size: 0.9rem;
  opacity: 0.9;
  margin-top: 4px;
}

.score-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
}

.score-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-item .label {
  font-weight: 500;
  color: #374151;
  min-width: 80px;
}

.analysis-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}

.metric-item:last-child {
  border-bottom: none;
}

.metric-label {
  font-weight: 500;
  color: #374151;
}

.metric-value {
  font-weight: 600;
  color: #1f2937;
}

.suggestions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-item {
  margin-bottom: 8px;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

@media (max-width: 768px) {
  .analysis-result {
    padding: 16px;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .main-score {
    flex-direction: column;
    gap: 20px;
  }

  .score-details {
    align-items: center;
  }

  .action-buttons {
    flex-direction: column;
    align-items: center;
  }

  .action-buttons .el-button {
    width: 200px;
  }
}
</style>
