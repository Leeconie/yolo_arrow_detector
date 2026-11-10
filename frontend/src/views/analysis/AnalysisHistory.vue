<template>
  <div class="analysis-history">
    <div class="page-header">
      <h1 class="page-title">
        <el-icon>
          <DataAnalysis />
        </el-icon>
        分析历史
      </h1>
      <p class="page-description">查看您以往的射箭分析结果和技术报告</p>
    </div>

    <div class="filters-section">
      <el-card shadow="never" class="filters-card">
        <template #header>
          <div class="filters-header">
            <el-icon>
              <Filter />
            </el-icon>
            <span>筛选条件</span>
          </div>
        </template>
        <div class="filters-content">
          <el-row :gutter="20" class="filters-row">
            <el-col :xs="24" :sm="24" :md="24" :lg="12" :xl="8" :xxl="6">
              <div class="filter-item">
                <label class="filter-label">日期范围</label>
                <el-date-picker
                  v-model="dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  clearable
                  size="small"
                  style="width: 100%; max-width: 320px"
                  @change="handleDateFilter"
                />
              </div>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="5" :xxl="4">
              <div class="filter-item">
                <label class="filter-label">稳定性评分</label>
                <el-select
                  v-model="scoreFilter"
                  placeholder="选择评分"
                  clearable
                  size="small"
                  style="width: 100%"
                  @change="handleScoreFilter"
                >
                  <el-option label="优秀 (80-100)" value="excellent" />
                  <el-option label="良好 (60-79)" value="good" />
                  <el-option label="需改进 (0-59)" value="poor" />
                </el-select>
              </div>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="6" :xxl="6">
              <div class="filter-item">
                <label class="filter-label">搜索分析</label>
                <el-input
                  v-model="searchKeyword"
                  placeholder="输入分析名称"
                  clearable
                  size="small"
                  style="width: 100%"
                  @input="handleSearch"
                >
                  <template #prefix>
                    <el-icon>
                      <Search />
                    </el-icon>
                  </template>
                </el-input>
              </div>
            </el-col>
            <el-col :xs="24" :sm="24" :md="8" :lg="24" :xl="5" :xxl="4">
              <div class="filter-item">
                <label class="filter-label">&nbsp;</label>
                <el-button
                  type="primary"
                  @click="refreshData"
                  size="small"
                  block
                  style="max-width: 120px"
                >
                  <el-icon>
                    <Refresh />
                  </el-icon>
                  刷新
                </el-button>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-card>
    </div>

    <div class="history-list" v-loading="loading">
      <el-empty v-if="!loading && filteredAnalyses.length === 0" description="暂无分析记录" />

      <div v-else class="analysis-cards">
        <el-card
          v-for="analysis in filteredAnalyses"
          :key="analysis.id"
          class="analysis-card"
          shadow="hover"
          @click="viewAnalysisDetail(analysis)"
        >
          <template #header>
            <div class="analysis-header">
              <div class="analysis-title">
                <el-icon>
                  <VideoPlay />
                </el-icon>
                <span>{{ analysis.title }}</span>
              </div>
              <el-tag :type="getScoreType(analysis.stabilityScore)" size="small">
                稳定性: {{ analysis.stabilityScore }}
              </el-tag>
            </div>
          </template>

          <div class="analysis-content">
            <div class="analysis-meta">
              <div class="meta-item">
                <el-icon>
                  <Clock />
                </el-icon>
                <span>{{ formatDate(analysis.createdAt) }}</span>
              </div>
              <div class="meta-item">
                <el-icon>
                  <Aim />
                </el-icon>
                <span>偏差: {{ analysis.deviation }}cm</span>
              </div>
              <div class="meta-item">
                <el-icon>
                  <Timer />
                </el-icon>
                <span>时长: {{ analysis.duration }}</span>
              </div>
            </div>

            <div class="analysis-preview">
              <img
                :src="analysis.thumbnail"
                :alt="analysis.title"
                class="preview-image"
                @error="handleImageError"
              />
              <div class="preview-overlay">
                <el-button type="primary" size="small" @click.stop="viewAnalysisDetail(analysis)">
                  查看详情
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <div class="pagination-section" v-if="total > 0">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview 分析历史页面
 * @module views/analysis/AnalysisHistory
 * @author HeZaoCha
 * @date 2026-01-11
 * @description 显示用户的射箭分析历史记录
 * @dependencies vue, vue-router, element-plus, @element-plus/icons-vue
 */

import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  DataAnalysis,
  Filter,
  Search,
  Refresh,
  VideoPlay,
  Clock,
  Aim,
  Timer,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()

/**
 * 分析记录接口
 */
interface AnalysisRecord {
  id: string
  title: string
  createdAt: string
  stabilityScore: number
  deviation: number
  duration: string
  thumbnail: string
  videoUrl?: string
  reportUrl?: string
}

