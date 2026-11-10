<template>
  <div class="history-charts">
    <!-- 图表控制栏 -->
    <div class="chart-controls">
      <div class="control-left">
        <el-button-group size="small">
          <el-button :type="activeTab === 'trend' ? 'primary' : ''" @click="activeTab = 'trend'">
            <el-icon>
              <TrendCharts />
            </el-icon>
            趋势分析
          </el-button>
          <el-button
            :type="activeTab === 'distribution' ? 'primary' : ''"
            @click="activeTab = 'distribution'"
          >
            <el-icon>
              <PieChart />
            </el-icon>
            类型分布
          </el-button>
          <el-button
            :type="activeTab === 'performance' ? 'primary' : ''"
            @click="activeTab = 'performance'"
          >
            <el-icon>
              <DataAnalysis />
            </el-icon>
            性能统计
          </el-button>
        </el-button-group>
      </div>
      <div class="control-right">
        <el-select
          v-model="timeRange"
          placeholder="时间范围"
          size="small"
          style="width: 120px"
          @change="handleTimeRangeChange"
        >
          <el-option label="最近7天" value="7d" />
          <el-option label="最近30天" value="30d" />
          <el-option label="最近90天" value="90d" />
          <el-option label="全部时间" value="all" />
        </el-select>
        <el-button size="small" @click="exportChart">
          <el-icon>
            <Download />
          </el-icon>
          导出
        </el-button>
      </div>
    </div>

    <!-- 图表容器 -->
    <div class="chart-container">
      <!-- 趋势分析图表 -->
      <div v-show="activeTab === 'trend'" class="chart-wrapper">
        <v-chart ref="trendChartRef" :option="trendChartOption" :autoresize="true" class="chart" />
      </div>

      <!-- 类型分布饼图 -->
      <div v-show="activeTab === 'distribution'" class="chart-wrapper">
        <v-chart
          ref="distributionChartRef"
          :option="distributionChartOption"
          :autoresize="true"
          class="chart"
        />
      </div>

      <!-- 性能统计图表 -->
      <div v-show="activeTab === 'performance'" class="chart-wrapper">
        <v-chart
          ref="performanceChartRef"
          :option="performanceChartOption"
          :autoresize="true"
          class="chart"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview 历史记录图表组件
 * @module modules/video/upload/components/HistoryCharts
 * @author HeZaoCha
 * @date 2026-01-11
 * @description 历史记录数据可视化图表组件，支持趋势分析、类型分布、性能统计
 * @dependencies vue, vue-echarts, echarts, element-plus
 */

import { ref, computed, watch, onMounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart as EChartsPieChart, BarChart } from 'echarts/charts'
import type { ECharts } from 'echarts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'
// import type { EChartsOption } from 'echarts'
import { TrendCharts, PieChart, DataAnalysis, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 注册ECharts组件

use([
  CanvasRenderer,
  LineChart,
  EChartsPieChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
] as any)

// Props定义
interface Props {
  statistics:
    | {
        readonly totalUploads: number
        readonly totalSize: number
        readonly successRate: number
        readonly averageUploadTime: number
        readonly typeDistribution: Record<string, number>
        readonly dailyUploads: ReadonlyArray<{ readonly date: string; readonly count: number }>
        readonly weeklyUploads: ReadonlyArray<{ readonly week: string; readonly count: number }>
        readonly monthlyUploads: ReadonlyArray<{ readonly month: string; readonly count: number }>
      }
    | null
    | undefined
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

// 响应式数据
const activeTab = ref<'trend' | 'distribution' | 'performance'>('trend')
const timeRange = ref<'7d' | '30d' | '90d' | 'all'>('30d')

// 图表引用
const trendChartRef = ref<InstanceType<typeof VChart>>()
const distributionChartRef = ref<InstanceType<typeof VChart>>()
const performanceChartRef = ref<InstanceType<typeof VChart>>()

// 计算属性：趋势图表配置
const trendChartOption = computed(() => {
  if (!props.statistics) {
    return {}
  }

  const data = getFilteredData(props.statistics.dailyUploads)
  const dates = data.map((item) => item.date)
  const counts = data.map((item) => item.count)

  return {
    title: {
      text: '上传趋势分析',
      left: 'center',
      textStyle: {
        color: '#409EFF',
        fontSize: 16,
        fontWeight: 'bold',
      },
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: '#409EFF',
      textStyle: {
        color: '#fff',
      },
      formatter: (params: unknown[]) => {
        const param = params[0] as { name: string; color: string; value: number }
        return `
          <div style="font-weight: bold; margin-bottom: 8px;">${param.name}</div>
          <div style="display: flex; align-items: center;">
            <div style="width: 8px; height: 8px; background: ${param.color}; border-radius: 50%; margin-right: 8px;"></div>
            上传次数: ${param.value}
          </div>
        `
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLabel: {
        color: '#666',
        fontSize: 12,
      },
      axisLine: {
        lineStyle: {
          color: '#e5e7eb',
        },
      },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#666',
        fontSize: 12,
      },
      axisLine: {
        lineStyle: {
          color: '#e5e7eb',
        },
      },
      splitLine: {
        lineStyle: {
          color: '#f5f5f5',
          type: 'dashed',
        },
      },
    },
    series: [
      {
        name: '上传次数',
        type: 'line',
        stack: 'Total',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          color: '#409EFF',
          width: 3,
        },
        itemStyle: {
          color: '#409EFF',
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.05)' },
            ],
          },
        },
        data: counts,
      },
    ],
  }
})

