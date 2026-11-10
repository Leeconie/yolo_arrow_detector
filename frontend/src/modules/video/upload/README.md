# 视频上传模块

> 支持大文件分片上传、断点续传的视频上传解决方案

[![Vue](https://img.shields.io/badge/Vue-3.4+-green.svg)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-blue.svg)](https://www.typescriptlang.org/)
[![Status](https://img.shields.io/badge/status-stable-brightgreen.svg)]()

## 📋 目录

- [概述](#概述)
- [功能特性](#功能特性)
- [模块结构](#模块结构)
- [快速开始](#快速开始)
- [组件使用](#组件使用)
- [API文档](#api文档)
- [配置说明](#配置说明)
- [常见问题](#常见问题)
- [变更日志](#变更日志)

## 🎯 概述

视频上传模块是一个功能完整的视频文件上传解决方案，专为大文件上传场景设计。支持分片上传、断点续传、进度显示等核心功能，提供优秀的用户体验。

### 核心能力

- 📤 **大文件上传** - 支持最大512MB视频文件
- 🔄 **断点续传** - 网络中断后可继续上传
- 📊 **进度显示** - 实时显示上传进度和速度
- 🎯 **拖拽上传** - 支持拖拽文件到上传区域
- ✅ **文件验证** - 类型、大小、格式全面验证
- 🎨 **现代UI** - 美观的界面设计和动画效果
- 🔒 **安全可靠** - 完善的安全验证机制

## ✨ 功能特性

### 1. 分片上传

- 自动将大文件分割为5MB的小片
- 并发上传多个分片（可配置）
- 失败分片自动重试
- 支持暂停和继续上传

### 2. 断点续传

- 记录已上传的分片
- 网络恢复后自动继续
- 刷新页面后可恢复上传（待实现）

### 3. 进度监控

- 实时显示上传进度百分比
- 显示当前上传速度
- 估算剩余上传时间
- 已上传/总大小显示

### 4. 文件验证

- **类型验证**: 仅支持视频文件（MP4、AVI、MOV等）
- **大小验证**: 限制最大512MB
- **格式验证**: MIME类型检查
- **安全检查**: 基础恶意文件检测

### 5. 用户体验

- 拖拽上传支持
- 上传状态实时反馈
- 错误提示友好清晰
- 成功动画效果
- 响应式设计

## 📁 模块结构

````plaintext
upload/
├── api/                    # API接口
│   └── uploadApi.ts        # 上传API封装
├── components/             # 组件
│   ├── VideoUploader.vue   # 主上传组件
│   └── TypeSelector.vue    # 类型选择组件
├── composables/            # 组合式函数
│   └── useVideoUpload.ts   # 上传逻辑封装
├── page/                   # 页面
│   └── UploadPage.vue      # 上传页面
├── types/                  # 类型定义
│   └── uploadTypes.ts      # 上传相关类型
├── index.ts                # 模块导出
├── README.md               # 本文档
└── CHANGELOG.md            # 变更日志
```

## 🚀 快速开始

### 安装依赖

模块已集成到项目中，无需单独安装：

```bash
pnpm install
```

### 基础使用

#### 1. 在页面中使用上传组件

```vue
<template>
  <div class="upload-page">
    <VideoUploader
      :video-type="videoType"
      @upload-success="handleSuccess"
      @upload-error="handleError"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { VideoUploader } from '@/modules/video/upload'

const videoType = ref<'human' | 'archery'>('human')

function handleSuccess(result: any) {
  console.log('上传成功', result)
}

function handleError(error: Error) {
  console.error('上传失败', error)
}
</script>
```

#### 2. 使用Composable

```vue
<script setup lang="ts">
import { useVideoUpload } from '@/modules/video/upload'

const { uploadFile, progress, isUploading, error, cancelUpload } = useVideoUpload()

async function handleFileSelect(file: File) {
  try {
    const result = await uploadFile(file, 'human')
    console.log('上传成功', result)
  } catch (err) {
    console.error('上传失败', err)
  }
}
</script>
```

#### 3. 直接调用API

```typescript
import { uploadVideo, initUpload, completeUpload } from '@/modules/video/upload/api'

// 初始化上传
const { uploadId, chunkSize } = await initUpload({
  fileName: 'video.mp4',
  fileSize: 10485760,
  fileType: 'video/mp4',
  videoType: 'human',
})

// 上传分片
for (let i = 0; i < totalChunks; i++) {
  await uploadVideo({
    uploadId,
    chunkIndex: i,
    chunk: chunkData,
  })
}

// 完成上传
const result = await completeUpload(uploadId)
```

## 🎨 组件使用

### VideoUploader 组件

主上传组件，提供完整的上传功能。

#### Props

| 参数       | 类型                 | 默认值          | 说明                 |
| ---------- | -------------------- | --------------- | -------------------- |
| videoType  | 'human' \| 'archery' | 'human'         | 视频类型             |
| maxSize    | number               | 512 _1024_ 1024 | 最大文件大小（字节） |
| accept     | string               | 'video/\*'      | 接受的文件类型       |
| autoUpload | boolean              | true            | 选择文件后自动上传   |

#### Events

| 事件名          | 参数                 | 说明               |
| --------------- | -------------------- | ------------------ |
| upload-success  | result: UploadResult | 上传成功时触发     |
| upload-error    | error: Error         | 上传失败时触发     |
| upload-progress | progress: number     | 上传进度变化时触发 |
| file-select     | file: File           | 选择文件时触发     |

#### Slots

| 插槽名   | 说明           |
| -------- | -------------- |
| trigger  | 自定义触发按钮 |
| progress | 自定义进度显示 |

#### 示例

```vue
<template>
  <VideoUploader
    :video-type="videoType"
    :max-size="maxSize"
    @upload-success="handleSuccess"
    @upload-progress="handleProgress"
  >
    <template #trigger>
      <button class="custom-button">选择视频</button>
    </template>

    <template #progress="{ progress }">
      <div class="custom-progress">上传进度: {{ progress }}%</div>
    </template>
  </VideoUploader>
</template>
```

### TypeSelector 组件

视频类型选择组件。

#### Props

| 参数       | 类型                 | 默认值  | 说明           |
| ---------- | -------------------- | ------- | -------------- |
| modelValue | 'human' \| 'archery' | 'human' | 当前选中的类型 |

#### Events

| 事件名            | 参数         | 说明           |
| ----------------- | ------------ | -------------- |
| update:modelValue | type: string | 类型变化时触发 |

#### 示例

```vue
<template>
  <TypeSelector v-model="videoType" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { TypeSelector } from '@/modules/video/upload'

const videoType = ref<'human' | 'archery'>('human')
</script>
```

## 📚 API文档

### uploadVideo

上传视频分片。

```typescript
interface UploadVideoParams {
  uploadId: string // 上传ID
  chunkIndex: number // 分片索引
  chunk: Blob // 分片数据
}

async function uploadVideo(params: UploadVideoParams): Promise<void>
```

### initUpload

初始化上传。

```typescript
interface InitUploadParams {
  fileName: string // 文件名
  fileSize: number // 文件大小
  fileType: string // 文件类型
  videoType: 'human' | 'archery' // 视频类型
}

interface InitUploadResult {
  uploadId: string // 上传ID
  chunkSize: number // 分片大小
}

async function initUpload(params: InitUploadParams): Promise<InitUploadResult>
```

### completeUpload

完成上传。

```typescript
interface CompleteUploadResult {
  videoId: string // 视频ID
  url: string // 视频URL
  duration: number // 视频时长
}

async function completeUpload(uploadId: string): Promise<CompleteUploadResult>
```

### cancelUpload

取消上传。

```typescript
async function cancelUpload(uploadId: string): Promise<void>
```

## ⚙️ 配置说明

### 上传配置

在 `uploadTypes.ts` 中可以配置上传参数：

```typescript
export const UPLOAD_CONFIG = {
  // 分片大小（5MB）
  CHUNK_SIZE: 5 * 1024 * 1024,

  // 最大文件大小（512MB）
  MAX_FILE_SIZE: 512 * 1024 * 1024,

  // 并发上传数量
  CONCURRENT_UPLOADS: 3,

  // 重试次数
  MAX_RETRIES: 3,

  // 支持的文件类型
  ALLOWED_TYPES: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'],

  // 上传超时时间（毫秒）
  TIMEOUT: 60000,
}
```

### API配置

在 `uploadApi.ts` 中配置API地址：

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export const UPLOAD_ENDPOINTS = {
  INIT: `${API_BASE_URL}/upload/init`,
  UPLOAD: `${API_BASE_URL}/upload/chunk`,
  COMPLETE: `${API_BASE_URL}/upload/complete`,
  CANCEL: `${API_BASE_URL}/upload/cancel`,
}
```

## ❓ 常见问题

### 1. 上传失败怎么办？

**问题**: 上传过程中出现错误

**解决方案**:

- 检查网络连接
- 确认文件大小不超过512MB
- 确认文件类型为支持的视频格式
- 查看浏览器控制台错误信息
- 检查后端服务是否正常

### 2. 如何修改最大文件大小？

```typescript
// 在组件中设置
<VideoUploader :max-size="1024 * 1024 * 1024" />  // 1GB

// 或修改配置文件
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 1024 * 1024 * 1024  // 1GB
}
```

### 3. 如何支持更多视频格式？

```typescript
// 修改配置文件
export const UPLOAD_CONFIG = {
  ALLOWED_TYPES: [
    'video/mp4',
    'video/avi',
    'video/mov',
    'video/wmv',
    'video/flv', // 新增
    'video/mkv', // 新增
  ],
}
```

### 4. 断点续传如何实现？

当前版本支持基础断点续传（网络中断后自动继续），但刷新页面后的持久化续传功能待实现。

计划实现方案：

- 使用 IndexedDB 存储上传状态
- 记录已上传的分片信息
- 页面加载时检查未完成的上传
- 提供恢复上传的选项

### 5. 如何自定义上传UI？

```vue
<template>
  <VideoUploader>
    <!-- 自定义触发按钮 -->
    <template #trigger>
      <button class="my-button">
        <i class="icon-upload"></i>
        选择视频
      </button>
    </template>

    <!-- 自定义进度显示 -->
    <template #progress="{ progress, speed, remaining }">
      <div class="my-progress">
        <div class="progress-bar" :style="{ width: progress + '%' }"></div>
        <div class="progress-info">
          <span>{{ progress }}%</span>
          <span>{{ speed }}</span>
          <span>剩余 {{ remaining }}</span>
        </div>
      </div>
    </template>
  </VideoUploader>
</template>
```

### 6. 如何处理上传错误？

```vue
<script setup lang="ts">
import { ElMessage } from 'element-plus'

function handleError(error: Error) {
  // 根据错误类型显示不同提示
  if (error.message.includes('size')) {
    ElMessage.error('文件太大，请选择小于512MB的视频')
  } else if (error.message.includes('type')) {
    ElMessage.error('不支持的文件类型，请选择视频文件')
  } else if (error.message.includes('network')) {
    ElMessage.error('网络错误，请检查网络连接')
  } else {
    ElMessage.error('上传失败，请重试')
  }

  // 记录错误日志
  console.error('Upload error:', error)
}
</script>
```

## 🧪 测试

### 运行测试

```bash
# 运行单元测试
pnpm vitest run src/__tests__/modules/video/

# 运行集成测试
pnpm test:integration

# 查看测试覆盖率
pnpm test:unit --coverage
```

### 测试覆盖

- ✅ 组件渲染测试
- ✅ 文件选择测试
- ✅ 上传逻辑测试
- ✅ 进度更新测试
- ✅ 错误处理测试
- ✅ API交互测试

## 📝 变更日志

查看 [CHANGELOG.md](./CHANGELOG.md) 了解详细的版本变更记录。

## 🔗 相关文档

- [视频上传文档](../../../../doc/video-upload/)
- [API文档](../../../../doc/api/)
- [核心模块文档](../../../core/README.md)
- [项目文档](../../../../README.md)

## 🤝 贡献指南

1. 遵循项目编码规范
2. 编写单元测试
3. 更新相关文档
4. 提交Pull Request

## 📄 许可证

本项目采用 MIT 许可证

---

**维护者**: 前端开发团队
**最后更新**: 2026-01-10
**版本**: 1.0.0
````
