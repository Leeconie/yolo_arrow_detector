/**
 * @fileoverview Web Vitals性能监控模块
 * @module core/performance/web-vitals
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 收集和报告Web Vitals性能指标（FCP、LCP、TTI、CLS等）
 */

import { logger } from '@/core/logger'

/**
 * Web Vitals性能指标接口
 */
export interface WebVitalsMetrics {
  /** First Contentful Paint - 首次内容绘制 */
  fcp?: number
  /** Largest Contentful Paint - 最大内容绘制 */
  lcp?: number
  /** Time to Interactive - 可交互时间 */
  tti?: number
  /** Cumulative Layout Shift - 累积布局偏移 */
  cls?: number
  /** First Input Delay - 首次输入延迟 */
  fid?: number
  /** Total Blocking Time - 总阻塞时间 */
  tbt?: number
  /** Speed Index - 速度指数 */
  si?: number
}

/**
 * 性能指标阈值（毫秒或分数）
 */
export const PERFORMANCE_THRESHOLDS = {
  /** FCP阈值：良好 < 1.8s，需要改进 1.8s - 3.0s，差 > 3.0s */
  FCP_GOOD: 1800,
  FCP_NEEDS_IMPROVEMENT: 3000,
  /** LCP阈值：良好 < 2.5s，需要改进 2.5s - 4.0s，差 > 4.0s */
  LCP_GOOD: 2500,
  LCP_NEEDS_IMPROVEMENT: 4000,
  /** TTI阈值：良好 < 3.8s，需要改进 3.8s - 7.3s，差 > 7.3s */
  TTI_GOOD: 3800,
  TTI_NEEDS_IMPROVEMENT: 7300,
  /** CLS阈值：良好 < 0.1，需要改进 0.1 - 0.25，差 > 0.25 */
  CLS_GOOD: 0.1,
  CLS_NEEDS_IMPROVEMENT: 0.25,
  /** FID阈值：良好 < 100ms，需要改进 100ms - 300ms，差 > 300ms */
  FID_GOOD: 100,
  FID_NEEDS_IMPROVEMENT: 300,
  /** TBT阈值：良好 < 200ms，需要改进 200ms - 600ms，差 > 600ms */
  TBT_GOOD: 200,
  TBT_NEEDS_IMPROVEMENT: 600,
} as const

/**
 * 性能评级
 */
export type PerformanceRating = 'good' | 'needs-improvement' | 'poor'

/**
 * Web Vitals监控器类
 */
export class WebVitalsMonitor {
  private metrics: WebVitalsMetrics = {}
  private observers: PerformanceObserver[] = []
  private enabled: boolean = true
  private reportFn?: (metrics: WebVitalsMetrics) => void | Promise<void>

  constructor(
    config: {
      enabled?: boolean
      reportFn?: (metrics: WebVitalsMetrics) => void | Promise<void>
    } = {},
  ) {
    this.enabled = config.enabled ?? true
    this.reportFn = config.reportFn
  }

  /**
   * 初始化Web Vitals监控
   */
  init(): void {
    if (!this.enabled || typeof window === 'undefined') return

    try {
      this.observeFCP()
      this.observeLCP()
      this.observeCLS()
      this.observeFID()
      this.calculateTTI()
      this.calculateTBT()
      this.calculateSI()

      logger.debug('Web Vitals监控已初始化', {
        context: {
          module: 'performance',
          function: 'WebVitalsMonitor.init',
        },
      })
    } catch (error) {
      logger.error('Web Vitals监控初始化失败', {
        context: {
          module: 'performance',
          function: 'WebVitalsMonitor.init',
        },
        error: error instanceof Error ? error : new Error(String(error)),
      })
    }
  }

