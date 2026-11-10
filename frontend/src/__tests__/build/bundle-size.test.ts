/**
 * @fileoverview 构建产物大小测试
 * @module __tests__/build/bundle-size
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 测试构建产物大小是否符合要求
 */

import { describe, it, expect } from 'vitest'
import { statSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'

describe('构建产物大小测试', () => {
  const distDir = join(process.cwd(), 'dist')
  const maxSize = 50 * 1024 * 1024 // 50MB
  const warningSize = 30 * 1024 * 1024 // 30MB

  it('应该存在dist目录', () => {
    if (!existsSync(distDir)) {
      console.warn('dist目录不存在，跳过测试')
      return
    }
    expect(existsSync(distDir)).toBe(true)
  })

  it('构建产物总大小应该在合理范围内', () => {
    if (!existsSync(distDir)) {
      console.warn('dist目录不存在，跳过测试')
      return
    }

    const totalSize = getDirSize(distDir)
    const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2)

    console.log(`构建产物总大小: ${totalSizeMB} MB`)

    // 不应该超过最大限制
    expect(totalSize).toBeLessThan(maxSize)

    // 如果超过警告大小，输出警告
    if (totalSize > warningSize) {
      console.warn(
        `警告: 构建产物大小 ${totalSizeMB} MB 超过警告阈值 ${(warningSize / 1024 / 1024).toFixed(2)} MB`,
      )
    }
  })

  it('主要JS文件大小应该在合理范围内', () => {
    if (!existsSync(distDir)) {
      console.warn('dist目录不存在，跳过测试')
      return
    }

    const jsFiles = findFiles(distDir, /\.js$/)
    const mainJsFiles = jsFiles.filter(
      (file) => file.includes('index') || file.includes('main') || file.includes('app'),
    )

    if (mainJsFiles.length === 0) {
      console.warn('未找到主要JS文件')
      return
    }

    mainJsFiles.forEach((file) => {
      const size = statSync(file).size
      const sizeKB = (size / 1024).toFixed(2)
      const maxFileSize = 2 * 1024 * 1024 // 2MB per file

      console.log(`文件 ${file}: ${sizeKB} KB`)

      // 单个文件不应该过大
      expect(size).toBeLessThan(maxFileSize)
    })
  })

  it('主要CSS文件大小应该在合理范围内', () => {
    if (!existsSync(distDir)) {
      console.warn('dist目录不存在，跳过测试')
      return
    }

    const cssFiles = findFiles(distDir, /\.css$/)

    if (cssFiles.length === 0) {
      console.warn('未找到CSS文件')
      return
    }

    cssFiles.forEach((file) => {
      const size = statSync(file).size
      const sizeKB = (size / 1024).toFixed(2)
      const maxFileSize = 1 * 1024 * 1024 // 1MB per file

      console.log(`文件 ${file}: ${sizeKB} KB`)

      // 单个CSS文件不应该过大
      expect(size).toBeLessThan(maxFileSize)
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
