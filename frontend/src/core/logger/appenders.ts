/**
 * @fileoverview 日志输出器实现
 * @module core/logger/appenders
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 实现各种日志输出器，包括控制台输出器、远程输出器等
 */

import type { LogEntry, LogAppender } from './types'
import { getLoggerConfig } from './config'
import { getEnvMode } from '@/core/config/env'

/**
 * 控制台输出器
 */
export class ConsoleAppender implements LogAppender {
  name = 'console'

  append(entry: LogEntry): void {
    const config = getLoggerConfig()
    const mode = getEnvMode()

    // 检查是否应该输出到控制台
    const isDev = mode === 'development' || (mode as string) === 'dev'
    const isProd = mode === 'production' || (mode as string) === 'prod'

    if (isDev) {
      if (!config.enableConsoleInDev) {
        return
      }
    } else if (isProd) {
      if (!config.enableConsoleInProd) {
        return
      }
    }

    // 格式化日志消息
    const formattedMessage = this.formatMessage(entry)
    const formattedData = this.formatData(entry)

    // 根据日志级别选择不同的控制台方法
    switch (entry.level) {
      case 0: // DEBUG
        console.debug(formattedMessage, ...formattedData)
        break
      case 1: // INFO
        console.info(formattedMessage, ...formattedData)
        break
      case 2: // WARN
        console.warn(formattedMessage, ...formattedData)
        break
      case 3: // ERROR
      case 4: // FATAL
        console.error(formattedMessage, ...formattedData)
        if (entry.error) {
          console.error('错误堆栈:', entry.error)
        }
        break
      default:
        console.log(formattedMessage, ...formattedData)
    }
  }

  /**
   * 格式化日志消息
   */
  private formatMessage(entry: LogEntry): string {
    const parts: string[] = [`[${entry.levelName}]`, `[${entry.timestamp}]`]

    if (entry.context?.module) {
      parts.push(`[${entry.context.module}]`)
    }

    if (entry.context?.function) {
      parts.push(`[${entry.context.function}]`)
    }

    parts.push(entry.message)

    return parts.join(' ')
  }

  /**
   * 格式化日志数据
   */
  private formatData(entry: LogEntry): unknown[] {
    const data: unknown[] = []

    if (entry.context) {
      const contextData: Record<string, unknown> = { ...entry.context }
      // 移除已显示的字段
      delete contextData.module
      delete contextData.function

      if (Object.keys(contextData).length > 0) {
        data.push({ context: contextData })
      }
    }

    if (entry.data) {
      data.push({ data: entry.data })
    }

    return data
  }
}

/**
 * 远程日志输出器
 */
export class RemoteAppender implements LogAppender {
  name = 'remote'
  private buffer: LogEntry[] = []
  private bufferSize = 10
  private flushInterval = 5000 // 5秒
  private flushTimer?: number

  constructor() {
    // 启动定时刷新
    if (typeof window !== 'undefined') {
      this.flushTimer = window.setInterval(() => {
        this.flush()
      }, this.flushInterval)
    }
  }

  async append(entry: LogEntry): Promise<void> {
    const config = getLoggerConfig()

    // 如果没有配置远程URL，跳过
    if (!config.remoteUrl) {
      return
    }

    // 添加到缓冲区
    this.buffer.push(entry)

    // 如果缓冲区满了，立即刷新
    if (this.buffer.length >= this.bufferSize) {
      await this.flush()
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) {
      return
    }

    const config = getLoggerConfig()
    if (!config.remoteUrl) {
      return
    }

    const logs = [...this.buffer]
    this.buffer = []

    try {
      // 发送日志到远程服务
      await fetch(config.remoteUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logs,
          timestamp: new Date().toISOString(),
          env: {
            mode: getEnvMode(),
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          },
        }),
        // 不阻塞主线程
        keepalive: true,
      })
    } catch (error) {
      // 远程日志发送失败时，静默处理（避免日志记录导致循环）
      console.warn('远程日志发送失败:', error)
    }
  }

  /**
   * 清理定时器
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = undefined
    }
    // 清理时刷新剩余日志
    this.flush()
  }
}

/**
 * 创建默认输出器列表
 */
export function createDefaultAppenders(): LogAppender[] {
  const appenders: LogAppender[] = []
  const config = getLoggerConfig()

  for (const target of config.targets) {
    switch (target) {
      case 'console':
        appenders.push(new ConsoleAppender())
        break
      case 'remote':
        appenders.push(new RemoteAppender())
        break
      // file 和 custom 需要用户自定义实现
      default:
        break
    }
  }

  // 添加自定义输出器
  if (config.appenders) {
    appenders.push(...config.appenders)
  }

  return appenders
}
