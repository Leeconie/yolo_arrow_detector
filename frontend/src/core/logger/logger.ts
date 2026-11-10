/**
 * @fileoverview 日志记录器核心实现
 * @module core/logger/logger
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 提供统一的日志记录接口，支持结构化日志、敏感信息脱敏、多目标输出等
 */

import { LogLevel, LogLevelNames, type LogEntry, type LogContext, type LogOptions } from './types'
import { getLoggerConfig } from './config'
import { createDefaultAppenders } from './appenders'
import { maskSensitiveObject, maskSensitive } from '@/utils/sensitive'
import { getEnvMode } from '@/core/config/env'

/**
 * 日志记录器类
 */
export class Logger {
  private config = getLoggerConfig()
  private appenders = createDefaultAppenders()

  /**
   * 检查是否应该记录此级别的日志
   */
  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) {
      return false
    }
    return level >= this.config.level
  }

  /**
   * 创建日志条目
   */
  private createLogEntry(level: LogLevel, message: string, options?: LogOptions): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      levelName: LogLevelNames[level],
      message,
      context: options?.context,
      error: options?.error,
      env: {
        mode: getEnvMode(),
      },
    }

    // 处理数据（可能需要脱敏）
    if (options?.data !== undefined) {
      if (this.config.enableMasking && !options.skipMasking) {
        // 脱敏处理
        if (typeof options.data === 'object' && options.data !== null) {
          entry.data = maskSensitiveObject(options.data as Record<string, unknown>)
        } else if (typeof options.data === 'string') {
          entry.data = maskSensitive(options.data)
        } else {
          entry.data = options.data
        }
      } else {
        entry.data = options.data
      }
    }

    // 处理上下文中的敏感信息
    if (entry.context && this.config.enableMasking && !options?.skipMasking) {
      entry.context = maskSensitiveObject(entry.context as Record<string, unknown>)
    }

    return entry
  }

  /**
   * 输出日志
   * @internal
   */
  log(level: LogLevel, message: string, options?: LogOptions): void {
    if (!this.shouldLog(level)) {
      return
    }

    const entry = this.createLogEntry(level, message, options)

    // 输出到所有配置的输出器
    for (const appender of this.appenders) {
      try {
        appender.append(entry)
      } catch (error) {
        // 输出器出错时，静默处理（避免日志记录导致循环）
        console.error('日志输出器错误:', error)
      }
    }
  }

  /**
   * 记录调试日志
   */
  debug(message: string, options?: LogOptions): void {
    this.log(LogLevel.DEBUG, message, options)
  }

  /**
   * 记录信息日志
   */
  info(message: string, options?: LogOptions): void {
    this.log(LogLevel.INFO, message, options)
  }

  /**
   * 记录警告日志
   */
  warn(message: string, options?: LogOptions): void {
    this.log(LogLevel.WARN, message, options)
  }

  /**
   * 记录错误日志
   */
  error(message: string, options?: LogOptions): void {
    this.log(LogLevel.ERROR, message, options)
  }

  /**
   * 记录致命错误日志
   */
  fatal(message: string, options?: LogOptions): void {
    this.log(LogLevel.FATAL, message, options)
  }

  /**
   * 创建子日志记录器（带默认上下文）
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger()
    // 保存原始的log方法
    const originalLog = childLogger.log.bind(childLogger)
    // 重写log方法，自动添加上下文
    ;(childLogger as unknown as { log: typeof childLogger.log }).log = (
      level: LogLevel,
      message: string,
      options?: LogOptions,
    ) => {
      originalLog(level, message, {
        ...options,
        context: {
          ...context,
          ...options?.context,
        },
      })
    }
    return childLogger
  }

  /**
   * 刷新所有输出器的缓冲区
   */
  async flush(): Promise<void> {
    for (const appender of this.appenders) {
      if (appender.flush) {
        try {
          await appender.flush()
        } catch (error) {
          console.error('刷新日志输出器失败:', error)
        }
      }
    }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<typeof this.config>): void {
    this.config = { ...this.config, ...config }
    // 重新创建输出器
    this.appenders = createDefaultAppenders()
  }
}

/**
 * 默认日志记录器实例
 */
export const logger = new Logger()