  /**
   * 观察First Contentful Paint (FCP)
   */
  private observeFCP(): void {
    if (!('PerformanceObserver' in window)) return

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.fcp = Math.round(entry.startTime)
            this.reportMetric('fcp', this.metrics.fcp)
          }
        }
      })

      observer.observe({ entryTypes: ['paint'] })
      this.observers.push(observer)
    } catch (error) {
      logger.warn('FCP监控初始化失败', {
        context: {
          module: 'performance',
          function: 'WebVitalsMonitor.observeFCP',
        },
        error: error instanceof Error ? error : new Error(String(error)),
      })
    }
  }

  /**
   * 观察Largest Contentful Paint (LCP)
   */
  private observeLCP(): void {
    if (!('PerformanceObserver' in window)) return

    try {
      let lcpValue = 0
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
          renderTime?: number
          loadTime?: number
        }

        // LCP是最后一个largest-contentful-paint条目
        lcpValue = lastEntry.renderTime || lastEntry.loadTime || lastEntry.startTime
        this.metrics.lcp = Math.round(lcpValue)
      })

      observer.observe({ entryTypes: ['largest-contentful-paint'] })
      this.observers.push(observer)

      // 当页面卸载时报告最终的LCP值
      window.addEventListener('beforeunload', () => {
        if (lcpValue > 0) {
          this.reportMetric('lcp', this.metrics.lcp!)
        }
      })
    } catch (error) {
      logger.warn('LCP监控初始化失败', {
        context: {
          module: 'performance',
          function: 'WebVitalsMonitor.observeLCP',
        },
        error: error instanceof Error ? error : new Error(String(error)),
      })
    }
  }

  /**
   * 观察Cumulative Layout Shift (CLS)
   */
  private observeCLS(): void {
    if (!('PerformanceObserver' in window)) return

    try {
      let clsValue = 0
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // 只计算没有recent-user-input的布局偏移
          // LayoutShift 条目的特殊属性
          const layoutShiftEntry = entry as PerformanceEntry & {
            hadRecentInput?: boolean
            value: number
          }
          if (!layoutShiftEntry.hadRecentInput) {
            clsValue += layoutShiftEntry.value
          }
        }
        this.metrics.cls = Math.round(clsValue * 1000) / 1000 // 保留3位小数
      })

      observer.observe({ entryTypes: ['layout-shift'] })
      this.observers.push(observer)

      // 当页面卸载时报告最终的CLS值
      window.addEventListener('beforeunload', () => {
        if (clsValue > 0) {
          this.reportMetric('cls', this.metrics.cls!)
        }
      })
    } catch (error) {
      logger.warn('CLS监控初始化失败', {
        context: {
          module: 'performance',
          function: 'WebVitalsMonitor.observeCLS',
        },
        error: error instanceof Error ? error : new Error(String(error)),
      })
    }
  }

  /**
   * 观察First Input Delay (FID)
   */
  private observeFID(): void {
    if (!('PerformanceObserver' in window)) return

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fidEntry = entry as PerformanceEntry & {
            processingStart?: number
            startTime: number
          }
          if (fidEntry.processingStart) {
            this.metrics.fid = Math.round(fidEntry.processingStart - fidEntry.startTime)
            this.reportMetric('fid', this.metrics.fid)
          }
        }
      })

      observer.observe({ entryTypes: ['first-input'] })
      this.observers.push(observer)
    } catch (error) {
      logger.warn('FID监控初始化失败', {
        context: {
          module: 'performance',
          function: 'WebVitalsMonitor.observeFID',
        },
        error: error instanceof Error ? error : new Error(String(error)),
      })
    }
  }

  /**
   * 计算Time to Interactive (TTI)
   * TTI = DOMContentLoaded + 5秒静默窗口
   */
  private calculateTTI(): void {
    if (typeof window === 'undefined') return

    try {
      let ttiCalculated = false
      const domContentLoaded =
        performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart

      // 监听长任务，计算5秒静默窗口
      if ('PerformanceObserver' in window) {
        const longTaskObserver = new PerformanceObserver((list) => {
          if (ttiCalculated) return

          const entries = list.getEntries()
          const lastLongTask = entries[entries.length - 1]
          if (!lastLongTask) return
          const quietWindowStart = lastLongTask.startTime + lastLongTask.duration

          // 检查是否有5秒静默窗口
          setTimeout(() => {
            if (!ttiCalculated && performance.now() - quietWindowStart >= 5000) {
              this.metrics.tti = Math.round(quietWindowStart)
              this.reportMetric('tti', this.metrics.tti)
              ttiCalculated = true
            }
          }, 5000)
        })

        try {
          longTaskObserver.observe({ entryTypes: ['longtask'] })
          this.observers.push(longTaskObserver)
        } catch {
          // 某些浏览器不支持longtask
        }
      }

      // 如果5秒后仍未计算TTI，使用DOMContentLoaded作为近似值
      setTimeout(() => {
        if (!ttiCalculated) {
          this.metrics.tti = Math.round(domContentLoaded + 5000)
          this.reportMetric('tti', this.metrics.tti)
        }
      }, 10000)
    } catch (error) {
      logger.warn('TTI计算失败', {
        context: {
          module: 'performance',
          function: 'WebVitalsMonitor.calculateTTI',
        },
        error: error instanceof Error ? error : new Error(String(error)),
      })
    }
  }

  /**
   * 计算Total Blocking Time (TBT)
   * TBT = 所有长任务（>50ms）的阻塞时间总和
   */
  private calculateTBT(): void {
    if (!('PerformanceObserver' in window)) return

    try {
      let tbtValue = 0
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // 长任务超过50ms的部分计入TBT
          if (entry.duration > 50) {
            tbtValue += entry.duration - 50
          }
        }
        this.metrics.tbt = Math.round(tbtValue)
      })

      observer.observe({ entryTypes: ['longtask'] })
      this.observers.push(observer)

      // 当页面卸载时报告最终的TBT值
      window.addEventListener('beforeunload', () => {
        if (tbtValue > 0) {
          this.reportMetric('tbt', this.metrics.tbt!)
        }
      })
    } catch (error) {
      logger.warn('TBT计算失败', {
        context: {
          module: 'performance',
          function: 'WebVitalsMonitor.calculateTBT',
        },
        error: error instanceof Error ? error : new Error(String(error)),
      })
    }
  }

  /**
   * 计算Speed Index (SI)
   * SI = 页面加载过程中视觉完整性的平均时间
   */
  private calculateSI(): void {
    // Speed Index需要视觉进度计算，这里使用简化版本
    // 实际应用中可以使用更复杂的算法或第三方库
    if (typeof window === 'undefined') return

    try {
      const navigationEntry = performance.getEntriesByType(
        'navigation',
      )[0] as PerformanceNavigationTiming
      if (navigationEntry) {
        // 简化计算：使用DOMContentLoaded作为近似值
        const siValue = navigationEntry.domContentLoadedEventEnd - navigationEntry.fetchStart
        this.metrics.si = Math.round(siValue)
        this.reportMetric('si', this.metrics.si)
      }
    } catch (error) {
      logger.warn('SI计算失败', {
        context: {
          module: 'performance',
          function: 'WebVitalsMonitor.calculateSI',
        },
        error: error instanceof Error ? error : new Error(String(error)),
      })
    }
  }

  /**
   * 报告单个指标
   */
  private reportMetric(name: keyof WebVitalsMetrics, value: number): void {
    const rating = this.getRating(name, value)

    logger.info(`Web Vitals指标: ${name.toUpperCase()}`, {
      context: {
        module: 'performance',
        function: 'WebVitalsMonitor.reportMetric',
      },
      data: {
        metric: name,
        value,
        rating,
        unit: this.getUnit(name),
      },
    })

    // 如果配置了上报函数，调用它
    if (this.reportFn) {
      this.reportFn({ ...this.metrics })
    }
  }

  /**
   * 获取性能评级
   */
  getRating(metric: keyof WebVitalsMetrics, value: number): PerformanceRating {
    const thresholds = PERFORMANCE_THRESHOLDS

    switch (metric) {
      case 'fcp':
        if (value < thresholds.FCP_GOOD) return 'good'
        if (value < thresholds.FCP_NEEDS_IMPROVEMENT) return 'needs-improvement'
        return 'poor'
      case 'lcp':
        if (value < thresholds.LCP_GOOD) return 'good'
        if (value < thresholds.LCP_NEEDS_IMPROVEMENT) return 'needs-improvement'
        return 'poor'
      case 'tti':
        if (value < thresholds.TTI_GOOD) return 'good'
        if (value < thresholds.TTI_NEEDS_IMPROVEMENT) return 'needs-improvement'
        return 'poor'
      case 'cls':
        if (value < thresholds.CLS_GOOD) return 'good'
        if (value < thresholds.CLS_NEEDS_IMPROVEMENT) return 'needs-improvement'
        return 'poor'
      case 'fid':
        if (value < thresholds.FID_GOOD) return 'good'
        if (value < thresholds.FID_NEEDS_IMPROVEMENT) return 'needs-improvement'
        return 'poor'
      case 'tbt':
        if (value < thresholds.TBT_GOOD) return 'good'
        if (value < thresholds.TBT_NEEDS_IMPROVEMENT) return 'needs-improvement'
        return 'poor'
      default:
        return 'good'
    }
  }

  /**
   * 获取指标单位
   */
  private getUnit(metric: keyof WebVitalsMetrics): string {
    switch (metric) {
      case 'fcp':
      case 'lcp':
      case 'tti':
      case 'fid':
      case 'tbt':
      case 'si':
        return 'ms'
      case 'cls':
        return 'score'
      default:
        return ''
    }
  }

  /**
   * 获取所有指标
   */
  getMetrics(): WebVitalsMetrics {
    return { ...this.metrics }
  }

  /**
   * 清除所有指标
   */
  clear(): void {
    this.metrics = {}
  }

  /**
   * 销毁监控器
   */
  destroy(): void {
    this.observers.forEach((observer) => observer.disconnect())
    this.observers = []
  }

  /**
   * 启用监控
   */
  enable(): void {
    this.enabled = true
    this.init()
  }

  /**
   * 禁用监控
   */
  disable(): void {
    this.enabled = false
    this.destroy()
  }
}

/**
 * 默认Web Vitals监控器实例
 */
export const defaultWebVitalsMonitor = new WebVitalsMonitor()
