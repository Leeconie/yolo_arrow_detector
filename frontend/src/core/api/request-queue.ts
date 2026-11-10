/**
 * @fileoverview 请求队列管理器
 * @module core/api/request-queue
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 提供请求并发控制、优先级队列、请求去重等功能
 */

import { logger } from '@/core/logger'

/**
 * 请求优先级
 */
export enum RequestPriority {
  /** 高优先级（如登录、支付等关键操作） */
  HIGH = 1,
  /** 普通优先级（默认） */
  NORMAL = 2,
}

/**
 * 请求响应值类型
 */
type RequestResponseValue = unknown

/**
 * 请求项接口
 */
interface RequestItem {
  /** 请求唯一标识 */
  id: string
  /** 请求函数 */
  requestFn: () => Promise<RequestResponseValue>
  /** 优先级 */
  priority: RequestPriority
  /** 解析Promise的resolve函数 */
  resolve: (value: RequestResponseValue) => void
  /** 拒绝Promise的reject函数 */
  reject: (reason?: unknown) => void
  /** 创建时间 */
  createdAt: number
}

/**
 * 请求队列管理器配置
 */
export interface RequestQueueConfig {
  /** 最大并发数，默认10 */
  maxConcurrency?: number
  /** 是否启用请求去重，默认true */
  enableDeduplication?: boolean
  /** 去重时间窗口（毫秒），默认1000ms */
  deduplicationWindow?: number
}

/**
 * 请求队列管理器类
 * @description 实现请求并发控制、优先级队列、请求去重
 */
export class RequestQueue {
  /** 最大并发数 */
  private maxConcurrency: number
  /** 当前并发数 */
  private currentConcurrency: number = 0
  /** 高优先级队列 */
  private highPriorityQueue: RequestItem[] = []
  /** 普通优先级队列 */
  private normalPriorityQueue: RequestItem[] = []
  /** 是否启用请求去重 */
  private enableDeduplication: boolean
  /** 去重时间窗口 */
  private deduplicationWindow: number
  /** 待处理请求映射（用于去重） */
  private pendingRequests: Map<string, Promise<RequestResponseValue>> = new Map()
  /** 请求统计 */
  private stats = {
    total: 0,
    completed: 0,
    failed: 0,
    queued: 0,
    deduplicated: 0,
  }

  /**
   * 构造函数
   * @param config 配置选项
   */
  constructor(config: RequestQueueConfig = {}) {
    this.maxConcurrency = config.maxConcurrency ?? 10
    this.enableDeduplication = config.enableDeduplication ?? true
    this.deduplicationWindow = config.deduplicationWindow ?? 1000
  }

  /**
   * 生成请求唯一键（用于去重）
   * @param method 请求方法
   * @param url 请求URL
   * @param params 请求参数
   * @returns 请求唯一键
   */
  private generateRequestKey(
    method: string,
    url: string,
    params?: Record<string, unknown>,
  ): string {
    const sortedParams = params
      ? Object.keys(params)
          .sort()
          .reduce(
            (acc, key) => {
              acc[key] = params[key]
              return acc
            },
            {} as Record<string, unknown>,
          )
      : {}

    const paramsStr = JSON.stringify(sortedParams)
    return `${method.toUpperCase()}:${url}:${paramsStr}`
  }

  /**
   * 执行请求
   * @template T 响应数据类型
   * @param requestFn 请求函数
   * @param priority 请求优先级
   * @param method 请求方法（用于去重）
   * @param url 请求URL（用于去重）
   * @param params 请求参数（用于去重）
   * @returns Promise<T>
   */
  async execute<T>(
    requestFn: () => Promise<T>,
    priority: RequestPriority = RequestPriority.NORMAL,
    method?: string,
    url?: string,
    params?: Record<string, unknown>,
  ): Promise<T> {
    this.stats.total++

    // 请求去重
    if (this.enableDeduplication && method && url) {
      const key = this.generateRequestKey(method, url, params)
      const existingRequest = this.pendingRequests.get(key)

      if (existingRequest) {
        this.stats.deduplicated++
        logger.debug('请求去重：复用现有请求', {
          context: {
            module: 'api',
            function: 'requestQueue.execute',
          },
          data: {
            method,
            url,
            key: key.substring(0, 100), // 限制日志长度
          },
        })
        return existingRequest as Promise<T>
      }
    }

    // 如果未达到并发上限，立即执行
    if (this.currentConcurrency < this.maxConcurrency) {
      logger.debug('请求立即执行', {
        context: {
          module: 'api',
          function: 'requestQueue.execute',
        },
        data: {
          method,
          url,
          currentConcurrency: this.currentConcurrency,
          maxConcurrency: this.maxConcurrency,
        },
      })
      return this.processRequest(requestFn, method, url, params)
    }

    // 否则加入队列
    logger.debug('请求加入队列', {
      context: {
        module: 'api',
        function: 'requestQueue.execute',
      },
      data: {
        method,
        url,
        priority,
        currentConcurrency: this.currentConcurrency,
        maxConcurrency: this.maxConcurrency,
        queueSize: this.highPriorityQueue.length + this.normalPriorityQueue.length,
      },
    })
    return this.enqueue(requestFn, priority, method, url, params)
  }

