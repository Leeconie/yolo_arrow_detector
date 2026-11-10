<template>
  <div v-if="hasError" class="error-boundary">
    <el-card class="error-card" shadow="hover">
      <template #header>
        <div class="error-header">
          <el-icon size="24" color="#f56c6c"><WarningFilled /></el-icon>
          <span class="error-title">页面加载出错</span>
        </div>
      </template>

      <div class="error-content">
        <p class="error-message">{{ errorMessage }}</p>
        <p class="error-description">抱歉，页面加载时出现了错误。您可以尝试刷新页面或返回首页。</p>

        <div class="error-actions">
          <el-button type="primary" @click="handleRetry">
            <el-icon><Refresh /></el-icon>
            重试
          </el-button>
          <el-button @click="handleGoHome">
            <el-icon><HomeFilled /></el-icon>
            返回首页
          </el-button>
          <el-button v-if="showDetails" @click="toggleDetails">
            {{ showErrorDetails ? '隐藏' : '显示' }}错误详情
          </el-button>
        </div>

        <el-collapse-transition>
          <div v-if="showErrorDetails" class="error-details">
            <el-divider />
            <h4>错误详情（仅用于调试）</h4>
            <pre class="error-stack">{{ errorStack }}</pre>
            <p class="error-info">
              <strong>错误时间：</strong>{{ errorTime }}<br />
              <strong>错误组件：</strong>{{ errorComponent || '未知' }}<br />
              <strong>错误路径：</strong>{{ errorPath || '未知' }}
            </p>
          </div>
        </el-collapse-transition>
      </div>
    </el-card>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
/**
 * @fileoverview Vue错误边界组件
 * @module core/error/ErrorBoundary
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 捕获子组件树中的错误，显示友好的错误界面并提供错误恢复机制
 */

import { ref, onErrorCaptured, provide, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { WarningFilled, Refresh, HomeFilled } from '@element-plus/icons-vue'
import { logger } from '@/core/logger'

defineOptions({
  name: 'ErrorBoundary',
})

import type { ComponentPublicInstance } from 'vue'

interface Props {
  /** 是否在开发环境显示错误详情 */
  showDetailsInDev?: boolean
  /** 错误恢复回调 */
  onError?: (error: Error, instance: ComponentPublicInstance | null, info: string) => void
  /** 最大重试次数 */
  maxRetries?: number
}

const props = withDefaults(defineProps<Props>(), {
  showDetailsInDev: true,
  maxRetries: 3,
})

const router = useRouter()
const route = useRoute()

const hasError = ref(false)
const error = ref<Error | null>(null)
const errorInfo = ref<string>('')
const errorComponent = ref<string>('')
const errorPath = ref<string>('')
const errorTime = ref<string>('')
const showErrorDetails = ref(false)
const retryCount = ref(0)

const showDetails = ref(import.meta.env.DEV && props.showDetailsInDev)

const errorMessage = ref('页面加载时出现了错误，请稍后重试。')
const errorStack = ref('')

/**
 * 捕获子组件错误
 */
onErrorCaptured((err: Error, instance: ComponentPublicInstance | null, info: string) => {
  hasError.value = true
  error.value = err
  errorInfo.value = info
  errorTime.value = new Date().toLocaleString('zh-CN')

  // 获取错误组件信息
  if (instance?.$?.type?.name) {
    errorComponent.value = instance.$.type.name
  } else if (instance?.$?.type?.__name) {
    errorComponent.value = instance.$.type.__name
  }

  // 获取当前路由路径
  errorPath.value = route.path

  // 设置错误消息和堆栈
  errorMessage.value = err.message || '页面加载时出现了错误，请稍后重试。'
  errorStack.value = err.stack || '无堆栈信息'

  // 记录错误日志
  logger.error('组件错误被错误边界捕获', {
    context: {
      module: 'error',
      function: 'ErrorBoundary.onErrorCaptured',
      component: errorComponent.value,
      path: errorPath.value,
    },
    error: err,
    data: {
      errorInfo: info,
      errorTime: errorTime.value,
      retryCount: retryCount.value,
    },
  })

  // 调用错误回调
  if (props.onError) {
    props.onError(err, instance, info)
  }

  // 阻止错误继续传播
  return false
})

/**
 * 重试加载
 */
const handleRetry = () => {
  if (retryCount.value >= props.maxRetries) {
    ElMessage.warning(`已达到最大重试次数（${props.maxRetries}次），请刷新页面或联系技术支持。`)
    return
  }

  retryCount.value++
  logger.info('用户尝试重试加载页面', {
    context: {
      module: 'error',
      function: 'ErrorBoundary.handleRetry',
    },
    data: {
      retryCount: retryCount.value,
      maxRetries: props.maxRetries,
    },
  })

  // 重置错误状态
  hasError.value = false
  error.value = null
  errorInfo.value = ''
  showErrorDetails.value = false

  // 尝试重新加载当前路由
  router.go(0)
}

/**
 * 返回首页
 */
const handleGoHome = () => {
  logger.info('用户从错误页面返回首页', {
    context: {
      module: 'error',
      function: 'ErrorBoundary.handleGoHome',
    },
    data: {
      fromPath: errorPath.value,
    },
  })

  router.push('/home').catch((err) => {
    logger.error('返回首页失败', {
      context: {
        module: 'error',
        function: 'ErrorBoundary.handleGoHome',
      },
      error: err instanceof Error ? err : new Error(String(err)),
    })
  })
}

/**
 * 切换错误详情显示
 */
const toggleDetails = () => {
  showErrorDetails.value = !showErrorDetails.value
}

/**
 * 提供错误恢复方法给子组件
 */
provide('errorBoundary', {
  reset: () => {
    hasError.value = false
    error.value = null
    errorInfo.value = ''
    retryCount.value = 0
  },
  reportError: (err: Error, componentName?: string) => {
    hasError.value = true
    error.value = err
    errorComponent.value = componentName || '未知'
    errorPath.value = route.path
    errorTime.value = new Date().toLocaleString('zh-CN')
    errorMessage.value = err.message || '页面加载时出现了错误，请稍后重试。'
    errorStack.value = err.stack || '无堆栈信息'
  },
})

// 监听路由变化，重置错误状态
watch(
  () => route.path,
  () => {
    if (hasError.value) {
      hasError.value = false
      error.value = null
      errorInfo.value = ''
      retryCount.value = 0
    }
  },
)
</script>

<style scoped>
.error-boundary {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: #f5f7fa;
}

.error-card {
  max-width: 600px;
  width: 100%;
  border-radius: 12px;
}

.error-header {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 600;
  color: #f56c6c;
}

.error-title {
  margin: 0;
}

.error-content {
  padding: 20px 0;
}

.error-message {
  font-size: 16px;
  color: #303133;
  margin: 0 0 12px 0;
  font-weight: 500;
}

.error-description {
  font-size: 14px;
  color: #606266;
  margin: 0 0 24px 0;
  line-height: 1.6;
}

.error-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.error-details {
  margin-top: 20px;
}

.error-details h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #909399;
  font-weight: 500;
}

.error-stack {
  background-color: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
  overflow-x: auto;
  margin: 0 0 12px 0;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}

.error-info {
  font-size: 12px;
  color: #909399;
  line-height: 1.8;
  margin: 0;
}
</style>
