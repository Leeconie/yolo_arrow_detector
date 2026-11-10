/**
 * @fileoverview Vite CDN插件配置示例
 * @description 此文件为CDN插件配置示例，可根据需要集成到vite.config.ts中
 * 
 * 使用说明：
 * 1. 安装CDN插件：pnpm add -D vite-plugin-cdn-import
 * 2. 在vite.config.ts中导入并配置此插件
 * 3. 仅在生产环境启用CDN替换
 * 
 * 注意：CDN配置是可选的，如果不需要使用CDN，可以跳过此配置
 */

import type { PluginOption } from 'vite'
// import cdnImport from 'vite-plugin-cdn-import'

/**
 * CDN插件配置
 * 仅在生产环境启用，开发环境使用本地依赖
 */
export function createCdnPlugin(): PluginOption[] {
  // 仅在生产环境启用CDN
  if (process.env.NODE_ENV !== 'production') {
    return []
  }

  // 注意：需要先安装 vite-plugin-cdn-import
  // pnpm add -D vite-plugin-cdn-import
  // 
  // 取消注释以下代码以启用CDN插件
  /*
  return [
    cdnImport({
      modules: [
        {
          name: 'vue',
          var: 'Vue',
          path: 'https://cdn.jsdelivr.net/npm/vue@3.5.26/dist/vue.global.prod.js',
        },
        {
          name: 'vue-router',
          var: 'VueRouter',
          path: 'https://cdn.jsdelivr.net/npm/vue-router@4.6.4/dist/vue-router.global.prod.js',
        },
        {
          name: 'pinia',
          var: 'Pinia',
          path: 'https://cdn.jsdelivr.net/npm/pinia@3.0.4/dist/pinia.iife.prod.js',
        },
        {
          name: 'axios',
          var: 'axios',
          path: 'https://cdnjs.cloudflare.com/ajax/libs/axios/1.13.2/axios.min.js',
        },
        {
          name: 'DOMPurify',
          var: 'DOMPurify',
          path: 'https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.3.1/purify.min.js',
        },
      ],
      // 自定义HTML模板
      prodUrl: 'https://cdn.jsdelivr.net/npm/{name}@{version}/{path}',
    }),
  ]
  */

  // 默认返回空数组（不启用CDN）
  return []
}

/**
 * 使用说明：
 * 
 * 1. 在vite.config.ts中导入：
 *    import { createCdnPlugin } from './resources/cdn/vite-cdn-config'
 * 
 * 2. 在plugins数组中添加：
 *    plugins: [
 *      ...createCdnPlugin(),
 *      // 其他插件
 *    ]
 * 
 * 3. 注意事项：
 *    - CDN插件会替换import语句为CDN链接
 *    - 需要确保CDN资源可用且版本正确
 *    - 建议使用SRI校验确保资源安全
 *    - 开发环境不建议使用CDN，使用本地依赖更便于调试
 */
