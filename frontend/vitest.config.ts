/**
 * @fileoverview Vitest测试配置
 * @module vitest.config
 * @author HeZaoCha
 * @date 2026-01-11
 * @description Vitest单元测试和集成测试配置文件，继承Vite配置并添加测试特有设置
 * @dependencies vitest, vite, jsdom
 */

import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    plugins: [
      // Mock CSS文件
      {
        name: 'css-mock',
        load(id: string) {
          if (id.endsWith('.css')) {
            return 'export default {}'
          }
        },
      },
    ],
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      // 优化测试性能：启用线程池
      pool: 'threads',
      // 配置CSS处理
      css: true,
      // 注意：onUnhandledRejection 在 Vitest 4.0 中已被移除
      // Vitest 现在默认会处理未处理的 Promise rejection
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov', 'html', 'json-summary'],
        reportsDirectory: './coverage',
        exclude: [
          '**/node_modules/**',
          '**/dist/**',
          '**/coverage/**',
          '**/*.config.{js,ts}',
          '**/e2e/**',
          '**/__tests__/**',
          '**/*.spec.{ts,tsx}',
          '**/*.test.{ts,tsx}',
        ],
        thresholds: {
          global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
          },
          // 按模块设置不同的覆盖率要求
          './src/core/api/': {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
          },
          './src/utils/': {
            branches: 90,
            functions: 90,
            lines: 90,
            statements: 90,
          },
          './src/stores/modules/': {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
          },
          './src/router/guards/': {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
          },
          './src/core/config/': {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70,
          },
        },
      },
    },
  }),
)
