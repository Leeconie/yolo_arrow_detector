/**
 * @fileoverview 通用类型定义
 * @module types/common
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 定义通用的数据类型，包括分页、排序、时间范围等
 */

/**
 * 分页类型
 */
export interface Pagination {
  /** 当前页码，从1开始 */
  current: number
  /** 每页数量 */
  pageSize: number
  /** 总记录数 */
  total: number
  /** 总页数 */
  totalPages?: number
}

/**
 * 排序类型
 */
export interface SortOrder {
  /** 排序字段 */
  field: string
  /** 排序方向：asc-升序，desc-降序 */
  order: 'asc' | 'desc'
}

/**
 * 时间范围类型
 */
export interface TimeRange {
  /** 开始时间 */
  start: Date | string | number
  /** 结束时间 */
  end: Date | string | number
}

/**
 * ID类型（支持字符串或数字）
 */
export type ID = string | number

/**
 * 通用键值对类型
 */
export interface KeyValuePair<T = unknown> {
  key: string
  value: T
}

/**
 * 树形结构节点类型
 */
export interface TreeNode<T = unknown> {
  /** 节点ID */
  id: ID
  /** 节点标签 */
  label: string
  /** 子节点 */
  children?: TreeNode<T>[]
  /** 扩展数据 */
  data?: T
}
