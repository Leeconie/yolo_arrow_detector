/**
 * @fileoverview Vite构建配置
 * @module vite.config
 * @author HeZaoCha
 * @date 2026-01-11
 * @description Vite构建工具配置文件，包含Vue插件、Element Plus按需导入、图片优化等配置
 * @dependencies vite, vue, element-plus, sharp等
 */

import { fileURLToPath, URL } from 'node:url'
import type { ServerResponse } from 'node:http'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import { visualizer } from 'rollup-plugin-visualizer'
import { imageOptimizer } from './build/plugins/image-optimizer'
// Element Plus按需导入插件（性能优化）
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
// 自定义环境变量加载插件
import { envFilePlugin } from './vite.config.env'

// 注意：默认不使用CDN，所有依赖都打包到构建产物中
// 如需使用CDN，请参考 resources/cdn/vite-cdn-config.example.ts
// 并安装 vite-plugin-cdn-import 插件

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // 自定义环境变量加载插件（必须在最前面，确保环境变量在其他插件之前加载）
    envFilePlugin(),
    vue(),
    vueJsx(),
    vueDevTools(),
    // Element Plus自动导入配置（性能优化：按需导入，减少包体积）
    AutoImport({
      resolvers: [ElementPlusResolver()],
      // 自动导入Vue相关函数（如ref, reactive, computed等）
      imports: ['vue', 'vue-router', 'pinia'],
      // 生成类型声明文件
      dts: true,
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      // 生成类型声明文件
      dts: true,
    }),
    // 安全的图片优化插件：使用Sharp替代不安全的imagemin
    // 支持 PNG、JPG、JPEG、GIF、WebP 等格式
    // 仅在构建时优化，开发环境不优化以提升开发速度
    imageOptimizer({
      enabled: true, // 启用图片优化
      include: ['.png', '.jpg', '.jpeg', '.gif', '.webp'], // 支持的格式
      exclude: [], // 排除的文件模式
      jpegQuality: 80, // JPEG质量
      pngQuality: [0.6, 0.8], // PNG质量范围
      webpQuality: 80, // WebP质量
      convertToWebp: false, // 是否转换所有图片为WebP
      convertGifToWebp: true, // 是否将GIF转换为WebP以获得更好的压缩
    }),
    // 构建分析插件：生成构建产物可视化报告
    // 使用方法：执行构建后，在dist目录下会生成stats.html文件
    // 可以通过浏览器打开查看构建产物的体积分析
    visualizer({
      filename: 'dist/stats.html',
      open: false, // 构建完成后不自动打开
      gzipSize: true, // 显示gzip压缩后的大小
      brotliSize: true, // 显示brotli压缩后的大小
      template: 'treemap', // 使用树状图模板
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // 构建优化配置
  build: {
    // 代码分割配置
    rollupOptions: {
      output: {
        // 手动分割代码块
        manualChunks: (id) => {
          // node_modules中的依赖单独打包
          if (id.includes('node_modules')) {
            // 将大型第三方库单独打包
            if (id.includes('vue') || id.includes('vue-router') || id.includes('pinia')) {
              return 'vue-vendor'
            }
            if (id.includes('element-plus')) {
              return 'element-plus-vendor'
            }
            if (id.includes('axios')) {
              return 'axios-vendor'
            }
            if (id.includes('fabric')) {
              return 'fabric-vendor'
            }
            // 其他第三方库打包到vendor
            return 'vendor'
          }
        },
        // 代码块文件命名
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') ?? []
          const ext = info[info.length - 1]
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name ?? '')) {
            return `img/[name]-[hash].${ext}`
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name ?? '')) {
            return `fonts/[name]-[hash].${ext}`
          }
          return `assets/[name]-[hash].${ext}`
        },
      },
    },
    // 构建目标
    target: 'es2015',
    // 输出目录
    outDir: 'dist',
    // 生成source map（生产环境建议关闭）
    sourcemap: false,
    // 压缩配置
    minify: 'terser',
    terserOptions: {
      // 移除console和debugger
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    // chunk大小警告限制（KB）
    chunkSizeWarningLimit: 1000,
    // CSS代码分割
    cssCodeSplit: true,
    // 启用CSS压缩
    cssMinify: true,
    // 报告压缩后的大小
    reportCompressedSize: true,
  },
  // 优化依赖配置
  optimizeDeps: {
    // 预构建的依赖（确保所有依赖都通过npm管理并打包）
    include: [
      'vue',
      'vue-router',
      'pinia',
      'axios',
      'element-plus',
      '@element-plus/icons-vue',
      'dompurify',
      'fabric',
    ],
    // 排除的依赖（不需要预构建）
    exclude: [],
  },
  // 开发服务器配置
  server: {
    port: 4000,
    // 代理配置：解决CORS问题，将本地请求转发到Mock服务
    // 注意：上传接口单独配置，绕过Apifox Mock的文件大小限制
    proxy: {
      // ==================== AI 识别服务代理配置 ====================
      // 前端 /ai-api/** -> Python YOLO 服务（backend/main.py，默认 127.0.0.1:8000）
      // 走代理而不是直连，既避开 CORS，也不用把后端端口写死在业务代码里
      '/ai-api': {
        target: process.env.VITE_AI_BACKEND_URL || 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/ai-api/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            if (process.env.NODE_ENV !== 'production') {
              console.log(`[Vite Proxy] AI 识别服务: ${proxyReq.method} ${proxyReq.path}`)
            }
          })
          proxy.on('error', (err) => {
            console.error(
              '[Vite Proxy] AI 识别服务连接失败，请确认 backend 已启动:',
              err.message,
            )
          })
        },
      },
      // ==================== 上传接口代理配置 ====================
      // 上传接口：绕过Apifox Mock，直接使用本地Mock服务器或实际后端API
      // 这样可以避免Apifox Mock的文件大小限制，支持大文件上传测试（最大512MB）
      '/api/archery/upload': {
        // 本地Mock上传服务器地址（默认端口3001）
        // 如果设置了VITE_UPLOAD_API_URL环境变量，则使用该地址（可以是实际后端API）
        target: process.env.VITE_UPLOAD_API_URL || 'http://localhost:3001',
        changeOrigin: true, // 改变请求的origin，解决CORS问题
        secure: false, // 本地服务器使用http，不验证SSL证书
        // 注意：Vite代理默认支持大文件上传，无需额外配置limit
        rewrite: (path) => {
          // 移除 /api 前缀，直接转发到本地Mock服务器
          // 例如：/api/archery/upload -> /archery/upload
          return path.replace(/^\/api/, '')
        },
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // 记录代理请求日志（仅在开发环境）
            if (process.env.NODE_ENV !== 'production') {
              console.log(
                `[Vite Proxy] 上传请求代理: ${proxyReq.method} ${proxyReq.path} -> ${proxyReq.getHeader('host')}`,
              )
            }
          })
          proxy.on('error', (err, req, res) => {
            // 代理错误处理
            console.error('[Vite Proxy] 上传接口代理错误:', err.message)
            // 类型检查：确保res是ServerResponse类型（不是Socket）
            const response = res as ServerResponse | undefined
            if (response && !response.headersSent && typeof response.writeHead === 'function') {
              response.writeHead(500, {
                'Content-Type': 'application/json',
              })
              response.end(
                JSON.stringify({
                  code: 500,
                  message: '代理服务器错误，请检查本地Mock服务器是否运行',
                  data: null,
                }),
              )
            }
          })
        },
      },
      // 视频分片上传接口
      '/api/video/upload': {
        target: process.env.VITE_UPLOAD_API_URL || 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        // 注意：Vite代理默认支持大文件上传，无需额外配置limit
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            if (process.env.NODE_ENV !== 'production') {
              console.log(
                `[Vite Proxy] 视频分片上传代理: ${proxyReq.method} ${proxyReq.path} -> ${proxyReq.getHeader('host')}`,
              )
            }
          })
          proxy.on('error', (err) => {
            console.error('[Vite Proxy] 视频分片上传代理错误:', err.message)
          })
        },
      },
      // 视频校验接口
      '/api/video/validate': {
        target: process.env.VITE_UPLOAD_API_URL || 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.error('[Vite Proxy] 视频校验代理错误:', err.message)
          })
        },
      },
      // 保存视频类型接口
      '/api/video/saveType': {
        target: process.env.VITE_UPLOAD_API_URL || 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.error('[Vite Proxy] 保存视频类型代理错误:', err.message)
          })
        },
      },
      // ==================== 其他接口代理配置 ====================
      // 其他接口：继续使用Apifox Mock服务
      '/api': {
        // 动态获取Mock服务地址
        // 优先使用环境变量，否则使用默认值
        target: (() => {
          const mockType = process.env.VITE_APIFOX_MOCK_TYPE || 'cloud'
          if (mockType === 'local') {
            return (
              process.env.VITE_APIFOX_MOCK_LOCAL_URL ||
              'http://127.0.0.1:4523/m1/7676691-7418764-6917011'
            )
          }
          return (
            process.env.VITE_APIFOX_MOCK_CLOUD_URL ||
            'https://m1.apifoxmock.com/m1/7676691-7418764-6917011'
          )
        })(),
        changeOrigin: true, // 改变请求的origin，解决CORS问题
        secure: true, // 如果是https，验证SSL证书
        // 增加请求体大小限制（支持大文件上传）
        // 默认限制为512MB，可以根据需要调整
        // 注意：Vite代理默认支持大文件上传，无需额外配置limit
        // 文件大小限制由目标服务器（Mock服务或实际后端）控制
        rewrite: (path) => {
          // 移除 /api 前缀，直接转发到Mock服务
          // 例如：/api/archery/upload -> /archery/upload
          return path.replace(/^\/api/, '')
        },
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // 如果启用Token鉴权，添加apifoxToken请求头
            const enableMock = process.env.VITE_ENABLE_MOCK !== 'false'
            const mockType = process.env.VITE_APIFOX_MOCK_TYPE || 'cloud'
            const enableTokenAuth = process.env.VITE_ENABLE_MOCK_TOKEN_AUTH === 'true'
            const mockToken = process.env.VITE_APIFOX_TOKEN

            if (enableMock && mockType === 'cloud' && enableTokenAuth && mockToken) {
              proxyReq.setHeader('apifoxToken', mockToken)
            }
          })
        },
      },
    },
  },
  // 确保所有资源都打包到构建产物中，不使用CDN
  // 构建产物将包含所有必要的JS、CSS和静态资源文件
})
