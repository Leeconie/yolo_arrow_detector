/**
 * @fileoverview 通用类型定义单元测试
 * @module types/common.test
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 测试通用类型定义的正确性和类型导出
 */

import { describe, it, expect } from 'vitest'
import type { Pagination, SortOrder, TimeRange, ID, KeyValuePair, TreeNode } from '@/types/common'

describe('通用类型定义', () => {
  describe('Pagination接口', () => {
    it('应该正确定义Pagination接口', () => {
      const pagination: Pagination = {
        current: 1,
        pageSize: 10,
        total: 100,
      }
      expect(pagination.current).toBe(1)
      expect(pagination.pageSize).toBe(10)
      expect(pagination.total).toBe(100)
    })

    it('应该支持可选totalPages字段', () => {
      const paginationWithTotalPages: Pagination = {
        current: 2,
        pageSize: 20,
        total: 100,
        totalPages: 5,
      }
      expect(paginationWithTotalPages.totalPages).toBe(5)

      const paginationWithoutTotalPages: Pagination = {
        current: 1,
        pageSize: 10,
        total: 50,
      }
      expect(paginationWithoutTotalPages.totalPages).toBeUndefined()
    })

    it('应该支持正确的数据类型', () => {
      const pagination: Pagination = {
        current: 1,
        pageSize: 10,
        total: 0,
      }
      expect(typeof pagination.current).toBe('number')
      expect(typeof pagination.pageSize).toBe('number')
      expect(typeof pagination.total).toBe('number')
    })
  })

  describe('SortOrder接口', () => {
    it('应该正确定义SortOrder接口', () => {
      const sortOrder: SortOrder = {
        field: 'createdAt',
        order: 'asc',
      }
      expect(sortOrder.field).toBe('createdAt')
      expect(sortOrder.order).toBe('asc')
    })

    it('应该支持desc排序', () => {
      const sortOrder: SortOrder = {
        field: 'updatedAt',
        order: 'desc',
      }
      expect(sortOrder.order).toBe('desc')
    })

    it('应该支持任意字段名', () => {
      const sortOrder: SortOrder = {
        field: 'name',
        order: 'asc',
      }
      expect(sortOrder.field).toBe('name')
    })
  })

  describe('TimeRange接口', () => {
    it('应该支持Date类型', () => {
      const timeRange: TimeRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31'),
      }
      expect(timeRange.start).toBeInstanceOf(Date)
      expect(timeRange.end).toBeInstanceOf(Date)
    })

    it('应该支持string类型', () => {
      const timeRange: TimeRange = {
        start: '2024-01-01',
        end: '2024-12-31',
      }
      expect(typeof timeRange.start).toBe('string')
      expect(typeof timeRange.end).toBe('string')
    })

    it('应该支持number类型（时间戳）', () => {
      const timeRange: TimeRange = {
        start: 1704067200000,
        end: 1735689600000,
      }
      expect(typeof timeRange.start).toBe('number')
      expect(typeof timeRange.end).toBe('number')
    })
  })

  describe('ID类型', () => {
    it('应该支持string类型', () => {
      const id: ID = '123'
      expect(typeof id).toBe('string')
      expect(id).toBe('123')
    })

    it('应该支持number类型', () => {
      const id: ID = 123
      expect(typeof id).toBe('number')
      expect(id).toBe(123)
    })
  })

  describe('KeyValuePair接口', () => {
    it('应该正确定义KeyValuePair接口', () => {
      const kv: KeyValuePair<string> = {
        key: 'name',
        value: 'Test',
      }
      expect(kv.key).toBe('name')
      expect(kv.value).toBe('Test')
    })

    it('应该支持泛型类型', () => {
      interface User {
        id: number
        name: string
      }
      const kv: KeyValuePair<User> = {
        key: 'user',
        value: { id: 1, name: 'Test' },
      }
      expect(kv.value.id).toBe(1)
      expect(kv.value.name).toBe('Test')
    })

    it('应该支持默认unknown类型', () => {
      const kv: KeyValuePair = {
        key: 'data',
        value: { any: 'data' },
      }
      expect(kv.value).toBeDefined()
    })
  })

  describe('TreeNode接口', () => {
    it('应该正确定义TreeNode接口', () => {
      const node: TreeNode = {
        id: 1,
        label: 'Root',
      }
      expect(node.id).toBe(1)
      expect(node.label).toBe('Root')
    })

    it('应该支持可选children字段', () => {
      const nodeWithChildren: TreeNode = {
        id: 1,
        label: 'Parent',
        children: [
          { id: 2, label: 'Child 1' },
          { id: 3, label: 'Child 2' },
        ],
      }
      expect(nodeWithChildren.children).toHaveLength(2)
      expect(nodeWithChildren.children?.[0].id).toBe(2)

      const nodeWithoutChildren: TreeNode = {
        id: 1,
        label: 'Leaf',
      }
      expect(nodeWithoutChildren.children).toBeUndefined()
    })

    it('应该支持可选data字段', () => {
      interface CustomData {
        type: string
        count: number
      }
      const node: TreeNode<CustomData> = {
        id: 1,
        label: 'Node',
        data: { type: 'folder', count: 10 },
      }
      expect(node.data?.type).toBe('folder')
      expect(node.data?.count).toBe(10)
    })

    it('应该支持嵌套树结构', () => {
      const tree: TreeNode = {
        id: 1,
        label: 'Root',
        children: [
          {
            id: 2,
            label: 'Child 1',
            children: [
              { id: 3, label: 'Grandchild 1' },
              { id: 4, label: 'Grandchild 2' },
            ],
          },
          { id: 5, label: 'Child 2' },
        ],
      }
      expect(tree.children?.[0].children).toHaveLength(2)
      expect(tree.children?.[0].children?.[0].id).toBe(3)
    })
  })

  describe('类型导出', () => {
    it('应该正确导出所有类型', () => {
      // 验证类型可以正常导入和使用
      const pagination: Pagination = { current: 1, pageSize: 10, total: 100 }
      const sortOrder: SortOrder = { field: 'name', order: 'asc' }
      const timeRange: TimeRange = { start: new Date(), end: new Date() }
      const id: ID = '123'
      const kv: KeyValuePair = { key: 'test', value: 'value' }
      const node: TreeNode = { id: 1, label: 'Node' }

      expect(pagination).toBeDefined()
      expect(sortOrder).toBeDefined()
      expect(timeRange).toBeDefined()
      expect(id).toBeDefined()
      expect(kv).toBeDefined()
      expect(node).toBeDefined()
    })
  })
})
