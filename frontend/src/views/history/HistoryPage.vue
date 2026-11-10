<template>
  <div class="history-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1 class="page-title">
        <el-icon>
          <DataAnalysis />
        </el-icon>
        分析历史
      </h1>
      <p class="page-description">查看您以往的射箭分析结果和技术报告</p>
    </div>

    <!-- 统计概览 -->
    <div class="stats-section">
      <el-row :gutter="16" class="stats-row">
        <el-col :xs="24" :sm="12" :md="6" v-for="stat in statsData" :key="stat.key">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon :size="24" :color="stat.color">
                  <component :is="stat.icon" />
                </el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stat.value }}</div>
                <div class="stat-label">{{ stat.label }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filters-card" shadow="never">
      <template #header>
        <div class="filters-header">
          <el-icon>
            <Filter />
          </el-icon>
          <span>筛选条件</span>
        </div>
      </template>

      <el-form :model="filters" label-width="100px" class="filters-form">
        <el-row :gutter="16">
          <el-col :xs="24" :sm="24" :md="24" :lg="12" :xl="8" :xxl="6">
            <el-form-item label="搜索文件名">
              <el-input
                v-model="filters.keyword"
                placeholder="输入文件名关键词..."
                clearable
                prefix-icon="Search"
                @input="debouncedSearch"
              />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="5" :xxl="4">
            <el-form-item label="视频类型">
              <el-select
                v-model="filters.videoType"
                placeholder="选择类型"
                clearable
                @change="handleFilterChange"
              >
                <el-option label="全部" value="" />
                <el-option label="人体视频" value="HUMAN" />
                <el-option label="射箭视频" value="ARCHERY" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="5" :xxl="4">
            <el-form-item label="上传状态">
              <el-select
                v-model="filters.status"
                placeholder="选择状态"
                clearable
                @change="handleFilterChange"
              >
                <el-option label="全部" value="" />
                <el-option label="成功" value="success" />
                <el-option label="失败" value="failed" />
                <el-option label="已取消" value="cancelled" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="24" :md="24" :lg="12" :xl="8" :xxl="6">
            <el-form-item label="上传时间">
              <el-date-picker
                v-model="filters.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                clearable
                @change="handleFilterChange"
              />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="24" :md="8" :lg="24" :xl="5" :xxl="4">
            <el-form-item>
              <el-button type="primary" @click="handleRefresh" :loading="loading">
                <el-icon>
                  <Refresh />
                </el-icon>
                刷新
              </el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 数据可视化图表 -->
    <el-card class="charts-card" shadow="never">
      <template #header>
        <div class="charts-header">
          <el-icon>
            <DataAnalysis />
          </el-icon>
          <span>数据可视化</span>
        </div>
      </template>

      <HistoryCharts :statistics="statistics || undefined" :loading="loading" />
    </el-card>

    <!-- 历史记录列表 -->
    <el-card class="records-card" shadow="never">
      <template #header>
        <div class="records-header">
          <div class="records-title">
            <el-icon>
              <List />
            </el-icon>
            <span>历史记录 ({{ totalRecords }}条)</span>
          </div>
          <div class="records-actions">
            <el-button
              v-if="selectedRecords.length > 0"
              type="danger"
              size="small"
              :loading="batchOperationLoading"
              @click="handleBatchDelete"
            >
              <el-icon v-if="!batchOperationLoading">
                <Delete />
              </el-icon>
              批量删除 ({{ selectedRecords.length }})
            </el-button>
            <el-button
              v-if="selectedRecords.length > 0 && !batchOperationLoading"
              type="success"
              size="small"
              @click="handleBatchExport"
            >
              <el-icon>
                <Download />
              </el-icon>
              导出选中
            </el-button>
          </div>
        </div>
      </template>

      <!-- 批量操作进度 -->
      <div v-if="batchOperationLoading" class="batch-progress">
        <div class="progress-info">
          <span>正在处理 {{ batchOperationProgress }}%</span>
        </div>
        <el-progress
          :percentage="batchOperationProgress"
          :show-text="false"
          :stroke-width="8"
          color="#409EFF"
        />
      </div>

      <el-table
        v-loading="loading"
        :data="records"
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />

        <el-table-column label="文件信息" min-width="300">
          <template #default="{ row }">
            <div class="file-info">
              <el-avatar
                :src="row.thumbnailUrl"
                :size="40"
                shape="square"
                @error="handleImageError"
              >
                <el-icon>
                  <VideoPlay v-if="row.videoType === 'HUMAN'" />
                  <Aim v-else />
                </el-icon>
              </el-avatar>
              <div class="file-details">
                <div class="filename" :title="row.filename">{{ row.filename }}</div>
                <div class="file-meta">
                  <el-tag size="small" :type="getTypeTagType(row.videoType)">
                    {{ row.videoTypeText }}
                  </el-tag>
                  <span class="file-size">{{ formatFileSize(row.fileSize) }}</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="上传时间" width="180">
          <template #default="{ row }">
            <div class="upload-time">
              <div class="time-main">{{ formatDate(row.uploadTime) }}</div>
              <div class="time-sub">{{ formatTime(row.uploadTime) }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button-group size="small">
              <el-button v-if="row.canViewAnalysis" type="primary" @click="handleViewAnalysis(row)">
                查看分析
              </el-button>
              <el-button v-if="row.canReupload" type="warning" @click="handleReupload">
                重新上传
              </el-button>
              <el-dropdown @command="(command: string) => handleRecordAction(command, row)">
                <el-button size="small">
                  更多
                  <el-icon class="el-icon--right">
                    <ArrowDown />
                  </el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="download">
                      <el-icon>
                        <Download />
                      </el-icon>
                      下载原文件
                    </el-dropdown-item>
                    <el-dropdown-item command="export">
                      <el-icon>
                        <Document />
                      </el-icon>
                      导出报告
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" divided>
                      <el-icon>
                        <Delete />
                      </el-icon>
                      删除记录
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="totalRecords"
          :page-sizes="totalRecords > 1000 ? [20, 50, 100, 200] : [10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview 历史记录页面
 * @module views/history/HistoryPage
 * @author HeZaoCha
 * @date 2026-01-11
 * @description 历史记录管理主页面，提供查询、筛选、统计和操作功能
 * @dependencies vue, vue-router, element-plus, @element-plus/icons-vue
 */

import { ref, reactive, onMounted, computed, watch } from 'vue'
import { debounce } from 'lodash-es'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  DataAnalysis,
  Filter,
  Refresh,
  List,
  Delete,
  Download,
  Document,
  ArrowDown,
  VideoPlay,
  Aim,
} from '@element-plus/icons-vue'

// 组合函数
import { useHistoryQuery } from '@/modules/video/upload/composables/useHistoryQuery'
import { useHistoryStats } from '@/modules/video/upload/composables/useHistoryStats'
import { useHistoryActions } from '@/modules/video/upload/composables/useHistoryActions'

// 组件
import HistoryCharts from '@/modules/video/upload/components/HistoryCharts.vue'

// 类型
import type { UploadHistoryRecord } from '@/modules/video/upload/types/history'
import { HistoryRecordStatus } from '@/modules/video/upload/types/history'
import { VideoType } from '@/modules/video/upload/types/uploadTypes'

// 工具函数
// import { formatFileSize } from '@/utils/common' // 不存在，使用本地定义

// 路由
const router = useRouter()

// 响应式数据
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const selectedRecords = ref<UploadHistoryRecord[]>([])
const batchOperationLoading = ref(false)
const batchOperationProgress = ref(0)

// 性能优化数据
const lastSearchTime = ref(0)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const searchCache = new Map<string, any>()
const MAX_CACHE_SIZE = 50 // 限制缓存大小避免内存泄漏

// 筛选表单
const filters = reactive({
  keyword: '',
  videoType: '' as '' | VideoType,
  status: '' as '' | HistoryRecordStatus,
  dateRange: null as [string, string] | null,
})

// 组合函数
const {
  records,
  totalRecords,
  executeQuery,
  setPage,
  setPageSize,
  setKeyword,
  setVideoTypeFilter,
  setStatusFilter,
  setDateRangeFilter,
  refresh,
} = useHistoryQuery()

const { statistics, loadStatistics } = useHistoryStats()

const { deleteRecord, deleteRecords, exportRecords } = useHistoryActions()

// 计算属性
const statsData = computed(() => {
  if (!statistics.value) return []

  const totalUploads = statistics.value.totalUploads
  const data = [
    {
      key: 'totalUploads',
      icon: 'DocumentAdd',
      label: totalUploads > 1000 ? '总上传次数 (大数据量)' : '总上传次数',
      value: totalUploads.toLocaleString(),
      color: totalUploads > 1000 ? '#F56C6C' : '#409EFF',
    },
    {
      key: 'successRate',
      icon: 'TrendCharts',
      label: '成功率',
      value: `${statistics.value.successRate.toFixed(1)}%`,
      color: '#67C23A',
    },
    {
      key: 'totalSize',
      icon: 'Files',
      label: '总上传大小',
      value: formatFileSize(statistics.value.totalSize),
      color: '#E6A23C',
    },
    {
      key: 'averageUploadTime',
      icon: 'Clock',
      label: '平均上传时间',
      value: `${Math.round(statistics.value.averageUploadTime / 1000)}s`,
      color: '#F56C6C',
    },
  ]

  return data
})

// 监听分页变化
watch([currentPage, pageSize], () => {
  setPage(currentPage.value)
  setPageSize(pageSize.value)
  executeQuery()
})

// 防抖搜索函数
const debouncedSearch = debounce(() => {
  handleFilterChange()
}, 300)

// 方法
const handleFilterChange = async () => {
  const startTime = Date.now()
  loading.value = true

  try {
    setKeyword(filters.keyword)
    setVideoTypeFilter(filters.videoType ? [filters.videoType] : [])
    setStatusFilter(filters.status ? [filters.status] : [])
    setDateRangeFilter(
      filters.dateRange ? [new Date(filters.dateRange[0]), new Date(filters.dateRange[1])] : null,
    )

    // 执行查询
    await executeQuery()

    // 记录搜索时间用于性能监控
    lastSearchTime.value = Date.now() - startTime

    // 如果搜索时间超过200ms，给出性能提示
    if (lastSearchTime.value > 200) {
      console.warn(`搜索性能警告: 查询耗时 ${lastSearchTime.value}ms`)
    }
  } catch {
    ElMessage.error('搜索失败，请重试')
  } finally {
    loading.value = false
  }
}

const handleRefresh = async () => {
  loading.value = true
  try {
    await Promise.all([refresh(), loadStatistics()])
    ElMessage.success('数据已刷新')
  } catch {
    ElMessage.error('刷新失败')
  } finally {
    loading.value = false
  }
}

const handleSelectionChange = (selection: UploadHistoryRecord[]) => {
  selectedRecords.value = selection
}

const handleBatchDelete = async () => {
  if (selectedRecords.value.length === 0) return

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRecords.value.length} 条记录吗？此操作不可撤销。`,
      '批量删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
      },
    )

    batchOperationLoading.value = true
    batchOperationProgress.value = 0

    const success = await deleteRecords(selectedRecords.value, {
      onProgress: (current: number, total: number) => {
        batchOperationProgress.value = Math.round((current / total) * 100)
      },
    })

    if (success) {
      ElMessage.success(`成功删除 ${selectedRecords.value.length} 条记录`)
      selectedRecords.value = []
      await handleRefresh()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败')
    }
  } finally {
    batchOperationLoading.value = false
    batchOperationProgress.value = 0
  }
}

const handleBatchExport = async () => {
  if (selectedRecords.value.length === 0) return

  try {
    batchOperationLoading.value = true
    batchOperationProgress.value = 0

    await exportRecords(selectedRecords.value, {
      format: 'csv',
      filename: `upload-history-${new Date().toISOString().split('T')[0]}`,
    })

    ElMessage.success('数据导出成功')
  } catch {
    ElMessage.error('数据导出失败')
  } finally {
    batchOperationLoading.value = false
    batchOperationProgress.value = 0
  }
}

const handleViewAnalysis = (record: UploadHistoryRecord) => {
  if (record.analysisResultId) {
    router.push({
      name: 'AnalysisResult',
      params: { id: record.analysisResultId },
    })
  } else {
    ElMessage.warning('暂无分析结果')
  }
}

const handleReupload = () => {
  // 这里需要与上传系统集成
  ElMessage.warning('重新上传功能正在开发中')
}

const handleRecordAction = async (command: string, record: UploadHistoryRecord): Promise<void> => {
  switch (command) {
    case 'download':
      ElMessage.warning('下载功能正在开发中')
      break
    case 'export':
      await exportRecords([record], {
        format: 'csv',
        filename: `upload-record-${record.id}-${new Date().toISOString().split('T')[0]}`,
      })
      ElMessage.success('记录导出成功')
      break
    case 'delete':
      deleteRecord(record).then((success) => {
        if (success) {
          handleRefresh()
        }
      })
      break
  }
}

const handleSizeChange = (newSize: number) => {
  pageSize.value = newSize
}

const handleCurrentChange = (newPage: number) => {
  currentPage.value = newPage
}

// 工具函数
const getTypeTagType = (videoType: VideoType) => {
  return videoType === VideoType.HUMAN ? 'success' : 'primary'
}

const getStatusTagType = (status: HistoryRecordStatus) => {
  switch (status) {
    case HistoryRecordStatus.SUCCESS:
      return 'success'
    case HistoryRecordStatus.FAILED:
      return 'danger'
    case HistoryRecordStatus.CANCELLED:
      return 'warning'
    default:
      return 'info'
  }
}

const getStatusText = (status: HistoryRecordStatus) => {
  switch (status) {
    case HistoryRecordStatus.SUCCESS:
      return '成功'
    case HistoryRecordStatus.FAILED:
      return '失败'
    case HistoryRecordStatus.CANCELLED:
      return '已取消'
    default:
      return '未知'
  }
}

const formatDate = (date: Date | string) => {
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN')
}

const formatTime = (date: Date | string) => {
  const d = new Date(date)
  return d.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = '/img/default-target.png' // 默认图片
  img.setAttribute('data-error-handled', 'true')
}

// 工具函数
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// 缓存清理函数
const cleanupCache = () => {
  if (searchCache.size > MAX_CACHE_SIZE) {
    // 清理最旧的缓存项
    const keysToDelete = Array.from(searchCache.keys()).slice(0, 10)
    keysToDelete.forEach((key) => searchCache.delete(key))
  }
}

// 初始化
onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([executeQuery(), loadStatistics()])
    // 定期清理缓存
    setInterval(cleanupCache, 5 * 60 * 1000) // 每5分钟清理一次
  } catch {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped lang="scss">
.history-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
  text-align: center;

  .page-title {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 28px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 8px;

    .el-icon {
      color: var(--el-color-primary);
    }
  }

  .page-description {
    color: var(--el-text-color-regular);
    font-size: 14px;
  }
}

.stats-section {
  margin-bottom: 24px;

  .stats-row {
    .stat-card {
      height: 100%;

      .stat-content {
        display: flex;
        align-items: center;
        gap: 16px;

        .stat-icon {
          flex-shrink: 0;
        }

        .stat-info {
          flex: 1;

          .stat-value {
            font-size: 24px;
            font-weight: 600;
            color: var(--el-text-color-primary);
            line-height: 1.2;
          }

          .stat-label {
            font-size: 12px;
            color: var(--el-text-color-regular);
            margin-top: 4px;
          }
        }
      }
    }
  }
}

.filters-card {
  margin-bottom: 24px;

  .filters-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
  }

  .filters-form {
    .el-form-item {
      margin-bottom: 16px;
    }
  }
}

.records-card {
  .records-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;

    .records-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
    }

    .records-actions {
      display: flex;
      gap: 8px;
    }
  }
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;

  .file-details {
    flex: 1;

    .filename {
      font-weight: 500;
      color: var(--el-text-color-primary);
      margin-bottom: 4px;
      word-break: break-word;
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .file-meta {
      display: flex;
      align-items: center;
      gap: 8px;

      .file-size {
        font-size: 12px;
        color: var(--el-text-color-regular);
      }
    }
  }
}

.upload-time {
  .time-main {
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  .time-sub {
    font-size: 12px;
    color: var(--el-text-color-regular);
    margin-top: 2px;
  }
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-light);
}

.batch-progress {
  margin-top: 16px;
  padding: 16px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);

  .progress-info {
    display: flex;
    justify-content: center;
    margin-bottom: 12px;
    font-size: 14px;
    color: var(--el-text-color-regular);
  }

  .el-progress {
    width: 100%;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .history-page {
    padding: 16px;
  }

  .page-header {
    .page-title {
      font-size: 24px;
    }
  }

  .stats-section {
    .stats-row {
      .el-col {
        margin-bottom: 16px;
      }
    }
  }

  .records-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;

    .records-actions {
      justify-content: center;
    }
  }

  .file-info {
    .file-details {
      .filename {
        max-width: 150px;
      }
    }
  }
}

@media (max-width: 480px) {
  .file-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
