/**
 * @fileoverview 文件验证工具
 * @module utils/file-validation
 * @description 提供文件验证功能，包括文件名验证、文件内容验证等安全功能
 * @author HeZaoCha
 * @date 2026-01-10
 * @see {@link https://owasp.org/www-community/vulnerabilities/Path_Traversal OWASP Path Traversal}
 * @see {@link https://owasp.org/www-community/vulnerabilities/Unrestricted_File_Upload OWASP File Upload}
 */

import { logger } from '@/core/logger'

/**
 * 验证文件名，防止路径遍历攻击
 * @param filename 文件名
 * @returns 验证结果，包含valid（是否有效）和message（错误消息，如果无效）
 * @description
 * 验证文件名是否符合安全规范：
 * - 禁止包含路径分隔符（/ 和 \），防止路径遍历攻击
 * - 禁止包含特殊字符（< > : " | ? * 和控制字符），防止命令注入
 * - 限制文件名长度（≤255），防止DoS攻击
 * - 禁止以点开头或结尾，防止隐藏文件
 * @example
 * ```typescript
 * const result = validateFileName('video.mp4')
 * if (result.valid) {
 *   console.log('文件名有效')
 * } else {
 *   console.error(result.message)
 * }
 * ```
 */
export function validateFileName(filename: string): { valid: boolean; message?: string } {
  if (!filename || typeof filename !== 'string') {
    logger.warn('文件名验证失败：文件名为空', {
      context: {
        module: 'utils',
        function: 'validateFileName',
      },
      data: { filename: String(filename) },
    })
    return { valid: false, message: '文件名不能为空' }
  }

  // 禁止包含路径分隔符（防止路径遍历攻击）
  if (filename.includes('/') || filename.includes('\\')) {
    logger.warn('文件名验证失败：包含路径分隔符', {
      context: {
        module: 'utils',
        function: 'validateFileName',
      },
      data: { filename },
    })
    return { valid: false, message: '文件名不能包含路径分隔符' }
  }

  // 禁止包含特殊字符（防止命令注入）
  if (/[<>:"|?*\x00-\x1f]/.test(filename)) {
    logger.warn('文件名验证失败：包含非法字符', {
      context: {
        module: 'utils',
        function: 'validateFileName',
      },
      data: { filename },
    })
    return { valid: false, message: '文件名包含非法字符' }
  }

  // 禁止文件名过长（防止DoS攻击）
  if (filename.length > 255) {
    logger.warn('文件名验证失败：文件名过长', {
      context: {
        module: 'utils',
        function: 'validateFileName',
      },
      data: { filename, length: filename.length },
    })
    return { valid: false, message: '文件名过长' }
  }

  // 禁止以点开头或结尾（防止隐藏文件）
  if (filename.startsWith('.') || filename.endsWith('.')) {
    logger.warn('文件名验证失败：以点开头或结尾', {
      context: {
        module: 'utils',
        function: 'validateFileName',
      },
      data: { filename },
    })
    return { valid: false, message: '文件名不能以点开头或结尾' }
  }

  logger.debug('文件名验证通过', {
    context: {
      module: 'utils',
      function: 'validateFileName',
    },
    data: { filename },
  })

  return { valid: true }
}

/**
 * 文件魔数（Magic Number）映射表
 * 用于验证文件实际类型，防止文件类型伪造攻击
 */
const FILE_MAGIC_NUMBERS: Record<string, number[][]> = {
  mp4: [
    [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70], // ftyp box
    [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], // ftyp box (variant)
  ],
  avi: [
    [0x52, 0x49, 0x46, 0x46], // RIFF
  ],
  mov: [
    [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x71, 0x74], // ftypqt
  ],
  mkv: [
    [0x1a, 0x45, 0xdf, 0xa3], // EBML header
  ],
}

/**
 * 验证文件内容类型（通过魔数检查）
 * @param fileBuffer 文件内容缓冲区（ArrayBuffer或Uint8Array）
 * @param expectedType 期望的文件类型（扩展名，如'mp4'、'avi'等）
 * @returns 验证结果，包含valid（是否匹配）和message（错误消息，如果不匹配）
 * @description
 * 通过检查文件的前几个字节（魔数/Magic Number）来验证文件的实际类型，
 * 防止攻击者通过修改文件扩展名来伪造文件类型。
 * 支持的格式：MP4、AVI、MOV、MKV
 * @example
 * ```typescript
 * const fileBuffer = await file.arrayBuffer()
 * const result = validateFileContent(fileBuffer, 'mp4')
 * if (result.valid) {
 *   console.log('文件类型验证通过')
 * } else {
 *   console.error(result.message)
 * }
 * ```
 * @see {@link https://en.wikipedia.org/wiki/List_of_file_signatures 文件签名列表}
 */
export function validateFileContent(
  fileBuffer: ArrayBuffer | Uint8Array,
  expectedType: string,
): { valid: boolean; message?: string } {
  if (!fileBuffer || fileBuffer.byteLength < 4) {
    return { valid: false, message: '文件内容为空或过小' }
  }

  // 转换为Uint8Array以便访问字节
  const buffer = fileBuffer instanceof Uint8Array ? fileBuffer : new Uint8Array(fileBuffer)
  const magicNumbers = FILE_MAGIC_NUMBERS[expectedType.toLowerCase()]

  if (!magicNumbers) {
    // 如果未知类型，跳过魔数检查（但记录警告）
    logger.warn('文件内容验证：未知文件类型，跳过魔数检查', {
      context: {
        module: 'utils',
        function: 'validateFileContent',
      },
      data: { expectedType },
    })
    return { valid: true }
  }

  // 检查是否匹配任一魔数模式
  const matches = magicNumbers.some((pattern) => {
    if (buffer.length < pattern.length) {
      return false
    }
    return pattern.every((byte, index) => buffer[index] === byte)
  })

  if (!matches) {
    logger.warn('文件内容验证失败：文件内容与类型不匹配', {
      context: {
        module: 'utils',
        function: 'validateFileContent',
      },
      data: { expectedType, fileSize: buffer.length },
    })
    return {
      valid: false,
      message: `文件内容与类型不匹配，期望 ${expectedType} 格式`,
    }
  }

  logger.debug('文件内容验证通过', {
    context: {
      module: 'utils',
      function: 'validateFileContent',
    },
    data: { expectedType, fileSize: buffer.length },
  })

  return { valid: true }
}

/**
 * 生成安全的随机文件名
 * @param originalName 原始文件名（用于提取扩展名）
 * @returns 安全的随机文件名，格式：时间戳_随机字符串.扩展名
 * @description
 * 生成安全的随机文件名，防止：
 * - 文件名冲突（使用时间戳和随机字符串）
 * - 路径遍历攻击（文件名不包含路径分隔符）
 * - 文件类型伪造（仅允许安全的扩展名）
 * @example
 * ```typescript
 * const secureName = generateSecureFileName('video.mp4')
 * // 输出：1768047492720_27gfjszz8.mp4
 * ```
 */
export function generateSecureFileName(originalName: string): string {
  // 提取文件扩展名
  const ext = originalName.split('.').pop()?.toLowerCase() || 'bin'

  // 验证扩展名
  const allowedExtensions = ['mp4', 'avi', 'mov', 'mkv']
  const safeExt = allowedExtensions.includes(ext) ? ext : 'bin'

  // 生成随机文件名：时间戳_随机字符串.扩展名
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 11)
  const secureName = `${timestamp}_${randomStr}.${safeExt}`

  return secureName
}

/**
 * 清理文件名，移除危险字符
 * @param filename 原始文件名
 * @returns 清理后的文件名，如果清理后为空则返回'unnamed.bin'
 * @description
 * 清理文件名中的危险字符，包括：
 * - 路径分隔符（/ 和 \）替换为下划线
 * - 特殊字符（< > : " | ? * 和控制字符）移除
 * - 前后空格和点移除
 * - 长度限制为255字符
 * @example
 * ```typescript
 * const cleaned = sanitizeFileName('../file.mp4')
 * // 输出：'__file.mp4'
 * ```
 */
export function sanitizeFileName(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return 'unnamed.bin'
  }

  // 移除路径分隔符
  let sanitized = filename.replace(/[/\\]/g, '_')

  // 移除特殊字符
  sanitized = sanitized.replace(/[<>:"|?*\x00-\x1f]/g, '')

  // 移除前后空格和点
  sanitized = sanitized.trim().replace(/^\.+|\.+$/g, '')

  // 限制长度
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop()
    sanitized = sanitized.substring(0, 255 - (ext?.length || 0) - 1) + '.' + ext
  }

  // 如果清理后为空，使用默认名称
  if (!sanitized) {
    sanitized = 'unnamed.bin'
  }

  return sanitized
}