// 计算属性：类型分布饼图配置
const distributionChartOption = computed(() => {
  if (!props.statistics) {
    return {}
  }

  const data = Object.entries(props.statistics.typeDistribution).map(([key, value]) => ({
    name: key === 'human' ? '人体视频' : key === 'archery' ? '射箭视频' : key,
    value,
  }))

  return {
    title: {
      text: '视频类型分布',
      left: 'center',
      textStyle: {
        color: '#409EFF',
        fontSize: 16,
        fontWeight: 'bold',
      },
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: '#409EFF',
      textStyle: {
        color: '#fff',
      },
      formatter: (params: { name: string; value: number; percent: number }) => {
        return `
          <div style="font-weight: bold; margin-bottom: 8px;">${params.name}</div>
          <div>数量: ${params.value} (${params.percent}%)</div>
        `
      },
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      textStyle: {
        color: '#666',
        fontSize: 12,
      },
    },
    series: [
      {
        name: '视频类型',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: data.map((item, index) => ({
          ...item,
          itemStyle: {
            color: index === 0 ? '#409EFF' : index === 1 ? '#67C23A' : '#E6A23C',
          },
        })),
      },
    ],
  }
})

// 计算属性：性能统计图表配置
const performanceChartOption = computed(() => {
  if (!props.statistics) {
    return {}
  }

  const data = [
    {
      name: '总上传次数',
      value: props.statistics.totalUploads,
      color: '#409EFF',
    },
    {
      name: '成功率',
      value: props.statistics.successRate,
      color: '#67C23A',
    },
    {
      name: '平均上传时间',
      value: Math.round(props.statistics.averageUploadTime / 1000), // 转换为秒
      color: '#E6A23C',
    },
  ]

  return {
    title: {
      text: '上传性能统计',
      left: 'center',
      textStyle: {
        color: '#409EFF',
        fontSize: 16,
        fontWeight: 'bold',
      },
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: '#409EFF',
      textStyle: {
        color: '#fff',
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.map((item) => item.name),
      axisLabel: {
        color: '#666',
        fontSize: 12,
        rotate: 0,
      },
      axisLine: {
        lineStyle: {
          color: '#e5e7eb',
        },
      },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#666',
        fontSize: 12,
      },
      axisLine: {
        lineStyle: {
          color: '#e5e7eb',
        },
      },
      splitLine: {
        lineStyle: {
          color: '#f5f5f5',
          type: 'dashed',
        },
      },
    },
    series: [
      {
        name: '性能指标',
        type: 'bar',
        barWidth: '60%',
        data: data.map((item, index) => ({
          value: item.value,
          itemStyle: {
            color: item.color,
          },
          label: {
            show: true,
            position: 'top',
            color: '#666',
            fontSize: 12,
            formatter: (params: { value: number }) => {
              if (index === 1) {
                return `${params.value}%`
              } else if (index === 2) {
                return `${params.value}s`
              }
              return params.value
            },
          },
        })),
      },
    ],
  }
})

// 方法
const getFilteredData = (
  data: ReadonlyArray<{ readonly date: string; readonly count: number }>,
) => {
  if (timeRange.value === 'all') {
    return data
  }

  const days = timeRange.value === '7d' ? 7 : timeRange.value === '30d' ? 30 : 90
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)

  return data.filter((item) => {
    const itemDate = new Date(item.date)
    return itemDate >= cutoffDate
  })
}

const handleTimeRangeChange = () => {
  // 时间范围变化时，图表会自动重新渲染（通过computed响应式）
}

const exportChart = () => {
  const chartRef =
    activeTab.value === 'trend'
      ? trendChartRef.value
      : activeTab.value === 'distribution'
        ? distributionChartRef.value
        : performanceChartRef.value

  if (chartRef) {
    try {
      // 获取ECharts实例

      // 获取ECharts实例 - vue-echarts组件的底层图表实例
      const chartInstance = (chartRef as InstanceType<typeof VChart> & {
        chart?: ECharts
        getChart?: () => ECharts
      }).chart || (chartRef as InstanceType<typeof VChart> & {
        chart?: ECharts
        getChart?: () => ECharts
      }).getChart?.()
      if (chartInstance) {
        const dataURL = chartInstance.getDataURL({
          type: 'png',
          pixelRatio: 2,
          backgroundColor: '#fff',
        })

        // 创建下载链接
        const link = document.createElement('a')
        link.href = dataURL
        link.download = `upload-history-chart-${activeTab.value}-${new Date().toISOString().split('T')[0]}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        ElMessage.success('图表导出成功')
      }
    } catch (error) {
      ElMessage.error('图表导出失败')
      console.error('Chart export error:', error)
    }
  }
}

// 监听统计数据变化，刷新图表
watch(
  () => props.statistics,
  () => {
    // 图表会通过computed自动更新
  },
  { deep: true },
)

// 初始化
onMounted(() => {
  // 图表初始化完成
})
</script>

<style scoped lang="scss">
.history-charts {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.chart-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;

  .control-left {
    .el-button-group {
      .el-button {
        &:first-child {
          border-top-left-radius: 6px;
          border-bottom-left-radius: 6px;
        }

        &:last-child {
          border-top-right-radius: 6px;
          border-bottom-right-radius: 6px;
        }
      }
    }
  }

  .control-right {
    display: flex;
    gap: 12px;
    align-items: center;
  }
}

.chart-container {
  height: 400px;
  position: relative;

  .chart-wrapper {
    width: 100%;
    height: 100%;

    .chart {
      width: 100%;
      height: 100%;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .history-charts {
    padding: 16px;
  }

  .chart-controls {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;

    .control-left {
      .el-button-group {
        width: 100%;

        .el-button {
          flex: 1;
        }
      }
    }

    .control-right {
      justify-content: center;
    }
  }

  .chart-container {
    height: 300px;
  }
}

@media (max-width: 480px) {
  .chart-container {
    height: 250px;
  }
}
</style>
