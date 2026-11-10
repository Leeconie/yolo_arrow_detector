/**
 * @fileoverview 日志模块统一导出
 * @module core/logger
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 统一导出日志模块的所有功能
 */

export { Logger, logger } from './logger'
export { LogLevel, LogLevelNames, type LogContext, type LogOptions, type LogEntry } from './types'
export { defaultLoggerConfig, getLoggerConfig } from './config'
export { ConsoleAppender, RemoteAppender, createDefaultAppenders } from './appenders'

// 直接导出logger实例的方法作为便捷函数
import { logger } from './logger'
export const { debug, info, warn, error, fatal } = logger
