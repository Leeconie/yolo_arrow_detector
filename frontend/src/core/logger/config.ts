/**
 * @fileoverview 日志模块配置
 * @module core/logger/config
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 日志模块的配置管理，支持从环境变量读取配置
 */

import { LogLevel, type LoggerConfig } from './types'
import { getEnvMode } from '@/core/config/env'

/**
 * 从环境变量读取日志级别
 */
function getLogLevelFromEnv(): LogLevel {
  const level = import.meta.env.VITE_LOG_LEVEL?.toUpperCase()
  switch (level) {
    case 'DEBUG':
      return LogLevel.DEBUG
    case 'INFO':
      return LogLevel.INFO
    case 'WARN':
      return LogLevel.WARN
    case 'ERROR':
      return LogLevel.ERROR
    case 'FATAL':
      return LogLevel.FATAL
    default:
      // 根据环境自动设置默认级别
      const mode = getEnvMode()
      const modeStr = mode as string
      if (mode === 'development' || modeStr === 'dev') {
        return LogLevel.DEBUG
      }
      if (mode === 'test') {
        return LogLevel.INFO
      }
      return LogLevel.WARN // 生产环境默认WARN
  }
}

/**
 * 从环境变量读取布尔配置
 */
function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  const value = import.meta.env[key]
  if (value === undefined || value === '') {
    return defaultValue
  }
  return value === 'true' || value === '1'
}

/**
 * 从环境变量读取字符串配置
 */
function getEnvString(key: string, defaultValue: string): string {
  const value = import.meta.env[key]
  return value !== undefined && value !== '' ? value : defaultValue
}

/**
 * 默认日志配置
 */
export const defaultLoggerConfig: LoggerConfig = {
  /** 日志级别，从环境变量读取，默认根据环境自动设置 */
  level: getLogLevelFromEnv(),
  /** 是否启用日志，从环境变量读取，默认true */
  enabled: getEnvBoolean('VITE_LOG_ENABLED', true),
  /** 是否启用敏感信息脱敏，从环境变量读取，默认true */
  enableMasking: getEnvBoolean('VITE_LOG_ENABLE_MASKING', true),
  /** 日志输出目标，从环境变量读取，默认['console'] */
  targets: (() => {
    const targetsStr = getEnvString('VITE_LOG_TARGETS', 'console')
    return targetsStr.split(',').map((t) => t.trim()) as Array<
      'console' | 'remote' | 'file' | 'custom'
    >
  })(),
  /** 是否在开发环境输出到控制台，从环境变量读取，默认true */
  enableConsoleInDev: getEnvBoolean('VITE_LOG_ENABLE_CONSOLE_IN_DEV', true),
  /** 是否在生产环境输出到控制台，从环境变量读取，默认false */
  enableConsoleInProd: getEnvBoolean('VITE_LOG_ENABLE_CONSOLE_IN_PROD', false),
  /** 远程日志服务URL，从环境变量读取 */
  remoteUrl: getEnvString('VITE_LOG_REMOTE_URL', ''),
  /** 是否启用性能监控日志，从环境变量读取，默认false */
  enablePerformanceLog: getEnvBoolean('VITE_LOG_ENABLE_PERFORMANCE', false),
}

/**
 * 获取当前环境的日志配置
 */
export function getLoggerConfig(): LoggerConfig {
  return { ...defaultLoggerConfig }
}
