/**
 * @fileoverview 文件验证工具测试
 * @module __tests__/utils/file-validation
 * @author HeZaoCha
 * @date 2026-01-10
 */

import { describe, it, expect } from 'vitest'
import {
  validateFileName,
  validateFileContent,
  generateSecureFileName,
  sanitizeFileName,
} from '@/utils/file-validation'

describe('文件验证工具', () => {
  describe('validateFileName', () => {
    it('应该接受合法的文件名', () => {
      expect(validateFileName('video.mp4').valid).toBe(true)
      expect(validateFileName('test-video.avi').valid).toBe(true)
      expect(validateFileName('my_video.mov').valid).toBe(true)
    })

    it('应该拒绝包含路径分隔符的文件名', () => {
      expect(validateFileName('../etc/passwd').valid).toBe(false)
      expect(validateFileName('../../file.mp4').valid).toBe(false)
      expect(validateFileName('folder\\file.mp4').valid).toBe(false)
    })

    it('应该拒绝包含特殊字符的文件名', () => {
      expect(validateFileName('file<name>.mp4').valid).toBe(false)
      expect(validateFileName('file:name.mp4').valid).toBe(false)
      expect(validateFileName('file|name.mp4').valid).toBe(false)
    })

    it('应该拒绝过长的文件名', () => {
      const longName = 'a'.repeat(256) + '.mp4'
      expect(validateFileName(longName).valid).toBe(false)
    })

    it('应该拒绝以点开头或结尾的文件名', () => {
      expect(validateFileName('.hidden.mp4').valid).toBe(false)
      expect(validateFileName('file.mp4.').valid).toBe(false)
    })
  })

  describe('validateFileContent', () => {
    it('应该验证MP4文件内容', () => {
      // MP4文件魔数：ftyp box
      const mp4Buffer = Buffer.from([
        0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x70, 0x34, 0x32,
      ])
      expect(validateFileContent(mp4Buffer, 'mp4').valid).toBe(true)
    })

    it('应该验证AVI文件内容', () => {
      // AVI文件魔数：RIFF
      const aviBuffer = Buffer.from([0x52, 0x49, 0x46, 0x46])
      expect(validateFileContent(aviBuffer, 'avi').valid).toBe(true)
    })

    it('应该拒绝不匹配的文件内容', () => {
      const fakeMp4 = Buffer.from([0x00, 0x00, 0x00, 0x00])
      expect(validateFileContent(fakeMp4, 'mp4').valid).toBe(false)
    })
  })

  describe('generateSecureFileName', () => {
    it('应该生成安全的随机文件名', () => {
      const secureName = generateSecureFileName('test.mp4')
      expect(secureName).toMatch(/^\d+_[a-z0-9]+\.mp4$/)
    })

    it('应该使用安全的扩展名', () => {
      const secureName = generateSecureFileName('test.exe')
      expect(secureName).toMatch(/\.bin$/) // 不允许的扩展名应该变成bin
    })
  })

  describe('sanitizeFileName', () => {
    it('应该清理危险字符', () => {
      // ../file.mp4 -> _./file.mp4 (每个/被替换为_)
      const result1 = sanitizeFileName('../file.mp4')
      expect(result1).not.toContain('/')
      expect(result1).not.toContain('\\')
      expect(result1).toContain('file.mp4')

      // file<name>.mp4 -> filename.mp4 (<和>被移除)
      const result2 = sanitizeFileName('file<name>.mp4')
      expect(result2).not.toContain('<')
      expect(result2).not.toContain('>')
      expect(result2).toContain('file')
      expect(result2).toContain('name')
    })

    it('应该处理空文件名', () => {
      expect(sanitizeFileName('')).toBe('unnamed.bin')
      expect(sanitizeFileName('   ')).toBe('unnamed.bin')
    })
  })
})