// 响应式数据
const loading = ref(false)
const analyses = ref<AnalysisRecord[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 筛选条件
const dateRange = ref<string[]>([])
const scoreFilter = ref<string>('')
const searchKeyword = ref('')

/**
 * 模拟数据加载
 */
const loadAnalyses = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // 模拟数据
    const mockData: AnalysisRecord[] = [
      {
        id: '1',
        title: '射箭分析 - 2024-01-10 14:30',
        createdAt: '2024-01-10T14:30:00Z',
        stabilityScore: 85,
        deviation: 3.2,
        duration: '02:15',
        thumbnail: '/api/placeholder/300/200',
      },
      {
        id: '2',
        title: '射箭分析 - 2024-01-09 16:45',
        createdAt: '2024-01-09T16:45:00Z',
        stabilityScore: 72,
        deviation: 5.8,
        duration: '01:58',
        thumbnail: '/api/placeholder/300/200',
      },
      {
        id: '3',
        title: '射箭分析 - 2024-01-08 11:20',
        createdAt: '2024-01-08T11:20:00Z',
        stabilityScore: 91,
        deviation: 2.1,
        duration: '03:12',
        thumbnail: '/api/placeholder/300/200',
      },
    ]

    analyses.value = mockData
    total.value = mockData.length
  } catch (error) {
    ElMessage.error('加载分析历史失败')
    console.error('Load analyses error:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 过滤后的分析记录
 */
const filteredAnalyses = computed(() => {
  let filtered = analyses.value

  // 日期筛选
  if (dateRange.value && dateRange.value.length === 2) {
    const [startDate, endDate] = dateRange.value
    if (startDate && endDate) {
      filtered = filtered.filter((analysis) => {
        const analysisDate = new Date(analysis.createdAt).toISOString().split('T')[0]
        return analysisDate && analysisDate >= startDate && analysisDate <= endDate
      })
    }
  }

  // 评分筛选
  if (scoreFilter.value) {
    filtered = filtered.filter((analysis) => {
      switch (scoreFilter.value) {
        case 'excellent':
          return analysis.stabilityScore >= 80
        case 'good':
          return analysis.stabilityScore >= 60 && analysis.stabilityScore < 80
        case 'poor':
          return analysis.stabilityScore < 60
        default:
          return true
      }
    })
  }

  // 关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter((analysis) => analysis.title.toLowerCase().includes(keyword))
  }

  return filtered
})

/**
 * 获取评分类型
 */
const getScoreType = (score: number): 'success' | 'warning' | 'danger' => {
  if (score >= 80) return 'success'
  if (score >= 60) return 'warning'
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
 * 处理日期筛选
 */
const handleDateFilter = () => {
  currentPage.value = 1
}

/**
 * 处理评分筛选
 */
const handleScoreFilter = () => {
  currentPage.value = 1
}

/**
 * 处理搜索
 */
const handleSearch = () => {
  currentPage.value = 1
}

/**
 * 刷新数据
 */
const refreshData = () => {
  loadAnalyses()
}

/**
 * 查看分析详情
 */
const viewAnalysisDetail = (analysis: AnalysisRecord) => {
  router.push(`/analysis/${analysis.id}`)
}

/**
 * 处理图片加载错误
 */
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement

  // 防止无限循环加载
  if (img.dataset.errorHandled) {
    return
  }

  img.dataset.errorHandled = 'true'

  // 设置默认图片，如果不存在则隐藏图片区域
  img.style.display = 'none'

  // 显示默认占位符
  const placeholder = document.createElement('div')
  placeholder.className = 'image-placeholder'
  placeholder.innerHTML = `
    <el-icon size="48" style="color: #d1d5db;">
      <Picture />
    </el-icon>
    <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0 0;">图片暂无</p>
  `

  img.parentNode?.appendChild(placeholder)
}

/**
 * 处理页码变化
 */
const handleCurrentChange = (page: number) => {
  currentPage.value = page
}

/**
 * 处理每页条数变化
 */
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

// 组件挂载时加载数据
onMounted(() => {
  loadAnalyses()
})
</script>

<style scoped>
.analysis-history {
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

.filters-section {
  margin-bottom: 24px;
}

.filters-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.filters-content {
  padding-top: 16px;
}

.filters-row {
  align-items: end;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-label {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  margin: 0;
}

.history-list {
  min-height: 400px;
}

.analysis-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.analysis-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.analysis-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.analysis-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.analysis-content {
  display: flex;
  gap: 16px;
}

.analysis-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  color: #6b7280;
}

.analysis-preview {
  position: relative;
  width: 120px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.analysis-card:hover .preview-overlay {
  opacity: 1;
}

.pagination-section {
  margin-top: 32px;
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .analysis-history {
    padding: 16px;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .analysis-cards {
    grid-template-columns: 1fr;
  }

  .analysis-content {
    flex-direction: column;
  }

  .analysis-preview {
    width: 100%;
    height: 120px;
  }
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #9ca3af;
}
</style>
