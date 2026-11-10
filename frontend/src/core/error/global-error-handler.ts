/**
 * @fileoverview 全局错误处理器
 * @module core/error/global-error-handler
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 处理全局错误、未捕获的Promise错误、资源加载错误等
 */

import { logger } from '@/core/logger'
import { ElMessage } from 'element-plus'

/**
 * 错误类型
 */
export enum ErrorType {
  /** JavaScript运行时错误 */
  RUNTIME_ERROR = 'runtime_error',
  /** Promise未捕获错误 */
  UNHANDLED_REJECTION = 'unhandled_rejection',
  /** 资源加载错误 */
  RESOURCE_ERROR = 'resource_error',
  /** 网络错误 */
  NETWORK_ERROR = 'network_error',
  /** 未知错误 */
  UNKNOWN = 'unknown',
}

/**
 * 错误信息接口
 */
export interface ErrorInfo {
  type: ErrorType
  message: string
  stack?: string
  filename?: string
  lineno?: number
  colno?: number
  timestamp: number
  userAgent?: string
  url?: string
}

/**
 * 全局错误处理器配置
 */
export interface GlobalErrorHandlerConfig {
  /** 是否启用错误处理 */
  enabled?: boolean
  /** 是否显示错误提示 */
  showErrorMessages?: boolean
  /** 错误上报函数 */
  reportFn?: (error: ErrorInfo) => void | Promise<void>
  /** 错误恢复函数 */
  recoveryFn?: (error: ErrorInfo) => void | Promise<void>
}

/**
 * 全局错误处理器类
 */
export class GlobalErrorHandler {
  private config: Required<GlobalErrorHandlerConfig>
  private errorCount = 0
  private readonly maxErrorCount = 10
  private errorWindow: number[] = []
  private readonly errorWindowSize = 60000 // 1分钟

  constructor(config: GlobalErrorHandlerConfig = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      showErrorMessages: config.showErrorMessages ?? true,
      reportFn: config.reportFn ?? (() => {}),
      recoveryFn: config.recoveryFn ?? (() => {}),
    }
  }

  /**
   * 初始化全局错误处理
   */
  init(): void {
    if (!this.config.enabled || typeof window === 'undefined') return

    // 处理JavaScript运行时错误
    window.addEventListener('error', (event) => {
      this.handleError(event.error || new Error(event.message), {
        type: ErrorType.RUNTIME_ERROR,
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      })
    })

    // 处理未捕获的Promise错误
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
      this.handleError(error, {
        type: ErrorType.UNHANDLED_REJECTION,
        message: error.message,
      })
      // 阻止默认行为（控制台错误）
      event.preventDefault()
    })

    // 处理资源加载错误
    window.addEventListener(
      'error',
      (event) => {
        const target = event.target as
          | HTMLElement
          | HTMLImageElement
          | HTMLScriptElement
          | HTMLLinkElement
          | null
        if (target && 'tagName' in target) {
          const filename = 'src' in target ? target.src : 'href' in target ? target.href : undefined
          this.handleError(
            new Error(`资源加载失败: ${target.tagName}`),
            {
              type: ErrorType.RESOURCE_ERROR,
              message: `资源加载失败: ${target.tagName}`,
              filename,
            },
            false, // 资源加载错误不显示用户提示
          )
        }
      },
      true,
    ) // 使用捕获阶段

    logger.info('全局错误处理器已初始化', {
      context: {
        module: 'error',
        function: 'GlobalErrorHandler.init',
      },
    })
  }

  /**
   * 处理错误
   */
  private async handleError(
    error: Error,
    info: Partial<ErrorInfo>,
    showMessage: boolean = true,
  ): Promise<void> {
    // 检查错误频率，防止错误风暴
    if (this.isErrorStorm()) {
      logger.warn('错误频率过高，暂停处理', {
        context: {
          module: 'error',
          function: 'GlobalErrorHandler.handleError',
        },
        data: {
          errorCount: this.errorCount,
          maxErrorCount: this.maxErrorCount,
        },
      })
      return
    }

    this.errorCount++
    const now = Date.now()
    this.errorWindow.push(now)
    this.errorWindow = this.errorWindow.filter((time) => now - time < this.errorWindowSize)

    const errorInfo: ErrorInfo = {
      type: info.type || ErrorType.UNKNOWN,
      message: error.message || info.message || '未知错误',
      stack: error.stack,
      filename: info.filename,
      lineno: info.lineno,
      colno: info.colno,
      timestamp: now,
      userAgent: navigator.userAgent,
      url: window.location.href,
    }

    // 记录错误日志
    logger.error('全局错误捕获', {
      context: {
        module: 'error',
        function: 'GlobalErrorHandler.handleError',
      },
      error,
      data: errorInfo,
    })

    // 显示错误提示
    if (this.config.showErrorMessages && showMessage) {
      this.showErrorMessage(errorInfo)
    }

    // 上报错误
    try {
      await this.config.reportFn(errorInfo)
    } catch (reportError) {
      logger.error('错误上报失败', {
        context: {
          module: 'error',
          function: 'GlobalErrorHandler.handleError.reportFn',
        },
        error: reportError instanceof Error ? reportError : new Error(String(reportError)),
      })
    }

    // 尝试错误恢复
    try {
      await this.config.recoveryFn(errorInfo)
    } catch (recoveryError) {
      logger.error('错误恢复失败', {
        context: {
          module: 'error',
          function: 'GlobalErrorHandler.handleError.recoveryFn',
        },
        error: recoveryError instanceof Error ? recoveryError : new Error(String(recoveryError)),
      })
    }
  }

  /**
   * 显示错误消息
   */
  private showErrorMessage(errorInfo: ErrorInfo): void {
    let message = ''

    switch (errorInfo.type) {
      case ErrorType.RUNTIME_ERROR:
        message = '页面运行时出现错误，请刷新页面重试。'
        break
      case ErrorType.UNHANDLED_REJECTION:
        message = '操作失败，请稍后重试。'
        break
      case ErrorType.RESOURCE_ERROR:
        // 资源加载错误不显示用户提示
        return
      case ErrorType.NETWORK_ERROR:
        message = '网络连接异常，请检查网络设置。'
        break
      default:
        message = '发生未知错误，请刷新页面重试。'
    }

    ElMessage.error({
      message,
      duration: 5000,
      showClose: true,
    })
  }

  /**
   * 检查是否是错误风暴
   */
  private isErrorStorm(): boolean {
    const now = Date.now()
    const recentErrors = this.errorWindow.filter((time) => now - time < this.errorWindowSize)
    return recentErrors.length >= this.maxErrorCount
  }

  /**
   * 手动报告错误
   */
  async reportError(error: Error, type: ErrorType = ErrorType.UNKNOWN): Promise<void> {
    await this.handleError(error, { type })
  }

  /**
   * 清除错误计数
   */
  clear(): void {
    this.errorCount = 0
    this.errorWindow = []
  }

  /**
   * 启用错误处理
   */
  enable(): void {
    this.config.enabled = true
    this.init()
  }

  /**
   * 禁用错误处理
   */
  disable(): void {
    this.config.enabled = false
  }
}

/**
 * 默认全局错误处理器实例
 */
export const defaultGlobalErrorHandler = new GlobalErrorHandler()
