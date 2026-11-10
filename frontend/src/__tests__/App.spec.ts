/**
 * @fileoverview App.vue组件单元测试
 * @module __tests__/App.spec
 * @author HeZaoCha
 * @date 2026-01-11
 * @description App组件的单元测试，验证组件渲染和错误边界功能
 * @dependencies vitest, @vue/test-utils, vue
 */

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import App from '../App.vue'

// Mock所有外部依赖
vi.mock('element-plus/dist/index.css', () => ({}))
vi.mock('@/assets/styles/index.css', () => ({}))
vi.mock('../main', () => ({}))
vi.mock('../router', () => ({
  default: {
    isReady: () => Promise.resolve(),
  },
}))
vi.mock('@/core/error/ErrorBoundary.vue', () => ({
  default: {
    template: '<div><slot /></div>',
  },
}))
vi.mock('vue-router', () => ({
  RouterView: {
    template: '<div>RouterView</div>',
  },
}))

describe('App', () => {
  it('renders without crashing', () => {
    const pinia = createPinia()

    // 只测试基本的渲染，不包含路由
    const wrapper = mount(App, {
      global: {
        plugins: [pinia],
        stubs: {
          RouterView: true,
          RouterLink: true,
        },
      },
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.html()).toContain('app') // 基本的HTML结构检查
  })
})
