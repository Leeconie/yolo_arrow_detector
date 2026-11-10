/**
 * @fileoverview ESLint配置
 * @module eslint.config
 * @author HeZaoCha
 * @date 2026-01-11
 * @description ESLint flat配置，支持Vue 3、TypeScript、Playwright、Vitest等
 * @dependencies eslint, @vue/eslint-config-typescript, eslint-plugin-vue等
 */

import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import pluginPlaywright from 'eslint-plugin-playwright'
import pluginVitest from '@vitest/eslint-plugin'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{vue,ts,mts,tsx}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**', '**/temp/**']),

  ...pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,

  {
    ...pluginPlaywright.configs['flat/recommended'],
    files: ['e2e/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    rules: {
      'playwright/no-conditional-in-test': 'warn',
      'playwright/no-conditional-expect': 'warn',
      'playwright/no-networkidle': 'error',
    },
  },

  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/__tests__/*'],
  },

  // 自定义规则覆盖
  {
    files: ['**/*.{vue,ts,mts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn', // 降级为警告而不是错误
      '@typescript-eslint/no-require-imports': 'error',
    },
  },

  skipFormatting,
)
