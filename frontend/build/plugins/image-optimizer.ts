/**
 * @fileoverview Vite图片优化插件
 * @module build/plugins/image-optimizer
 * @author HeZaoCha
 * @date 2026-01-11
 * @description 基于Sharp的安全图片优化Vite插件，替代不安全的imagemin
 * @dependencies sharp, vite
 */

import type { Plugin } from 'vite'
import sharp from 'sharp'
import { extname } from 'node:path'

interface ImageOptimizerOptions {
  /**
   * 是否启用插件
   * @default true
   */
  enabled?: boolean

  /**
   * 包含的文件类型
   * @default ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif']
   */
  include?: string[]

  /**
   * 排除的文件模式
   * @default []
   */
  exclude?: string[]

  /**
   * JPEG质量 (0-100)
   * @default 80
   */
  jpegQuality?: number

  /**
   * PNG质量范围 (0-1)
   * @default [0.6, 0.8]
   */
  pngQuality?: [number, number]

  /**
   * WebP质量 (0-100)
   * @default 80
   */
  webpQuality?: number

  /**
   * 是否将所有图片转换为WebP格式
   * @default false
   */
  convertToWebp?: boolean

  /**
   * 是否将GIF转换为WebP以获得更好的压缩
   * @default true
   */
  convertGifToWebp?: boolean
}

const defaultOptions: Required<ImageOptimizerOptions> = {
  enabled: true,
  include: ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif'],
  exclude: [],
  jpegQuality: 80,
  pngQuality: [0.6, 0.8],
  webpQuality: 80,
  convertToWebp: false,
  convertGifToWebp: true,
}

export function imageOptimizer(options: ImageOptimizerOptions = {}): Plugin {
  const resolvedOptions = { ...defaultOptions, ...options }

  if (!resolvedOptions.enabled) {
    return {
      name: 'vite-plugin-image-optimizer',
    }
  }

  return {
    name: 'vite-plugin-image-optimizer',
    async generateBundle(_options, bundle) {
      const optimizedFiles: { originalSize: number; optimizedSize: number; filePath: string }[] = []
      let totalOriginalSize = 0
      let totalOptimizedSize = 0

      for (const fileName in bundle) {
        const asset = bundle[fileName]
        const ext = extname(fileName).toLowerCase()

        if (
          asset.type === 'asset' &&
          resolvedOptions.include.includes(ext) &&
          !resolvedOptions.exclude.some((pattern) => fileName.includes(pattern))
        ) {
          const originalBuffer = Buffer.from(asset.source as Uint8Array)
          const originalSize = originalBuffer.length
          totalOriginalSize += originalSize

          let optimizedBuffer = originalBuffer
          let targetExt = ext

          try {
            let image = sharp(originalBuffer)

            // Convert GIF to WebP if enabled
            if (ext === '.gif' && resolvedOptions.convertGifToWebp) {
              image = image.webp({ quality: resolvedOptions.webpQuality })
              targetExt = '.webp'
            } else if (resolvedOptions.convertToWebp && ext !== '.webp') {
              image = image.webp({ quality: resolvedOptions.webpQuality })
              targetExt = '.webp'
            } else if (ext === '.png') {
              image = image.png({ quality: resolvedOptions.pngQuality[1] * 100 }) // Sharp uses 0-100 for PNG
            } else if (ext === '.jpg' || ext === '.jpeg') {
              image = image.jpeg({ quality: resolvedOptions.jpegQuality })
            } else if (ext === '.webp') {
              image = image.webp({ quality: resolvedOptions.webpQuality })
            } else if (ext === '.avif') {
              image = image.avif() // No quality option for avif in sharp directly, uses default
            }

            optimizedBuffer = Buffer.from(await image.toBuffer())
            const optimizedSize = optimizedBuffer.length
            totalOptimizedSize += optimizedSize

            if (optimizedSize < originalSize) {
              asset.source = Uint8Array.from(optimizedBuffer)
              // Update file name if extension changed
              if (targetExt !== ext) {
                const newFileName = fileName.replace(ext, targetExt)
                bundle[newFileName] = asset
                delete bundle[fileName]
                optimizedFiles.push({ originalSize, optimizedSize, filePath: newFileName })
              } else {
                optimizedFiles.push({ originalSize, optimizedSize, filePath: fileName })
              }
            } else {
              totalOptimizedSize -= optimizedSize // Revert if no actual optimization
              totalOptimizedSize += originalSize
            }
          } catch (error) {
            console.warn(`[vite-plugin-image-optimizer] Failed to optimize ${fileName}:`, error)
            totalOptimizedSize += originalSize // Add original size if optimization failed
          }
        }
      }

      if (optimizedFiles.length > 0) {
        const savings = totalOriginalSize - totalOptimizedSize
        const savingsPercentage = (savings / totalOriginalSize) * 100
        console.log(
          `🎉 图片优化完成: 优化了 ${optimizedFiles.length} 个文件，节省了 ${(savings / 1024).toFixed(2)} KB (${savingsPercentage.toFixed(2)}%)`,
        )
        optimizedFiles.forEach((file) => {
          console.log(
            `✓ 优化图片: ${file.filePath} (${(file.originalSize / 1024).toFixed(2)} KB → ${(file.optimizedSize / 1024).toFixed(2)} KB, 节省 ${((file.originalSize - file.optimizedSize) / 1024).toFixed(2)} KB)`,
          )
        })
      }
    },
  }
}