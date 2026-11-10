/**
 * @fileoverview 日志模块类型定义
 * @module core/logger/types
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 定义日志模块的所有类型和接口
 */

/**
 * 日志级别枚举
 */
export enum LogLevel {
  /** 调试信息，用于开发调试 */
  DEBUG = 0,
  /** 一般信息，用于记录程序运行状态 */
  INFO = 1,
  /** 警告信息，用于记录潜在问题 */
  WARN = 2,
  /** 错误信息，用于记录错误和异常 */
  ERROR = 3,
  /** 致命错误，用于记录导致程序无法继续运行的严重错误 */
  FATAL = 4,
}

/**
 * 日志级别名称映射
 */
export const LogLevelNames: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.FATAL]: 'FATAL',
}

/**
 * 日志上下文信息
 */
export interface LogContext {
  /** 模块名称 */
  module?: string
  /** 功能名称 */
  function?: string
  /** 用户ID */
  userId?: string
  /** 请求ID */
  requestId?: string
  /** 会话ID */
  sessionId?: string
  /** 自定义标签 */
  tags?: string[]
  /** 额外数据 */
  [key: string]: unknown
}

/**
 * 日志条目
 */
export interface LogEntry {
  /** 时间戳 */
  timestamp: string
  /** 日志级别 */
  level: LogLevel
  /** 日志级别名称 */
  levelName: string
  /** 日志消息 */
  message: string
  /** 上下文信息 */
  context?: LogContext
  /** 错误对象（如果有） */
  error?: Error
  /** 额外数据 */
  data?: unknown
  /** 环境信息 */
  env?: {
    mode: string
    version?: string
  }
}

/**
 * 日志输出目标类型
 */
export type LogTarget = 'console' | 'remote' | 'file' | 'custom'

/**
 * 日志输出器接口
 */
export interface LogAppender {
  /** 输出器名称 */
  name: string
  /** 输出日志 */
  append(entry: LogEntry): void | Promise<void>
  /** 刷新缓冲区 */
  flush?(): void | Promise<void>
}

/**
 * 日志配置接口
 */
export interface LoggerConfig {
  /** 日志级别（低于此级别的日志将被过滤） */
  level: LogLevel
  /** 是否启用日志 */
  enabled: boolean
  /** 是否启用敏感信息脱敏 */
  enableMasking: boolean
  /** 日志输出目标 */
  targets: LogTarget[]
  /** 自定义输出器 */
  appenders?: LogAppender[]
  /** 是否在开发环境输出到控制台 */
  enableConsoleInDev: boolean
  /** 是否在生产环境输出到控制台 */
  enableConsoleInProd: boolean
  /** 远程日志服务URL（如果使用remote目标） */
  remoteUrl?: string
  /** 是否启用性能监控日志 */
  enablePerformanceLog: boolean
  /** 日志格式函数 */
  formatter?: (entry: LogEntry) => string
}

/**
 * 日志记录选项
 */
export interface LogOptions {
  /** 上下文信息 */
  context?: LogContext
  /** 额外数据 */
  data?: unknown
  /** 错误对象 */
  error?: Error
  /** 是否跳过敏感信息脱敏 */
  skipMasking?: boolean
}
