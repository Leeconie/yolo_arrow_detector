/**
 * @fileoverview 应用入口文件
 * @module main
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 创建Vue应用实例并注册插件
 *
 * 性能优化说明：
 * - Element Plus使用按需导入（通过unplugin-vue-components自动导入）
 * - 图标库全局注册（支持<el-icon><IconName /></el-icon>语法）
 * - 未使用的图标会被tree-shaking移除
 */

import { createApp } from 'vue'
import pinia from './stores'
import router from './router'
import App from './App.vue'
import '@/assets/styles/index.css'
import { lazyLoadDirective } from '@/utils/lazy-load'
import { logger } from '@/core/logger'
import { defaultWebVitalsMonitor } from '@/core/performance/web-vitals'
import { defaultGlobalErrorHandler } from '@/core/error/global-error-handler'

// Element Plus样式（按需导入，组件使用时自动引入）
import 'element-plus/dist/index.css'
// Element Plus图标库全局注册
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

logger.info('应用启动', {
  context: {
    module: 'main',
    function: 'appInit',
  },
  data: {
    env: import.meta.env.MODE,
    version: import.meta.env.VITE_APP_VERSION || 'unknown',
  },
})

const app = createApp(App)

// 注册Element Plus图标（全局注册，支持<el-icon><IconName /></el-icon>语法）
// 注意：虽然全局注册会增加初始包大小，但Element Plus图标库支持按需加载，
// 实际构建时未使用的图标会被tree-shaking移除
let iconCount = 0
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
  iconCount++
}
logger.debug('Element Plus图标已注册', {
  context: {
    module: 'main',
    function: 'appInit',
  },
  data: {
    iconCount,
  },
})

// 注册Pinia状态管理
app.use(pinia)
logger.debug('Pinia状态管理已注册', {
  context: {
    module: 'main',
    function: 'appInit',
  },
})

// 注册路由
app.use(router)
logger.debug('路由已注册', {
  context: {
    module: 'main',
    function: 'appInit',
  },
})

// 注册懒加载指令
app.directive('lazy', lazyLoadDirective)
logger.debug('懒加载指令已注册', {
  context: {
    module: 'main',
    function: 'appInit',
  },
})

// 初始化全局错误处理器
defaultGlobalErrorHandler.init()
logger.debug('全局错误处理器已初始化', {
  context: {
    module: 'main',
    function: 'appInit',
  },
})

// 初始化Web Vitals性能监控
defaultWebVitalsMonitor.init()
logger.debug('Web Vitals性能监控已初始化', {
  context: {
    module: 'main',
    function: 'appInit',
  },
})

try {
  app.mount('#app')
  logger.info('应用挂载成功', {
    context: {
      module: 'main',
      function: 'appInit',
    },
  })
} catch (error) {
  logger.fatal('应用挂载失败', {
    context: {
      module: 'main',
      function: 'appInit',
    },
    error: error instanceof Error ? error : new Error(String(error)),
  })
  throw error
}
