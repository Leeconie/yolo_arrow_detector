/**
 * @fileoverview HistoryCharts组件测试
 * @module __tests__/modules/video/upload/components/HistoryCharts.test
 * @author HeZaoCha
 * @date 2026-01-11
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createApp } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import HistoryCharts from '@/modules/video/upload/components/HistoryCharts.vue'
import type { UploadStatistics } from '@/modules/video/upload/types/history'

// Mock ECharts
vi.mock('echarts', () => ({
  use: vi.fn(),
  CanvasRenderer: vi.fn(),
}))

vi.mock('vue-echarts', () => ({
  default: {
    name: 'VChart',
    props: ['option', 'autoresize'],
    template: '<div class="mock-chart"></div>',
  },
}))

describe('HistoryCharts', () => {
  let app: ReturnType<typeof createApp>

  const mockStatistics: UploadStatistics = {
    totalUploads: 100,
    totalSize: 1024 * 1024 * 500, // 500MB
    successRate: 85.5,
    averageUploadTime: 30000, // 30秒
    typeDistribution: { human: 60, archery: 40 },
    dailyUploads: [
      { date: '2024-01-01', count: 10 },
      { date: '2024-01-02', count: 15 },
      { date: '2024-01-03', count: 8 },
    ],
    weeklyUploads: [],
    monthlyUploads: [],
  }

  beforeEach(() => {
    app = createApp({})
    const pinia = createPinia()
    app.use(pinia)
    setActivePinia(pinia)
  })

  describe('组件渲染', () => {
    it('应该正确渲染图表控制栏', () => {
      const wrapper = mount(HistoryCharts, {
        props: {
          statistics: mockStatistics,
        },
      })

      expect(wrapper.find('.chart-controls').exists()).toBe(true)
      expect(wrapper.find('.control-left').exists()).toBe(true)
      expect(wrapper.find('.control-right').exists()).toBe(true)
    })

    it('应该显示三个图表切换按钮', () => {
      const wrapper = mount(HistoryCharts, {
        props: {
          statistics: mockStatistics,
        },
      })

      const buttons = wrapper.findAll('.el-button-group .el-button')
      expect(buttons.length).toBe(3)
      expect(buttons[0].text()).toContain('趋势分析')
      expect(buttons[1].text()).toContain('类型分布')
      expect(buttons[2].text()).toContain('性能统计')
    })

    it('应该显示时间范围选择器和导出按钮', () => {
      const wrapper = mount(HistoryCharts, {
        props: {
          statistics: mockStatistics,
        },
      })

      expect(wrapper.find('.el-select').exists()).toBe(true)
      expect(wrapper.findAll('.el-button').some((btn) => btn.text().includes('导出'))).toBe(true)
    })
  })

  describe('图表切换', () => {
    it('应该默认显示趋势分析图表', () => {
      const wrapper = mount(HistoryCharts, {
        props: {
          statistics: mockStatistics,
        },
      })

      expect(wrapper.vm.activeTab).toBe('trend')
      expect(wrapper.findAll('.chart-wrapper')[0].attributes('style')).not.toContain(
        'display: none',
      )
    })

    it('应该能够切换到类型分布图表', async () => {
      const wrapper = mount(HistoryCharts, {
        props: {
          statistics: mockStatistics,
        },
      })

      const typeButtons = wrapper.findAll('.el-button-group .el-button')
      await typeButtons[1].trigger('click')

      expect(wrapper.vm.activeTab).toBe('distribution')
    })

    it('应该能够切换到性能统计图表', async () => {
      const wrapper = mount(HistoryCharts, {
        props: {
          statistics: mockStatistics,
        },
      })

      const typeButtons = wrapper.findAll('.el-button-group .el-button')
      await typeButtons[2].trigger('click')

      expect(wrapper.vm.activeTab).toBe('performance')
    })
  })

  describe('时间范围筛选', () => {
    it('应该提供多种时间范围选项', () => {
      const wrapper = mount(HistoryCharts, {
        props: {
          statistics: mockStatistics,
        },
      })

      const select = wrapper.find('.el-select')
      expect(select.exists()).toBe(true)
    })

    it('应该能够更改时间范围', async () => {
      const wrapper = mount(HistoryCharts, {
        props: {
          statistics: mockStatistics,
        },
      })

      await wrapper.setData({ timeRange: '30d' })
      expect(wrapper.vm.timeRange).toBe('30d')
    })
  })

  describe('数据处理', () => {
    it('应该正确处理空统计数据', () => {
      const wrapper = mount(HistoryCharts, {
        props: {
          statistics: null,
        },
      })

      expect(wrapper.vm.trendChartOption.title).toBeUndefined()
    })

    it('应该正确格式化图表数据', () => {
      const wrapper = mount(HistoryCharts, {
        props: {
          statistics: mockStatistics,
        },
      })

      const trendOption = wrapper.vm.trendChartOption
      expect(trendOption.title?.text).toBe('上传趋势分析')
      expect(trendOption.series[0].name).toBe('上传次数')
    })

    it('应该正确处理类型分布数据', () => {
      const wrapper = mount(HistoryCharts, {
        props: {
          statistics: mockStatistics,
        },
      })

      const distributionOption = wrapper.vm.distributionChartOption
      expect(distributionOption.title?.text).toBe('视频类型分布')
      expect(distributionOption.series[0].data.length).toBe(2)
    })
  })

  describe('导出功能', () => {
    it('应该提供导出按钮', () => {
      const wrapper = mount(HistoryCharts, {
        props: {
          statistics: mockStatistics,
        },
      })

      const exportButton = wrapper.findAll('.el-button').find((btn) => btn.text().includes('导出'))
      expect(exportButton).toBeTruthy()
    })
  })

  describe('响应式设计', () => {
    it('应该在移动端正确显示', () => {
      const wrapper = mount(HistoryCharts, {
        props: {
          statistics: mockStatistics,
        },
      })

      // 测试移动端样式类
      expect(wrapper.classes()).toContain('history-charts')
    })
  })
})
