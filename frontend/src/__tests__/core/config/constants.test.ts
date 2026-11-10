/**
 * @fileoverview 常量定义单元测试
 * @module core/config/constants.test
 * @author HeZaoCha
 * @date 2026-01-10
 */

import { describe, it, expect } from 'vitest'
import {
  API_CONSTANTS,
  BUSINESS_CONSTANTS,
  UI_CONSTANTS,
  STORAGE_KEYS,
  ROUTE_CONSTANTS,
} from '@/core/config/constants'

describe('常量定义', () => {
  describe('API_CONSTANTS', () => {
    it('应该定义API相关常量', () => {
      expect(API_CONSTANTS).toHaveProperty('TIMEOUT')
      expect(API_CONSTANTS).toHaveProperty('RETRY_COUNT')
      expect(API_CONSTANTS).toHaveProperty('RETRY_DELAY')
      expect(typeof API_CONSTANTS.TIMEOUT).toBe('number')
      expect(typeof API_CONSTANTS.RETRY_COUNT).toBe('number')
      expect(typeof API_CONSTANTS.RETRY_DELAY).toBe('number')
    })
  })

  describe('BUSINESS_CONSTANTS', () => {
    it('应该定义业务相关常量', () => {
      expect(BUSINESS_CONSTANTS).toHaveProperty('SUCCESS_CODE')
      expect(BUSINESS_CONSTANTS).toHaveProperty('DEFAULT_PAGE_SIZE')
      expect(BUSINESS_CONSTANTS).toHaveProperty('MAX_PAGE_SIZE')
      expect(BUSINESS_CONSTANTS.SUCCESS_CODE).toBe(200)
    })
  })

  describe('UI_CONSTANTS', () => {
    it('应该定义UI相关常量', () => {
      expect(UI_CONSTANTS).toHaveProperty('DEFAULT_THEME_MODE')
      expect(UI_CONSTANTS).toHaveProperty('DEFAULT_THEME_COLOR')
      expect(UI_CONSTANTS).toHaveProperty('MESSAGE_DURATION')
      expect(UI_CONSTANTS).toHaveProperty('LOADING_DELAY')
      expect(['light', 'dark']).toContain(UI_CONSTANTS.DEFAULT_THEME_MODE)
    })
  })

  describe('STORAGE_KEYS', () => {
    it('应该定义存储键名常量', () => {
      expect(STORAGE_KEYS).toHaveProperty('TOKEN')
      expect(STORAGE_KEYS).toHaveProperty('USER_INFO')
      expect(STORAGE_KEYS).toHaveProperty('THEME_MODE')
      expect(STORAGE_KEYS).toHaveProperty('THEME_COLOR')
      expect(typeof STORAGE_KEYS.TOKEN).toBe('string')
    })
  })

  describe('ROUTE_CONSTANTS', () => {
    it('应该定义路由相关常量', () => {
      expect(ROUTE_CONSTANTS).toHaveProperty('LOGIN_PATH')
      expect(ROUTE_CONSTANTS).toHaveProperty('HOME_PATH')
      expect(ROUTE_CONSTANTS).toHaveProperty('NOT_FOUND_PATH')
      expect(ROUTE_CONSTANTS.LOGIN_PATH).toBe('/login')
      expect(ROUTE_CONSTANTS.HOME_PATH).toBe('/')
    })
  })
})
