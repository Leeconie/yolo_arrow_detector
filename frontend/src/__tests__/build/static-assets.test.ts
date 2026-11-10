/**
 * @fileoverview 静态资源测试
 * @module __tests__/build/static-assets
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 测试静态资源是否正确加载
 */

import { describe, it, expect } from 'vitest'
import { readdirSync, existsSync, statSync, readFileSync } from 'fs'
import { join } from 'path'

describe('静态资源测试', () => {
  const distDir = join(process.cwd(), 'dist')

  it('应该存在index.html文件', () => {
    if (!existsSync(distDir)) {
      console.warn('dist目录不存在，跳过测试')
      return
    }

    const indexPath = join(distDir, 'index.html')
    expect(existsSync(indexPath)).toBe(true)
  })

  it('index.html应该包含必要的标签', () => {
    if (!existsSync(distDir)) {
      console.warn('dist目录不存在，跳过测试')
      return
    }

    const indexPath = join(distDir, 'index.html')
    if (!existsSync(indexPath)) {
      return
    }

    const content = readFileSync(indexPath, 'utf-8')

    // 应该包含app根元素
    expect(content).toContain('id="app"')

    // 应该包含script标签
    expect(content).toMatch(/<script/i)
  })

  it('应该存在CSS文件', () => {
    if (!existsSync(distDir)) {
      console.warn('dist目录不存在，跳过测试')
      return
    }

    const cssFiles = findFiles(distDir, /\.css$/)
    console.log(`找到 ${cssFiles.length} 个CSS文件`)

    // 应该至少有一个CSS文件
    expect(cssFiles.length).toBeGreaterThan(0)
  })

  it('图片资源应该存在（如果有）', () => {
    if (!existsSync(distDir)) {
      console.warn('dist目录不存在，跳过测试')
      return
    }

    const imageFiles = findFiles(distDir, /\.(png|jpg|jpeg|gif|svg|webp)$/i)
    console.log(`找到 ${imageFiles.length} 个图片文件`)

    // 如果没有图片文件，跳过测试
    if (imageFiles.length === 0) {
      console.log('未找到图片文件，跳过测试')
      return
    }

    // 验证图片文件大小合理
    imageFiles.forEach((file) => {
      const size = statSync(file).size
      const maxImageSize = 10 * 1024 * 1024 // 10MB per image

      expect(size).toBeLessThan(maxImageSize)
    })
  })

  it('字体文件应该存在（如果有）', () => {
    if (!existsSync(distDir)) {
      console.warn('dist目录不存在，跳过测试')
      return
    }

    const fontFiles = findFiles(distDir, /\.(woff|woff2|ttf|eot|otf)$/i)
    console.log(`找到 ${fontFiles.length} 个字体文件`)

    // 如果没有字体文件，跳过测试
    if (fontFiles.length === 0) {
      console.log('未找到字体文件，跳过测试')
      return
    }

    // 验证字体文件大小合理
    fontFiles.forEach((file) => {
      const size = statSync(file).size
      const maxFontSize = 5 * 1024 * 1024 // 5MB per font

      expect(size).toBeLessThan(maxFontSize)
    })
  })

  it('静态资源应该具有合理的文件大小', () => {
    if (!existsSync(distDir)) {
      console.warn('dist目录不存在，跳过测试')
      return
    }

    const assetFiles = findFiles(distDir, /\.(png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|eot|otf)$/i)

    assetFiles.forEach((file) => {
      const size = statSync(file).size
      const sizeKB = (size / 1024).toFixed(2)
      const maxAssetSize = 10 * 1024 * 1024 // 10MB per asset

      console.log(`资源文件 ${file}: ${sizeKB} KB`)

      // 单个资源文件不应该过大
      expect(size).toBeLessThan(maxAssetSize)
    })
  })
})

/**
 * 查找匹配的文件
 */
function findFiles(dirPath: string, pattern: RegExp): string[] {
  const files: string[] = []

  if (!existsSync(dirPath)) {
    return files
  }

  try {
    const items = readdirSync(dirPath)
    for (const item of items) {
      const itemPath = join(dirPath, item)
      const stats = statSync(itemPath)

      if (stats.isDirectory()) {
        files.push(...findFiles(itemPath, pattern))
      } else if (pattern.test(item)) {
        files.push(itemPath)
      }
    }
  } catch {
    // 忽略无法访问的目录
  }

  return files
}
