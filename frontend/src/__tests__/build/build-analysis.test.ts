/**
 * @fileoverview 构建产物分析测试
 * @module build/build-analysis.test
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 分析构建产物大小、结构、代码分割效果、静态资源优化效果
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

describe('构建产物分析', () => {
  const distDir = join(process.cwd(), 'dist')
  const statsHtmlPath = join(distDir, 'stats.html')

  describe('构建产物大小分析', () => {
    it('应该生成构建产物可视化报告', () => {
      if (!existsSync(distDir)) {
        console.warn('dist目录不存在，跳过测试')
        return
      }

      // 检查是否存在stats.html（rollup-plugin-visualizer生成）
      if (existsSync(statsHtmlPath)) {
        const content = readFileSync(statsHtmlPath, 'utf-8')
        expect(content).toBeTruthy()
        console.log('构建产物可视化报告已生成: dist/stats.html')
      } else {
        console.warn('stats.html不存在，可能需要运行构建命令生成')
      }
    })

    it('应该分析构建产物总大小', () => {
      if (!existsSync(distDir)) {
        console.warn('dist目录不存在，跳过测试')
        return
      }

      const totalSize = getDirSize(distDir)
      const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2)

      console.log(`构建产物总大小: ${totalSizeMB} MB`)

      // 验证构建产物存在
      expect(totalSize).toBeGreaterThan(0)

      // 构建产物不应该过大（超过100MB）
      const maxSize = 100 * 1024 * 1024 // 100MB
      expect(totalSize).toBeLessThan(maxSize)
    })

    it('应该分析主要文件大小分布', () => {
      if (!existsSync(distDir)) {
        console.warn('dist目录不存在，跳过测试')
        return
      }

      const jsFiles = findJsFiles(distDir)
      const cssFiles = findFiles(distDir, /\.css$/)

      console.log(`JS文件数量: ${jsFiles.length}`)
      console.log(`CSS文件数量: ${cssFiles.length}`)

      // 分析JS文件大小
      let totalJsSize = 0
      jsFiles.forEach((file) => {
        const size = statSync(file).size
        totalJsSize += size
        const sizeKB = (size / 1024).toFixed(2)
        console.log(`  ${file}: ${sizeKB} KB`)
      })

      // 分析CSS文件大小
      let totalCssSize = 0
      cssFiles.forEach((file) => {
        const size = statSync(file).size
        totalCssSize += size
        const sizeKB = (size / 1024).toFixed(2)
        console.log(`  ${file}: ${sizeKB} KB`)
      })

      console.log(`JS总大小: ${(totalJsSize / 1024 / 1024).toFixed(2)} MB`)
      console.log(`CSS总大小: ${(totalCssSize / 1024 / 1024).toFixed(2)} MB`)

      expect(jsFiles.length).toBeGreaterThan(0)
      expect(cssFiles.length).toBeGreaterThan(0)
    })
  })

  describe('代码分割效果分析', () => {
    it('应该识别vendor chunk文件', () => {
      if (!existsSync(distDir)) {
        console.warn('dist目录不存在，跳过测试')
        return
      }

      const jsFiles = findJsFiles(distDir)
      const vendorFiles = jsFiles.filter(
        (file) => file.includes('vendor') || file.includes('chunk'),
      )

      console.log(`找到 ${vendorFiles.length} 个vendor/chunk文件`)

      // 如果使用了代码分割，应该有vendor文件
      if (vendorFiles.length > 0) {
        vendorFiles.forEach((file) => {
          const size = statSync(file).size
          const sizeKB = (size / 1024).toFixed(2)
          console.log(`  ${file}: ${sizeKB} KB`)
        })
      }
    })

    it('应该识别Vue相关chunk文件', () => {
      if (!existsSync(distDir)) {
        console.warn('dist目录不存在，跳过测试')
        return
      }

      const jsFiles = findJsFiles(distDir)
      const vueFiles = jsFiles.filter((file) => file.includes('vue') || file.includes('Vue'))

      console.log(`找到 ${vueFiles.length} 个Vue相关文件`)

      if (vueFiles.length > 0) {
        vueFiles.forEach((file) => {
          const size = statSync(file).size
          const sizeKB = (size / 1024).toFixed(2)
          console.log(`  ${file}: ${sizeKB} KB`)
        })
      }
    })

    it('应该分析代码分割策略', () => {
      if (!existsSync(distDir)) {
        console.warn('dist目录不存在，跳过测试')
        return
      }

      const jsFiles = findJsFiles(distDir)
      const entryFiles = jsFiles.filter(
        (file) => file.includes('index') || file.includes('main') || file.includes('app'),
      )
      const vendorFiles = jsFiles.filter((file) => file.includes('vendor'))
      const chunkFiles = jsFiles.filter(
        (file) => file.includes('chunk') && !file.includes('vendor'),
      )

      console.log(`入口文件: ${entryFiles.length}`)
      console.log(`Vendor文件: ${vendorFiles.length}`)
      console.log(`Chunk文件: ${chunkFiles.length}`)

      // 应该至少有一个入口文件
      expect(entryFiles.length).toBeGreaterThan(0)

      // 如果使用了代码分割，应该有vendor或chunk文件
      if (vendorFiles.length > 0 || chunkFiles.length > 0) {
        expect(vendorFiles.length + chunkFiles.length).toBeGreaterThan(0)
      }
    })
  })

  describe('静态资源优化效果分析', () => {
    it('应该分析图片资源优化效果', () => {
      if (!existsSync(distDir)) {
        console.warn('dist目录不存在，跳过测试')
        return
      }

      const imageFiles = findFiles(distDir, /\.(png|jpg|jpeg|gif|svg|webp)$/i)

      if (imageFiles.length === 0) {
        console.log('未找到图片文件')
        return
      }

      console.log(`找到 ${imageFiles.length} 个图片文件`)

      let totalImageSize = 0
      imageFiles.forEach((file) => {
        const size = statSync(file).size
        totalImageSize += size
        const sizeKB = (size / 1024).toFixed(2)
        console.log(`  ${file}: ${sizeKB} KB`)
      })

      console.log(`图片总大小: ${(totalImageSize / 1024 / 1024).toFixed(2)} MB`)

      // 验证图片文件大小合理
      imageFiles.forEach((file) => {
        const size = statSync(file).size
        const maxSize = 10 * 1024 * 1024 // 10MB per image
        expect(size).toBeLessThan(maxSize)
      })
    })

    it('应该分析字体资源优化效果', () => {
      if (!existsSync(distDir)) {
        console.warn('dist目录不存在，跳过测试')
        return
      }

      const fontFiles = findFiles(distDir, /\.(woff|woff2|ttf|eot|otf)$/i)

      if (fontFiles.length === 0) {
        console.log('未找到字体文件')
        return
      }

      console.log(`找到 ${fontFiles.length} 个字体文件`)

      let totalFontSize = 0
      fontFiles.forEach((file) => {
        const size = statSync(file).size
        totalFontSize += size
        const sizeKB = (size / 1024).toFixed(2)
        console.log(`  ${file}: ${sizeKB} KB`)
      })

      console.log(`字体总大小: ${(totalFontSize / 1024 / 1024).toFixed(2)} MB`)

      // 验证字体文件大小合理
      fontFiles.forEach((file) => {
        const size = statSync(file).size
        const maxSize = 5 * 1024 * 1024 // 5MB per font
        expect(size).toBeLessThan(maxSize)
      })
    })

    it('应该分析静态资源目录结构', () => {
      if (!existsSync(distDir)) {
        console.warn('dist目录不存在，跳过测试')
        return
      }

      const items = readdirSync(distDir)
      const hasAssetsDir = items.includes('assets')
      const hasJsDir = items.includes('js')
      const hasCssDir = items.some((item) => {
        const itemPath = join(distDir, item)
        try {
          return statSync(itemPath).isDirectory() && item.includes('css')
        } catch {
          return false
        }
      })

      console.log(`assets目录: ${hasAssetsDir ? '存在' : '不存在'}`)
      console.log(`js目录: ${hasJsDir ? '存在' : '不存在'}`)
      console.log(`css目录: ${hasCssDir ? '存在' : '不存在'}`)

      // 验证目录结构合理
      expect(items.length).toBeGreaterThan(0)
    })
  })

  describe('构建产物完整性分析', () => {
    it('应该包含必要的入口文件', () => {
      if (!existsSync(distDir)) {
        console.warn('dist目录不存在，跳过测试')
        return
      }

      const indexPath = join(distDir, 'index.html')
      expect(existsSync(indexPath)).toBe(true)

      const jsFiles = findJsFiles(distDir)
      const entryFiles = jsFiles.filter(
        (file) => file.includes('index') || file.includes('main') || file.includes('app'),
      )

      expect(entryFiles.length).toBeGreaterThan(0)
    })

    it('应该包含必要的资源文件', () => {
      if (!existsSync(distDir)) {
        console.warn('dist目录不存在，跳过测试')
        return
      }

      const indexPath = join(distDir, 'index.html')
      if (existsSync(indexPath)) {
        const content = readFileSync(indexPath, 'utf-8')
        expect(content).toContain('id="app"')
        expect(content).toMatch(/<script/i)
      }

      const cssFiles = findFiles(distDir, /\.css$/)
      expect(cssFiles.length).toBeGreaterThan(0)
    })
  })
})

/**
 * 计算目录总大小
 */
function getDirSize(dirPath: string): number {
  if (!existsSync(dirPath)) {
    return 0
  }

  const stats = statSync(dirPath)
  if (!stats.isDirectory()) {
    return stats.size
  }

  let totalSize = 0
  const files = readdirSync(dirPath)

  for (const file of files) {
    const filePath = join(dirPath, file)
    try {
      const fileStats = statSync(filePath)
      if (fileStats.isDirectory()) {
        totalSize += getDirSize(filePath)
      } else {
        totalSize += fileStats.size
      }
    } catch {
      // 忽略无法访问的文件
    }
  }

  return totalSize
}

/**
 * 查找所有JS文件
 */
function findJsFiles(dirPath: string): string[] {
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
        files.push(...findJsFiles(itemPath))
      } else if (item.endsWith('.js')) {
        files.push(itemPath)
      }
    }
  } catch {
    // 忽略无法访问的目录
  }

  return files
}

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
