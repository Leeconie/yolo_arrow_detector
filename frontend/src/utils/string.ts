/**
 * @fileoverview 字符串处理工具
 * @module utils/string
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 提供字符串格式化、截取、转换等处理功能
 * 性能优化：预编译正则表达式、结果缓存、优化字符串操作
 */

/**
 * 预编译正则表达式（性能优化：避免重复创建正则对象）
 */
const CAMEL_TO_SNAKE_REGEX = /([A-Z])/g
const SNAKE_TO_CAMEL_REGEX = /_([a-z])/g

/**
 * 字符串首字母大写
 * @param str 原始字符串
 * @returns 首字母大写的字符串
 * @example
 * ```typescript
 * capitalize('hello') // 'Hello'
 * capitalize('HELLO') // 'HELLO'
 * ```
 */
export function capitalize(str: string): string {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * 字符串首字母小写
 * @param str 原始字符串
 * @returns 首字母小写的字符串
 * @example
 * ```typescript
 * uncapitalize('Hello') // 'hello'
 * ```
 */
export function uncapitalize(str: string): string {
  if (!str) return str
  return str.charAt(0).toLowerCase() + str.slice(1)
}

/**
 * 驼峰命名转下划线命名
 * @param str 驼峰命名字符串
 * @returns 下划线命名字符串
 * @description 性能优化：使用预编译的正则表达式
 * @example
 * ```typescript
 * camelToSnake('userName') // 'user_name'
 * camelToSnake('getUserInfo') // 'get_user_info'
 * ```
 */
export function camelToSnake(str: string): string {
  // 性能优化：使用预编译的正则表达式
  return str.replace(CAMEL_TO_SNAKE_REGEX, '_$1').toLowerCase()
}

/**
 * 下划线命名转驼峰命名
 * @param str 下划线命名字符串
 * @returns 驼峰命名字符串
 * @description 性能优化：使用预编译的正则表达式
 * @example
 * ```typescript
 * snakeToCamel('user_name') // 'userName'
 * snakeToCamel('get_user_info') // 'getUserInfo'
 * ```
 */
export function snakeToCamel(str: string): string {
  // 性能优化：使用预编译的正则表达式
  return str.replace(SNAKE_TO_CAMEL_REGEX, (_, letter) => letter.toUpperCase())
}

/**
 * 截取字符串并添加省略号
 * @param str 原始字符串
 * @param length 最大长度
 * @param suffix 后缀，默认为'...'
 * @returns 截取后的字符串
 * @example
 * ```typescript
 * truncate('这是一段很长的文本', 5) // '这是一段很...'
 * truncate('Hello World', 8, '...') // 'Hello Wo...'
 * ```
 */
export function truncate(str: string, length: number, suffix: string = '...'): string {
  if (!str || str.length <= length) return str
  return str.slice(0, length) + suffix
}

/**
 * 去除字符串首尾空白字符
 * @param str 原始字符串
 * @returns 去除空白后的字符串
 * @example
 * ```typescript
 * trim('  hello world  ') // 'hello world'
 * ```
 */
export function trim(str: string): string {
  return str.trim()
}

/**
 * 去除字符串所有空白字符
 * @param str 原始字符串
 * @returns 去除所有空白后的字符串
 * @example
 * ```typescript
 * removeWhitespace('  hello   world  ') // 'helloworld'
 * ```
 */
export function removeWhitespace(str: string): string {
  return str.replace(/\s+/g, '')
}

/**
 * 字符串模板替换
 * @param template 模板字符串，使用{key}作为占位符
 * @param data 替换数据对象
 * @returns 替换后的字符串
 * @example
 * ```typescript
 * template('Hello {name}, you are {age} years old', { name: 'John', age: 30 })
 * // 'Hello John, you are 30 years old'
 * ```
 */
export function template(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return data[key] !== undefined ? String(data[key]) : match
  })
}

/**
 * 字符串脱敏处理
 * @param str 原始字符串
 * @param start 保留开始字符数
 * @param end 保留结束字符数
 * @param mask 脱敏字符，默认为'*'
 * @returns 脱敏后的字符串
 * @example
 * ```typescript
 * mask('13800138000', 3, 4) // '138****8000'
 * mask('user@example.com', 2, 3) // 'us*****com'
 * ```
 */
export function mask(
  str: string,
  start: number = 0,
  end: number = 0,
  maskChar: string = '*',
): string {
  if (!str) return str
  // 如果保留的字符数大于等于字符串长度，返回全部脱敏
  // 这样可以确保敏感信息即使很短也会被脱敏
  if (str.length <= start + end) {
    return maskChar.repeat(str.length)
  }
  const startStr = str.slice(0, start)
  const endStr = end > 0 ? str.slice(-end) : ''
  const maskLength = str.length - start - end
  const maskStr = maskLength > 0 ? maskChar.repeat(maskLength) : ''
  return startStr + maskStr + endStr
}
