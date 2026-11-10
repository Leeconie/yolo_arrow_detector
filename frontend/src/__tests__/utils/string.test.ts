/**
 * @fileoverview 字符串处理工具单元测试
 * @module utils/string.test
 * @author HeZaoCha
 * @date 2026-01-10
 */

import { describe, it, expect } from 'vitest'
import {
  capitalize,
  uncapitalize,
  camelToSnake,
  snakeToCamel,
  truncate,
  trim,
  removeWhitespace,
  template,
  mask,
} from '@/utils/string'

describe('字符串处理工具', () => {
  describe('capitalize', () => {
    it('应该将首字母大写', () => {
      expect(capitalize('hello')).toBe('Hello')
      expect(capitalize('world')).toBe('World')
    })

    it('应该处理已经是首字母大写的字符串', () => {
      expect(capitalize('Hello')).toBe('Hello')
      expect(capitalize('HELLO')).toBe('HELLO')
    })

    it('应该处理空字符串', () => {
      expect(capitalize('')).toBe('')
    })
  })

  describe('uncapitalize', () => {
    it('应该将首字母小写', () => {
      expect(uncapitalize('Hello')).toBe('hello')
      expect(uncapitalize('World')).toBe('world')
    })

    it('应该处理已经是首字母小写的字符串', () => {
      expect(uncapitalize('hello')).toBe('hello')
    })

    it('应该处理空字符串', () => {
      expect(uncapitalize('')).toBe('')
    })
  })

  describe('camelToSnake', () => {
    it('应该将驼峰命名转换为下划线命名', () => {
      expect(camelToSnake('userName')).toBe('user_name')
      expect(camelToSnake('getUserInfo')).toBe('get_user_info')
      // XMLHttpRequest会转换为_x_m_l_http_request（第一个大写字母前会加下划线）
      expect(camelToSnake('XMLHttpRequest')).toBe('_x_m_l_http_request')
    })

    it('应该处理已经是下划线命名的字符串', () => {
      expect(camelToSnake('user_name')).toBe('user_name')
    })
  })

  describe('snakeToCamel', () => {
    it('应该将下划线命名转换为驼峰命名', () => {
      expect(snakeToCamel('user_name')).toBe('userName')
      expect(snakeToCamel('get_user_info')).toBe('getUserInfo')
    })

    it('应该处理已经是驼峰命名的字符串', () => {
      expect(snakeToCamel('userName')).toBe('userName')
    })
  })

  describe('truncate', () => {
    it('应该截取字符串并添加省略号', () => {
      expect(truncate('这是一段很长的文本', 5)).toBe('这是一段很...')
      expect(truncate('Hello World', 8)).toBe('Hello Wo...')
    })

    it('应该处理短于指定长度的字符串', () => {
      expect(truncate('Hello', 10)).toBe('Hello')
    })

    it('应该使用自定义后缀', () => {
      expect(truncate('Hello World', 8, '...')).toBe('Hello Wo...')
      expect(truncate('Hello World', 8, '>>')).toBe('Hello Wo>>')
    })

    it('应该处理空字符串', () => {
      expect(truncate('', 5)).toBe('')
    })
  })

  describe('trim', () => {
    it('应该去除首尾空白字符', () => {
      expect(trim('  hello world  ')).toBe('hello world')
      expect(trim('\t\nhello\n\t')).toBe('hello')
    })

    it('应该处理没有空白字符的字符串', () => {
      expect(trim('hello')).toBe('hello')
    })
  })

  describe('removeWhitespace', () => {
    it('应该去除所有空白字符', () => {
      expect(removeWhitespace('  hello   world  ')).toBe('helloworld')
      expect(removeWhitespace('hello\n\tworld')).toBe('helloworld')
    })

    it('应该处理没有空白字符的字符串', () => {
      expect(removeWhitespace('helloworld')).toBe('helloworld')
    })
  })

  describe('template', () => {
    it('应该替换模板中的占位符', () => {
      expect(template('Hello {name}, you are {age} years old', { name: 'John', age: 30 })).toBe(
        'Hello John, you are 30 years old',
      )
    })

    it('应该处理不存在的占位符', () => {
      expect(template('Hello {name}', {})).toBe('Hello {name}')
    })

    it('应该处理多个相同占位符', () => {
      expect(template('{name} says hello to {name}', { name: 'John' })).toBe(
        'John says hello to John',
      )
    })

    it('应该处理不同类型的值', () => {
      expect(template('Value: {value}', { value: 123 })).toBe('Value: 123')
      expect(template('Value: {value}', { value: true })).toBe('Value: true')
    })
  })

  describe('mask', () => {
    it('应该对字符串进行脱敏处理', () => {
      expect(mask('13800138000', 3, 4)).toBe('138****8000')
      // user@example.com长度为16，保留前2后3，中间11个字符用*替换
      expect(mask('user@example.com', 2, 3)).toBe('us***********com')
    })

    it('应该使用自定义脱敏字符', () => {
      expect(mask('13800138000', 3, 4, '#')).toBe('138####8000')
      expect(mask('1234567890', 0, 0, '#')).toBe('##########')
    })

    it('应该处理短于start+end的字符串', () => {
      // 如果字符串长度小于等于start+end，返回全部脱敏
      expect(mask('123', 2, 2)).toBe('***')
    })

    it('应该处理空字符串', () => {
      expect(mask('', 3, 4)).toBe('')
    })

    it('应该使用默认参数', () => {
      // 当start=0, end=0时，str.length(10) > start(0) + end(0)，所以会进行脱敏
      // startStr = '', endStr = '', maskStr = '*' * 10 = '**********'
      expect(mask('1234567890', 0, 0)).toBe('**********') // 10个*
      expect(mask('1234567890', 3, 4)).toBe('123***7890')
    })
  })
})
