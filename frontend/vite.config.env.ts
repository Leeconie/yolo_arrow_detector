/**
 * @fileoverview Vite环境变量加载插件
 * @module vite.config.env
 * @author HeZaoCha
 * @date 2026-01-11
 * @description 支持自定义环境变量文件（.env.dev, .env.test, .env.prod）
 */

import type { Plugin } from 'vite'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * 解析环境变量文件
 * @param filePath 文件路径
 * @returns 解析后的环境变量对象
 */
function parseEnvFile(filePath: string): Record<string, string> {
  try {
    const content = readFileSync(filePath, 'utf-8')
    const env: Record<string, string> = {}
    const lines = content.split('\n')

    for (const line of lines) {
      // 跳过注释和空行
      const trimmedLine = line.trim()
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue
      }

      // 解析 KEY=VALUE 格式
      const match = trimmedLine.match(/^([^=]+)=(.*)$/)
      if (match) {
        const key = match[1].trim()
        let value = match[2].trim()

        // 移除引号
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1)
        }

        env[key] = value
      }
    }

    return env
  } catch {
    // 文件不存在时返回空对象
    return {}
  }
}

/**
 * 环境变量文件映射
 */
const ENV_FILE_MAP: Record<string, string> = {
  dev: '.env.dev',
  development: '.env.dev',
  test: '.env.test',
  prod: '.env.prod',
  production: '.env.prod',
}

/**
 * Vite插件：加载自定义环境变量文件
 * @returns Vite插件
 */
export function envFilePlugin(): Plugin {
  return {
    name: 'vite-plugin-env-file',
    config(config, { mode }) {
      const root = config.root || process.cwd()
      const envFile = ENV_FILE_MAP[mode] || `.env.${mode}`

      // 加载自定义环境变量文件
      const envPath = resolve(root, envFile)
      const envVars = parseEnvFile(envPath)

      // 将环境变量合并到 process.env
      for (const [key, value] of Object.entries(envVars)) {
        if (!process.env[key]) {
          process.env[key] = value
        }
      }

      // 返回配置，Vite会自动处理以VITE_开头的环境变量
      return {
        define: {
          // 确保环境变量在构建时可用
          ...Object.fromEntries(
            Object.entries(envVars)
              .filter(([key]) => key.startsWith('VITE_'))
              .map(([key, value]) => [`import.meta.env.${key}`, JSON.stringify(value)]),
          ),
        },
      }
    },
  }
}
