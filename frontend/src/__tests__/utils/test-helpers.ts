/**
 * @fileoverview 测试辅助函数
 * @module test-helpers
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 提供测试相关的辅助函数
 */

import fs from 'fs'
import path from 'path'

/**
 * 创建测试文件
 * @param filename 文件名
 * @param size 文件大小（字节）
 * @returns 文件路径
 */
export function createTestFile(filename: string, size: number): string {
  const tempDir = '/tmp'
  const filePath = path.join(tempDir, filename)
  const content = Buffer.alloc(size, 'a')
  fs.writeFileSync(filePath, content)
  return filePath
}

/**
 * 清理测试文件
 * @param filePath 文件路径
 */
export function cleanupTestFile(filePath: string): void {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}