  /**
   * 将请求加入队列
   * @template T 响应数据类型
   * @param requestFn 请求函数
   * @param priority 请求优先级
   * @param method 请求方法
   * @param url 请求URL
   * @param params 请求参数
   * @returns Promise<T>
   */
  private enqueue<T>(
    requestFn: () => Promise<T>,
    priority: RequestPriority,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _method?: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _url?: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _params?: Record<string, unknown>,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const requestItem: RequestItem = {
        id: `${Date.now()}-${Math.random()}`,
        requestFn: requestFn as () => Promise<RequestResponseValue>,
        priority,
        resolve: resolve as (value: RequestResponseValue) => void,
        reject,
        createdAt: Date.now(),
      }

      // 根据优先级加入对应队列
      if (priority === RequestPriority.HIGH) {
        this.highPriorityQueue.push(requestItem)
      } else {
        this.normalPriorityQueue.push(requestItem)
      }

      this.stats.queued++

      // 尝试处理队列
      this.processQueue()
    })
  }

  /**
   * 处理请求
   * @template T 响应数据类型
   * @param requestFn 请求函数
   * @param method 请求方法
   * @param url 请求URL
   * @param params 请求参数
   * @returns Promise<T>
   */
  private async processRequest<T>(
    requestFn: () => Promise<T>,
    method?: string,
    url?: string,
    params?: Record<string, unknown>,
  ): Promise<T> {
    this.currentConcurrency++

    // 如果启用去重，记录待处理请求
    let requestKey: string | undefined
    if (this.enableDeduplication && method && url) {
      requestKey = this.generateRequestKey(method, url, params)
    }

    try {
      const promise = requestFn()
      if (requestKey) {
        this.pendingRequests.set(requestKey, promise)
      }

      const result = await promise
      this.stats.completed++
      logger.debug('请求执行成功', {
        context: {
          module: 'api',
          function: 'requestQueue.processRequest',
        },
        data: {
          method,
          url,
          currentConcurrency: this.currentConcurrency,
        },
      })
      return result
    } catch (error) {
      this.stats.failed++
      logger.warn('请求执行失败', {
        context: {
          module: 'api',
          function: 'requestQueue.processRequest',
        },
        error: error instanceof Error ? error : new Error(String(error)),
        data: {
          method,
          url,
          currentConcurrency: this.currentConcurrency,
        },
      })
      throw error
    } finally {
      this.currentConcurrency--

      // 从待处理请求中移除
      if (requestKey) {
        // 延迟移除，允许去重窗口内的相同请求复用
        // 在Node.js环境中使用globalThis
        const setTimeoutFn =
          typeof window !== 'undefined' ? window.setTimeout : globalThis.setTimeout
        setTimeoutFn(() => {
          this.pendingRequests.delete(requestKey!)
        }, this.deduplicationWindow)
      }

      // 处理队列中的下一个请求
      this.processQueue()
    }
  }

  /**
   * 处理队列
   * @description 从队列中取出请求并执行
   */
  private processQueue(): void {
    // 如果已达到并发上限，不处理
    if (this.currentConcurrency >= this.maxConcurrency) {
      return
    }

    // 优先处理高优先级队列
    let requestItem: RequestItem | undefined

    if (this.highPriorityQueue.length > 0) {
      requestItem = this.highPriorityQueue.shift()
    } else if (this.normalPriorityQueue.length > 0) {
      requestItem = this.normalPriorityQueue.shift()
    }

    if (requestItem) {
      this.processRequest(requestItem.requestFn).then(requestItem.resolve).catch(requestItem.reject)
    }
  }

  /**
   * 清空队列
   * @description 清空所有待处理的请求队列
   */
  clear(): void {
    // 拒绝所有队列中的请求
    const rejectAll = (queue: RequestItem[]) => {
      queue.forEach((item) => {
        item.reject(new Error('Request queue cleared'))
      })
      queue.length = 0
    }

    rejectAll(this.highPriorityQueue)
    rejectAll(this.normalPriorityQueue)
    this.pendingRequests.clear()
  }

  /**
   * 获取队列统计信息
   * @returns 统计信息
   */
  getStats() {
    return {
      ...this.stats,
      currentConcurrency: this.currentConcurrency,
      maxConcurrency: this.maxConcurrency,
      queueSize: this.highPriorityQueue.length + this.normalPriorityQueue.length,
      highPriorityQueueSize: this.highPriorityQueue.length,
      normalPriorityQueueSize: this.normalPriorityQueue.length,
    }
  }

  /**
   * 获取当前并发数
   * @returns 当前并发数
   */
  getCurrentConcurrency(): number {
    return this.currentConcurrency
  }

  /**
   * 获取队列大小
   * @returns 队列大小
   */
  getQueueSize(): number {
    return this.highPriorityQueue.length + this.normalPriorityQueue.length
  }
}

/**
 * 默认请求队列管理器实例
 */
export const defaultRequestQueue = new RequestQueue()
