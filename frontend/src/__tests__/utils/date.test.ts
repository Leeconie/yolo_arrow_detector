/**
 * @fileoverview 日期处理工具单元测试
 * @module utils/date.test
 * @author HeZaoCha
 * @date 2026-01-10
 */

import { describe, it, expect } from 'vitest'
import { formatDate, parseDate, addDays, daysBetween, formatTime } from '@/utils/date'

describe('日期处理工具', () => {
  describe('formatDate', () => {
    it('应该正确格式化Date对象', () => {
      const date = new Date('2026-01-07T12:30:45')
      expect(formatDate(date, 'YYYY-MM-DD')).toBe('2026-01-07')
      expect(formatDate(date, 'YYYY-MM-DD HH:mm:ss')).toBe('2026-01-07 12:30:45')
    })

    it('应该正确格式化时间戳', () => {
      // 使用一个确定的时间戳：2026-01-07 12:30:45 UTC
      // 注意：时间戳是UTC时间，formatDate会转换为本地时间
      // 使用正确的时间戳：2026-01-07T12:30:45Z
      const timestamp = 1767789045000 // 2026-01-07T12:30:45Z
      const result = formatDate(timestamp, 'YYYY-MM-DD')
      // 验证结果包含正确的日期（可能是2026-01-07或2026-01-08，取决于时区）
      expect(result).toMatch(/2026-01-0[78]/)
    })

    it('应该正确格式化日期字符串', () => {
      const dateString = '2026-01-07T12:30:45'
      expect(formatDate(dateString, 'YYYY-MM-DD')).toBe('2026-01-07')
    })

    it('应该使用默认格式', () => {
      const date = new Date('2026-01-07T12:30:45')
      const result = formatDate(date)
      expect(result).toMatch(/2026-01-07 \d{2}:\d{2}:\d{2}/)
    })

    it('应该处理不同的格式模板', () => {
      const date = new Date('2026-01-07T12:30:45')
      expect(formatDate(date, 'YYYY年MM月DD日')).toBe('2026年01月07日')
      expect(formatDate(date, 'HH:mm')).toBe('12:30')
    })

    it('应该在无效日期时抛出错误', () => {
      expect(() => formatDate(new Date('invalid'))).toThrow('Invalid date')
      expect(() => formatDate(NaN)).toThrow('Invalid date')
    })
  })

  describe('parseDate', () => {
    it('应该正确解析日期字符串', () => {
      const date = parseDate('2026-01-07')
      expect(date).toBeInstanceOf(Date)
      expect(date.getFullYear()).toBe(2026)
      expect(date.getMonth()).toBe(0) // 0-based
      expect(date.getDate()).toBe(7)
    })

    it('应该正确解析带时间的日期字符串', () => {
      const date = parseDate('2026-01-07T12:30:45')
      expect(date).toBeInstanceOf(Date)
      expect(date.getHours()).toBe(12)
      expect(date.getMinutes()).toBe(30)
    })

    it('应该在无效日期字符串时抛出错误', () => {
      expect(() => parseDate('invalid-date')).toThrow('Invalid date string: invalid-date')
      expect(() => parseDate('')).toThrow()
    })
  })

  describe('addDays', () => {
    it('应该正确添加正数天数', () => {
      const date = new Date('2026-01-07')
      const result = addDays(date, 7)
      expect(result.getDate()).toBe(14)
    })

    it('应该正确添加负数天数', () => {
      const date = new Date('2026-01-07')
      const result = addDays(date, -7)
      expect(result.getDate()).toBe(31) // 2024-12-31
      expect(result.getMonth()).toBe(11) // December
    })

    it('应该处理跨月情况', () => {
      const date = new Date('2026-01-31')
      const result = addDays(date, 1)
      expect(result.getMonth()).toBe(1) // February
      expect(result.getDate()).toBe(1)
    })

    it('应该处理跨年情况', () => {
      const date = new Date('2025-12-31')
      const result = addDays(date, 1)
      expect(result.getFullYear()).toBe(2026)
      expect(result.getMonth()).toBe(0) // January
      expect(result.getDate()).toBe(1)
    })

    it('应该不修改原始日期对象', () => {
      const date = new Date('2026-01-07')
      const originalDate = new Date(date)
      addDays(date, 7)
      expect(date.getTime()).toBe(originalDate.getTime())
    })
  })

  describe('daysBetween', () => {
    it('应该正确计算两个日期之间的天数差', () => {
      const date1 = new Date('2026-01-01')
      const date2 = new Date('2026-01-07')
      expect(daysBetween(date1, date2)).toBe(6)
    })

    it('应该正确处理负数结果（date2早于date1）', () => {
      const date1 = new Date('2026-01-07')
      const date2 = new Date('2026-01-01')
      expect(daysBetween(date1, date2)).toBe(-6)
    })

    it('应该正确处理相同日期', () => {
      const date = new Date('2026-01-07')
      expect(daysBetween(date, date)).toBe(0)
    })

    it('应该正确处理跨年情况', () => {
      const date1 = new Date('2025-12-31')
      const date2 = new Date('2026-01-01')
      expect(daysBetween(date1, date2)).toBe(1)
    })

    it('应该正确处理跨月情况', () => {
      const date1 = new Date('2026-01-31')
      const date2 = new Date('2026-02-01')
      expect(daysBetween(date1, date2)).toBe(1)
    })
  })

  describe('formatTime', () => {
    it('应该正确格式化秒数为时间字符串', () => {
      expect(formatTime(0)).toBe('00:00')
      expect(formatTime(60)).toBe('01:00')
      expect(formatTime(125)).toBe('02:05')
      expect(formatTime(3661)).toBe('61:01')
    })

    it('应该处理NaN和负数', () => {
      expect(formatTime(NaN)).toBe('00:00')
      expect(formatTime(-10)).toBe('00:00')
      expect(formatTime(-100)).toBe('00:00')
    })

    it('应该正确处理小数', () => {
      expect(formatTime(90.5)).toBe('01:30')
      expect(formatTime(125.9)).toBe('02:05')
    })
  })
})
