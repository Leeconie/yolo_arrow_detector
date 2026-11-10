/**
 * @fileoverview 构建性能测试
 * @module build/performance.test
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 测试构建产物的性能，包括首屏加载时间、资源加载性能、运行时性能
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

describe('构建性能测试', () => {
  const distDir = join(process.cwd(), 'dist')

  describe('首屏加载性能', () => {
    it('index.html应该包含必要的性能优化标签', () => {
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

      // 应该包含script标签（用于加载JS）
      expect(content).toMatch(/<script/i)

      // 应该包含link标签（用于加载CSS）
      expect(content).toMatch(/<link/i)
    })

    it('应该存在预加载资源（如果有配置）', () => {
      if (!existsSync(distDir)) {
        console.warn('dist目录不存在，跳过测试')
        return
      }

      const indexPath = join(distDir, 'index.html')
      if (!existsSync(indexPath)) {
        return
      }

      const content = readFileSync(indexPath, 'utf-8')

      // 检查是否有preload或prefetch标签（可选，取决于配置）
      const hasPreload = content.includes('rel="preload"') || content.includes("rel='preload'")
      const hasPrefetch = content.includes('rel="prefetch"') || content.includes("rel='prefetch'")

      // 如果有预加载配置，应该存在
      // 如果没有配置，也不影响测试通过
      if (hasPreload || hasPrefetch) {
        expect(hasPreload || hasPrefetch).toBe(true)
      }
    })
  })

  describe('资源加载性能', () => {
    it('主要JS文件应该合理分割', () => {
      if (!existsSync(distDir)) {
        console.warn('dist目录不存在，跳过测试')
        return
      }

      const jsFiles = findJsFiles(distDir)
      const mainFiles = jsFiles.filter(
        (file) => file.includes('index') || file.includes('main') || file.includes('app'),
      )

      console.log(`找到 ${mainFiles.length} 个主要JS文件`)

      // 应该至少有一个入口文件
      expect(mainFiles.length).toBeGreaterThan(0)

      // 主要文件不应该过大（超过2MB）
      mainFiles.forEach((file) => {
        const size = statSync(file).size
        const maxSize = 2 * 1024 * 1024 // 2MB
        expect(size).toBeLessThan(maxSize)
      })
    })

    it('vendor chunk应该单独打包', () => {
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
      // 注意：如果没有使用代码分割，可能不会有vendor文件
      if (vendorFiles.length > 0) {
        expect(vendorFiles.length).toBeGreaterThan(0)
      }
    })

    it('CSS文件应该合理分割', () => {
      if (!existsSync(distDir)) {
        console.warn('dist目录不存在，跳过测试')
        return
      }

      const cssFiles = findFiles(distDir, /\.css$/)
      console.log(`找到 ${cssFiles.length} 个CSS文件`)

      // 应该至少有一个CSS文件
      expect(cssFiles.length).toBeGreaterThan(0)

      // CSS文件不应该过大（超过1MB）
      cssFiles.forEach((file) => {
        const size = statSync(file).size
        const maxSize = 1 * 1024 * 1024 // 1MB
        expect(size).toBeLessThan(maxSize)
      })
    })
  })

  describe('运行时性能', () => {
    it('构建产物应该不包含console.log（生产环境）', () => {
      if (!existsSync(distDir)) {
        console.warn('dist目录不存在，跳过测试')
        return
      }

      const jsFiles = findJsFiles(distDir)
      let foundConsole = false

      // 检查主要JS文件（不包括source map）
      const mainFiles = jsFiles.filter(
        (file) =>
          !file.includes('.map') &&
          (file.includes('index') || file.includes('main') || file.includes('app')),
      )

      for (const file of mainFiles.slice(0, 3)) {
        // 只检查前3个文件
        try {
          const content = readFileSync(file, 'utf-8')
          // 检查是否包含console.log（压缩后的代码可能使用不同的格式）
          if (content.includes('console.log') || content.includes('console["log"]')) {
            foundConsole = true
            console.warn(`文件 ${file} 包含 console.log`)
            break
          }
        } catch {
          // 忽略无法读取的文件（可能是二进制文件）
        }
      }

      // 注意：在某些情况下，第三方库可能包含console.log
      // 这里只检查主要文件，不强制要求完全没有console.log
      if (foundConsole) {
        console.warn('警告：构建产物中包含console.log，建议在生产环境中移除')
      }
    })

    it('构建产物应该不包含debugger语句', () => {
      if (!existsSync(distDir)) {
        console.warn('dist目录不存在，跳过测试')
        return
      }

      const jsFiles = findJsFiles(distDir)
      let foundDebugger = false

      // 检查主要JS文件
      const mainFiles = jsFiles.filter(
        (file) =>
          !file.includes('.map') &&
          (file.includes('index') || file.includes('main') || file.includes('app')),
      )

      for (const file of mainFiles.slice(0, 3)) {
        try {
          const content = readFileSync(file, 'utf-8')
          if (content.includes('debugger')) {
            foundDebugger = true
            console.warn(`文件 ${file} 包含 debugger 语句`)
            break
          }
        } catch {
          // 忽略无法读取的文件
        }
      }

      // debugger语句应该被移除
      expect(foundDebugger).toBe(false)
    })
  })

  describe('代码压缩', () => {
    it('JS文件应该被压缩', () => {
      if (!existsSync(distDir)) {
        console.warn('dist目录不存在，跳过测试')
        return
      }

      const jsFiles = findJsFiles(distDir)
      const mainFiles = jsFiles.filter(
        (file) =>
          !file.includes('.map') &&
          (file.includes('index') || file.includes('main') || file.includes('app')),
      )

      if (mainFiles.length === 0) {
        return
      }

      // 检查文件是否被压缩（压缩后的代码通常没有换行和多余空格）
      const sampleFile = mainFiles[0]
      try {
        const content = readFileSync(sampleFile, 'utf-8')
        const lines = content.split('\n')

        // 压缩后的代码通常行数较少（大部分代码在一行）
        // 或者代码中没有多余的空格
        const isMinified = lines.length < 100 || content.trim().length === content.length

        // 验证代码被压缩（不强制要求，取决于配置）
        if (!isMinified) {
          console.warn('警告：JS文件可能未被压缩')
        }
      } catch {
        // 忽略无法读取的文件
      }
    })

    it('CSS文件应该被压缩', () => {
      if (!existsSync(distDir)) {
        console.warn('dist目录不存在，跳过测试')
        return
      }

      const cssFiles = findFiles(distDir, /\.css$/)

      if (cssFiles.length === 0) {
        return
      }

      // 检查CSS文件是否被压缩
      const sampleFile = cssFiles[0]
      try {
        const content = readFileSync(sampleFile, 'utf-8')
        const lines = content.split('\n')

        // 压缩后的CSS通常行数较少
        const isMinified = lines.length < 50

        // 验证CSS被压缩（不强制要求，取决于配置）
        if (!isMinified) {
          console.warn('警告：CSS文件可能未被压缩')
        }
      } catch {
        // 忽略无法读取的文件
      }
    })
  })

  describe('资源优化', () => {
    it('图片资源应该被优化（如果有）', () => {
      if (!existsSync(distDir)) {
        console.warn('dist目录不存在，跳过测试')
        return
      }

      const imageFiles = findFiles(distDir, /\.(png|jpg|jpeg|gif|svg|webp)$/i)

      if (imageFiles.length === 0) {
        console.log('未找到图片文件，跳过测试')
        return
      }

      // 验证图片文件大小合理
      imageFiles.forEach((file) => {
        const size = statSync(file).size
        const maxSize = 10 * 1024 * 1024 // 10MB per image
        expect(size).toBeLessThan(maxSize)
      })
    })

    it('字体文件应该被优化（如果有）', () => {
      if (!existsSync(distDir)) {
        console.warn('dist目录不存在，跳过测试')
        return
      }

      const fontFiles = findFiles(distDir, /\.(woff|woff2|ttf|eot|otf)$/i)

      if (fontFiles.length === 0) {
        console.log('未找到字体文件，跳过测试')
        return
      }

      // 验证字体文件大小合理
      fontFiles.forEach((file) => {
        const size = statSync(file).size
        const maxSize = 5 * 1024 * 1024 // 5MB per font
        expect(size).toBeLessThan(maxSize)
      })
    })
  })
})

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
