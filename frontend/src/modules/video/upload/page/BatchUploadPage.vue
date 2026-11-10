<template>
  <div class="batch-upload-page">
    <el-card class="upload-card">
      <template #header>
        <div class="card-header">
          <span>批量视频上传</span>
          <el-button text @click="goToSingleUpload">
            <el-icon><ArrowLeft /></el-icon>
            返回单文件上传
          </el-button>
        </div>
      </template>

      <div class="upload-content">
        <!-- 批量上传组件 -->
        <BatchUpload
          ref="batchUploaderRef"
          :max-concurrent="maxConcurrent"
          :auto-start="autoStart"
          @upload-success="handleBatchSuccess"
          @upload-error="handleBatchError"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview 批量上传页面
 * @module modules/video/upload/page/BatchUploadPage
 * @author HeZaoCha
 * @date 2026-01-11
 * @description 批量视频上传主页面，支持多文件并发上传和状态持久化
 * @dependencies vue, vue-router, element-plus, @element-plus/icons-vue, ../components/BatchUpload
 */

import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import BatchUpload from '../components/BatchUpload.vue'

const router = useRouter()

/**
 * 上传配置
 */
const maxConcurrent = 3 // 最大并发数
const autoStart = false // 手动开始，避免自动上传过多文件

/**
 * 组件引用
 */
const batchUploaderRef = ref<InstanceType<typeof BatchUpload>>()

/**
 * 跳转到单文件上传页面
 */
function goToSingleUpload(): void {
  router.push({ name: 'VideoUpload' })
}

/**
 * 处理批量上传成功
 */
interface BatchUploadResult {
  success: boolean
  file?: File
  error?: string
}

function handleBatchSuccess(results: BatchUploadResult[]): void {
  const successCount = results.filter((r) => r.success).length
  const totalCount = results.length

  if (successCount === totalCount) {
    ElMessage.success(`批量上传完成！共上传 ${totalCount} 个文件`)
  } else {
    ElMessage.warning(`批量上传完成。成功：${successCount}，失败：${totalCount - successCount}`)
  }

  // 可以跳转到结果页面或历史记录页面
  // router.push({ name: 'UploadHistory' })
}

/**
 * 处理批量上传错误
 */
function handleBatchError(error: Error): void {
  ElMessage.error(`批量上传失败：${error.message}`)

  // 记录详细错误日志
  console.error('批量上传失败:', error)
}
</script>

<style scoped>
.batch-upload-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.upload-card {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upload-content {
  width: 100%;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .batch-upload-page {
    padding: 15px;
  }

  .card-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
}
</style>
