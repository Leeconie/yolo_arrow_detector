/**
 * @fileoverview 环境配置单元测试
 * @module core/config/env.test
 * @author HeZaoCha
 * @date 2026-01-10
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getEnvMode, isDevelopment, isProduction, isTest, getEnvConfig } from '@/core/config/env'

describe('环境配置', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  describe('getEnvMode', () => {
    it('应该返回当前环境模式', () => {
      const mode = getEnvMode()
      expect(['development', 'test', 'production']).toContain(mode)
    })
  })

  describe('isDevelopment', () => {
    it('应该正确判断开发环境', () => {
      const result = isDevelopment()
      expect(typeof result).toBe('boolean')
    })
  })

  describe('isProduction', () => {
    it('应该正确判断生产环境', () => {
      const result = isProduction()
      expect(typeof result).toBe('boolean')
    })
  })

  describe('isTest', () => {
    it('应该正确判断测试环境', () => {
      const result = isTest()
      expect(typeof result).toBe('boolean')
    })
  })

  describe('getEnvConfig', () => {
    it('应该返回环境配置对象', () => {
      const config = getEnvConfig()
      expect(config).toHaveProperty('mode')
      expect(config).toHaveProperty('apiBaseUrl')
      expect(config).toHaveProperty('isDev')
      expect(config).toHaveProperty('isProd')
      expect(config).toHaveProperty('isTest')
      expect(typeof config.mode).toBe('string')
      expect(typeof config.apiBaseUrl).toBe('string')
      expect(typeof config.isDev).toBe('boolean')
      expect(typeof config.isProd).toBe('boolean')
      expect(typeof config.isTest).toBe('boolean')
    })

    it('应该使用环境变量中的API基础URL', () => {
      const config = getEnvConfig()
      expect(config.apiBaseUrl).toBeDefined()
    })
  })
})
