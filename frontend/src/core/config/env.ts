/**
 * @fileoverview 环境配置
 * @module core/config/env
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 管理环境变量和环境类型判断
 */

/**
 * 环境类型
 */
export type EnvMode = 'development' | 'test' | 'production'

/**
 * 环境配置接口
 */
export interface EnvConfig {
  /** 环境模式 */
  mode: EnvMode
  /** API基础URL */
  apiBaseUrl: string
  /** 是否开发模式 */
  isDev: boolean
  /** 是否生产模式 */
  isProd: boolean
  /** 是否测试模式 */
  isTest: boolean
}

/**
 * 获取当前环境模式
 * @returns 环境模式
 */
export function getEnvMode(): EnvMode {
  return (import.meta.env.MODE as EnvMode) || 'development'
}

/**
 * 判断是否为开发环境
 * @returns 是否为开发环境
 */
export function isDevelopment(): boolean {
  return getEnvMode() === 'development'
}

/**
 * 判断是否为生产环境
 * @returns 是否为生产环境
 */
export function isProduction(): boolean {
  return getEnvMode() === 'production'
}

/**
 * 判断是否为测试环境
 * @returns 是否为测试环境
 */
export function isTest(): boolean {
  return getEnvMode() === 'test'
}

/**
 * 获取环境配置
 * @returns 环境配置对象
 */
export function getEnvConfig(): EnvConfig {
  const mode = getEnvMode()

  return {
    mode,
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
    isDev: mode === 'development',
    isProd: mode === 'production',
    isTest: mode === 'test',
  }
}

/**
 * 环境配置实例
 */
export const envConfig = getEnvConfig()
