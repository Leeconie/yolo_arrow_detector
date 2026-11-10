/**
 * @fileoverview 资源懒加载工具
 * @module utils/lazy-load
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 提供图片懒加载指令，使用IntersectionObserver API实现视口检测
 * 性能优化：减少首屏加载时间，按需加载图片资源
 */

import { logger } from '@/core/logger'

/**
 * 懒加载配置选项
 */
export interface LazyLoadOptions {
  /** 占位图URL（可选） */
  placeholder?: string
  /** 错误时显示的图片URL（可选） */
  errorImage?: string
  /** IntersectionObserver的rootMargin（可选，用于提前加载） */
  rootMargin?: string
  /** IntersectionObserver的threshold（可选） */
  threshold?: number | number[]
}

/**
 * 懒加载指令绑定值类型
 */
export type LazyLoadValue = string | { src: string; placeholder?: string; errorImage?: string }

/**
 * 扩展的HTMLImageElement接口（包含自定义属性）
 */
interface ExtendedHTMLImageElement extends HTMLImageElement {
  __lazyLoadObserver?: IntersectionObserver
}

/**
 * 图片懒加载指令
 * @description 使用IntersectionObserver检测图片是否进入视口，进入后才加载图片
 * @example
 * ```vue
 * <template>
 *   <img v-lazy="imageUrl" alt="description" />
 *   <img v-lazy="{ src: imageUrl, placeholder: placeholderUrl }" alt="description" />
 * </template>
 * ```
 */
export const lazyLoadDirective = {
  /**
   * 指令挂载时
   * @param el 图片元素
   * @param binding 绑定值
   */
  mounted(el: HTMLImageElement, binding: { value: LazyLoadValue; arg?: string }) {
    // 获取图片URL
    const imageUrl = typeof binding.value === 'string' ? binding.value : binding.value.src
    const placeholder = typeof binding.value === 'object' ? binding.value.placeholder : undefined
    const errorImage = typeof binding.value === 'object' ? binding.value.errorImage : undefined

    if (!imageUrl) {
      return
    }

    // 设置占位图（如果有）
    if (placeholder) {
      el.src = placeholder
    } else {
      // 使用data-src存储真实图片URL
      el.setAttribute('data-src', imageUrl)
      // 设置透明占位图或保持空白
      el.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"%3E%3C/svg%3E'
    }

    // 创建IntersectionObserver
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // 元素进入视口，加载图片
            const img = entry.target as HTMLImageElement
            const src = img.getAttribute('data-src') || imageUrl

            logger.debug('图片进入视口，开始加载', {
              context: {
                module: 'utils',
                function: 'lazyLoad.mounted',
              },
              data: {
                src,
              },
            })

            // 创建新的Image对象预加载
            const image = new Image()
            image.onload = () => {
              img.src = src
              img.removeAttribute('data-src')
              logger.debug('图片懒加载成功', {
                context: {
                  module: 'utils',
                  function: 'lazyLoad.mounted',
                },
                data: {
                  src,
                },
              })
            }
            image.onerror = () => {
              // 加载失败，使用错误图片或保持占位图
              logger.warn('图片懒加载失败', {
                context: {
                  module: 'utils',
                  function: 'lazyLoad.mounted',
                },
                data: {
                  src,
                  hasErrorImage: !!errorImage,
                },
              })
              if (errorImage) {
                img.src = errorImage
              }
              img.removeAttribute('data-src')
            }
            image.src = src

            // 停止观察
            observer.unobserve(img)
          }
        })
      },
      {
        rootMargin: '50px', // 提前50px开始加载
        threshold: 0.01, // 当1%的元素可见时触发
      },
    )

    // 开始观察元素
    observer.observe(el)

    // 将observer存储到元素上，以便卸载时清理
    ;(el as ExtendedHTMLImageElement).__lazyLoadObserver = observer
  },

  /**
   * 指令卸载时
   * @param el 图片元素
   */
  unmounted(el: HTMLImageElement) {
    // 清理IntersectionObserver
    const extendedEl = el as ExtendedHTMLImageElement
    const observer = extendedEl.__lazyLoadObserver
    if (observer) {
      observer.disconnect()
      delete extendedEl.__lazyLoadObserver
    }
  },

  /**
   * 指令更新时
   * @param el 图片元素
   * @param binding 绑定值
   */
  updated(el: HTMLImageElement, binding: { value: LazyLoadValue }) {
    // 如果图片URL变化，重新加载
    const newImageUrl = typeof binding.value === 'string' ? binding.value : binding.value.src
    const currentSrc = el.getAttribute('data-src') || el.src

    if (newImageUrl && newImageUrl !== currentSrc) {
      // 清理旧的observer
      const extendedEl = el as ExtendedHTMLImageElement
      const observer = extendedEl.__lazyLoadObserver
      if (observer) {
        observer.disconnect()
        delete extendedEl.__lazyLoadObserver
      }

      // 重新挂载
      lazyLoadDirective.mounted(el, binding)
    }
  },
}
