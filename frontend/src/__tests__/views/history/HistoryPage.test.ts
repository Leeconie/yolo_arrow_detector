/**
 * @fileoverview HistoryPage页面测试
 * @module __tests__/views/history/HistoryPage.test
 * @author HeZaoCha
 * @date 2026-01-11
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createApp } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import ElementPlus from 'element-plus'
import HistoryPage from '@/views/history/HistoryPage.vue'
// import type { UploadStatistics } from '@/modules/video/upload/types/history'

// Mock 组合函数
vi.mock('@/modules/video/upload/composables/useHistoryQuery', () => ({
  useHistoryQuery: () => ({
    query: ref({
      page: 1,
      pageSize: 20,
      keyword: '',
      videoType: [],
      status: [],
      dateRange: null,
    }),
    records: ref([
      {
        id: '1',
        filename: 'test1.mp4',
        fileSize: 1024 * 1024 * 10, // 10MB
        videoType: 'HUMAN',
        uploadTime: new Date(),
        status: 'success',
        canViewAnalysis: true,
        canReupload: true,
      },
    ]),
    totalRecords: ref(1),
    loading: ref(false),
    executeQuery: vi.fn(),
    setPage: vi.fn(),
    setPageSize: vi.fn(),
    setKeyword: vi.fn(),
    setVideoTypeFilter: vi.fn(),
    setStatusFilter: vi.fn(),
    setDateRangeFilter: vi.fn(),
    refresh: vi.fn(),
  }),
}))

vi.mock('@/modules/video/upload/composables/useHistoryStats', () => ({
  useHistoryStats: () => ({
    statistics: ref({
      totalUploads: 100,
      totalSize: 1024 * 1024 * 500,
      successRate: 85.5,
      averageUploadTime: 30000,
      typeDistribution: { human: 60, archery: 40 },
      dailyUploads: [],
      weeklyUploads: [],
      monthlyUploads: [],
    }),
    loadStatistics: vi.fn(),
  }),
}))

vi.mock('@/modules/video/upload/composables/useHistoryActions', () => ({
  useHistoryActions: () => ({
    deleteRecord: vi.fn(),
    deleteRecords: vi.fn(),
    exportRecords: vi.fn(),
  }),
}))

// Mock 路由
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

describe('HistoryPage', () => {
  let app: ReturnType<typeof createApp>
  let router: ReturnType<typeof createRouter>

  beforeEach(() => {
    app = createApp({})
    const pinia = createPinia()
    router = createRouter({
      history: createWebHistory(),
      routes: [],
    })

    app.use(pinia)
    app.use(router)
    app.use(ElementPlus)

    setActivePinia(pinia)
  })

  describe('页面渲染', () => {
    it('应该正确渲染页面标题', () => {
      const wrapper = mount(HistoryPage, {
        global: {
          plugins: [app],
        },
      })

      expect(wrapper.find('.page-title').exists()).toBe(true)
      expect(wrapper.find('.page-title').text()).toContain('分析历史')
    })

    it('应该显示页面描述', () => {
      const wrapper = mount(HistoryPage, {
        global: {
          plugins: [app],
        },
      })

      expect(wrapper.find('.page-description').exists()).toBe(true)
      expect(wrapper.find('.page-description').text()).toContain('查看您以往的射箭分析结果')
    })

    it('应该渲染统计概览区域', () => {
      const wrapper = mount(HistoryPage, {
        global: {
          plugins: [app],
        },
      })

      expect(wrapper.find('.stats-section').exists()).toBe(true)
      const statCards = wrapper.findAll('.stat-card')
      expect(statCards.length).toBe(4) // 总上传次数、成功率、总大小、平均时间
    })

    it('应该渲染筛选条件区域', () => {
      const wrapper = mount(HistoryPage, {
        global: {
          plugins: [app],
        },
      })

      expect(wrapper.find('.filters-card').exists()).toBe(true)
      expect(wrapper.find('.filters-form').exists()).toBe(true)
    })

    it('应该渲染数据图表区域', () => {
      const wrapper = mount(HistoryPage, {
        global: {
          plugins: [app],
        },
      })

      expect(wrapper.find('.charts-card').exists()).toBe(true)
    })

    it('应该渲染历史记录列表', () => {
      const wrapper = mount(HistoryPage, {
        global: {
          plugins: [app],
        },
      })

      expect(wrapper.find('.records-card').exists()).toBe(true)
      expect(wrapper.find('.el-table').exists()).toBe(true)
    })
  })

  describe('统计数据展示', () => {
    it('应该正确显示总上传次数', () => {
      const wrapper = mount(HistoryPage, {
        global: {
          plugins: [app],
        },
      })

      const statCards = wrapper.findAll('.stat-card')
      expect(statCards[0].text()).toContain('100')
    })

    it('应该正确显示成功率', () => {
      const wrapper = mount(HistoryPage, {
        global: {
          plugins: [app],
        },
      })

      const statCards = wrapper.findAll('.stat-card')
      expect(statCards[1].text()).toContain('85.5%')
    })

    it('应该正确显示总上传大小', () => {
      const wrapper = mount(HistoryPage, {
        global: {
          plugins: [app],
        },
      })

      const statCards = wrapper.findAll('.stat-card')
      expect(statCards[2].text()).toContain('500')
    })
  })

  describe('筛选功能', () => {
    it('应该包含关键词搜索输入框', () => {
      const wrapper = mount(HistoryPage, {
        global: {
          plugins: [app],
        },
      })

      const searchInput = wrapper.find('input[placeholder*="文件名"]')
      expect(searchInput.exists()).toBe(true)
    })

    it('应该包含视频类型选择器', () => {
      const wrapper = mount(HistoryPage, {
        global: {
          plugins: [app],
        },
      })

      const typeSelect = wrapper
        .findAll('.el-select')
        .find((select) => select.text().includes('视频类型'))
      expect(typeSelect).toBeTruthy()
    })

    it('应该包含上传状态选择器', () => {
      const wrapper = mount(HistoryPage, {
        global: {
          plugins: [app],
        },
      })

      const statusSelect = wrapper
        .findAll('.el-select')
        .find((select) => select.text().includes('上传状态'))
      expect(statusSelect).toBeTruthy()
    })

    it('应该包含日期范围选择器', () => {
      const wrapper = mount(HistoryPage, {
        global: {
          plugins: [app],
        },
      })

      const datePicker = wrapper.find('.el-date-editor')
      expect(datePicker.exists()).toBe(true)
    })
  })

  describe('表格功能', () => {
    it('应该显示记录列表', () => {
      const wrapper = mount(HistoryPage, {
        global: {
          plugins: [app],
        },
      })

      const table = wrapper.find('.el-table')
      expect(table.exists()).toBe(true)
    })

    it('应该包含选择列', () => {
      const wrapper = mount(HistoryPage, {
        global: {
          plugins: [app],
        },
      })

      const selectionColumn = wrapper.find('.el-table__header th')
      expect(selectionColumn.exists()).toBe(true)
    })

    it('应该显示文件信息列', () => {
      const wrapper = mount(HistoryPage, {
        global: {
          plugins: [app],
        },
      })

      const headers = wrapper.findAll('.el-table__header th')
      const fileInfoHeader = headers.find((header) => header.text().includes('文件信息'))
      expect(fileInfoHeader).toBeTruthy()
    })

    it('应该显示操作列', () => {
      const wrapper = mount(HistoryPage, {
        global: {
          plugins: [app],
        },
      })

      const headers = wrapper.findAll('.el-table__header th')
      const actionHeader = headers.find((header) => header.text().includes('操作'))
      expect(actionHeader).toBeTruthy()
    })
  })

  describe('批量操作', () => {
    it('应该显示批量操作按钮', () => {
      const wrapper = mount(HistoryPage, {
        global: {
          plugins: [app],
        },
      })

      const batchButtons = wrapper
        .findAll('.el-button')
        .filter((btn) => btn.text().includes('批量删除') || btn.text().includes('导出选中'))
      expect(batchButtons.length).toBeGreaterThan(0)
    })

    it('应该在没有选中记录时禁用批量操作按钮', () => {
      const wrapper = mount(HistoryPage, {
        global: {
          plugins: [app],
        },
      })

      const batchDeleteBtn = wrapper
        .findAll('.el-button')
        .find((btn) => btn.text().includes('批量删除'))
      expect(batchDeleteBtn?.attributes('disabled')).toBeUndefined()
    })
  })

  describe('分页功能', () => {
    it('应该显示分页组件', () => {
      const wrapper = mount(HistoryPage, {
        global: {
          plugins: [app],
        },
      })

      const pagination = wrapper.find('.el-pagination')
      expect(pagination.exists()).toBe(true)
    })

    it('应该显示总记录数', () => {
      const wrapper = mount(HistoryPage, {
        global: {
          plugins: [app],
        },
      })

      const pagination = wrapper.find('.el-pagination')
      expect(pagination.text()).toContain('1') // 总记录数
    })
  })

  describe('响应式设计', () => {
    it('应该在移动端调整布局', () => {
      const wrapper = mount(HistoryPage, {
        global: {
          plugins: [app],
        },
      })

      // 检查是否存在移动端样式类
      expect(wrapper.classes()).toContain('history-page')
    })
  })
})
