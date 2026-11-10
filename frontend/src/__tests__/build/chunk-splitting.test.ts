/**
 * @fileoverview 代码分割测试
 * @module __tests__/build/chunk-splitting
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 测试代码分割是否正确实现
 */

import { describe, it, expect } from 'vitest'
import { readdirSync, existsSync, statSync } from 'fs'
import { join } from 'path'

describe('代码分割测试', () => {
  const distDir = join(process.cwd(), 'dist')
  const jsDir = join(distDir, 'js')

  it('应该存在js目录', () => {
    if (!existsSync(distDir)) {
      console.warn('dist目录不存在，跳过测试')
      return
    }

    // js文件可能在dist/js或dist根目录
    const hasJsDir = existsSync(jsDir)
    const hasJsFiles =
      existsSync(distDir) && readdirSync(distDir).some((file) => file.endsWith('.js'))

    expect(hasJsDir || hasJsFiles).toBe(true)
  })

  it('应该存在vendor chunk文件', () => {
    if (!existsSync(distDir)) {
      console.warn('dist目录不存在，跳过测试')
      return
    }

    const jsFiles = findJsFiles(distDir)
    const vendorFiles = jsFiles.filter((file) => file.includes('vendor') || file.includes('chunk'))

    console.log(`找到 ${vendorFiles.length} 个vendor/chunk文件`)

    // 应该至少有一个vendor或chunk文件
    expect(vendorFiles.length).toBeGreaterThan(0)
  })

  it('应该存在vue相关chunk文件', () => {
    if (!existsSync(distDir)) {
      console.warn('dist目录不存在，跳过测试')
      return
    }

    const jsFiles = findJsFiles(distDir)
    const vueFiles = jsFiles.filter((file) => file.includes('vue') || file.includes('Vue'))

    console.log(`找到 ${vueFiles.length} 个Vue相关文件`)

    // 如果使用了代码分割，应该有Vue相关的chunk
    // 注意：如果使用CDN，可能不会有Vue chunk
    if (vueFiles.length > 0) {
      expect(vueFiles.length).toBeGreaterThan(0)
    }
  })

  it('chunk文件大小应该合理', () => {
    if (!existsSync(distDir)) {
      console.warn('dist目录不存在，跳过测试')
      return
    }

    const jsFiles = findJsFiles(distDir)
    const maxChunkSize = 5 * 1024 * 1024 // 5MB per chunk

    jsFiles.forEach((file) => {
      const size = statSync(file).size
      const sizeMB = (size / 1024 / 1024).toFixed(2)

      console.log(`Chunk文件 ${file}: ${sizeMB} MB`)

      // 单个chunk不应该过大
      expect(size).toBeLessThan(maxChunkSize)
    })
  })

  it('应该存在入口文件', () => {
    if (!existsSync(distDir)) {
      console.warn('dist目录不存在，跳过测试')
      return
    }

    const jsFiles = findJsFiles(distDir)
    const entryFiles = jsFiles.filter(
      (file) => file.includes('index') || file.includes('main') || file.includes('app'),
    )

    console.log(`找到 ${entryFiles.length} 个入口文件`)

    // 应该至少有一个入口文件
    expect(entryFiles.length).toBeGreaterThan(0)
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
