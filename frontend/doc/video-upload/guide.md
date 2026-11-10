# 视频上传与类型选择模块开发文档

## 一、模块概述

### 1.1 功能描述

视频上传与类型选择模块负责实现视频文件的上传、格式校验、类型选择等功能。支持分片上传、断点续传、上传进度实时展示，以及视频类型（运动人体视频/射箭视频）的选择。

### 1.2 适用场景

- 用户上传视频文件
- 视频格式和大小校验
- 选择视频分析类型
- 上传进度监控

### 1.3 技术栈版本

- **Vue**: 3.5.26
- **Element Plus**: 2.13.0
- **Axios**: 1.13.2
- **Pinia**: 3.0.4

## 二、目录结构

本模块创建的目录和文件：

```text
src/modules/video/upload/
├── page/
│   └── UploadPage.vue          # 视频上传页面
├── components/
│   ├── VideoUploader.vue       # 视频上传组件
│   └── TypeSelector.vue        # 类型选择组件
├── composables/
│   └── useVideoUpload.ts       # 视频上传组合式函数
├── api/
│   └── uploadApi.ts            # 上传相关API接口
└── types/
    └── uploadTypes.ts          # 上传相关类型定义
```

## 三、技术实现

### 3.1 分片上传逻辑

- 分片大小：5MB（CHUNK_SIZE常量）
- 分片上传：通过Axios实现，每个分片独立上传
- 进度计算：已上传分片数 / 总分片数 * 100%
- 断点续传：通过localStorage存储已上传分片信息

### 3.2 上传进度管理

- 使用uploadStore存储上传进度（0-100%）
- 实时更新进度条显示
- 上传完成后隐藏进度条

### 3.3 类型选择

- 使用RadioGroup组件实现单选
- 选择结果存入playStore.videoType
- 确认后调用/video/saveType接口保存关联关系

## 四、接口定义

### 4.1 上传接口

- **POST** `/api/video/upload`
- 参数：FormData（包含分片文件、videoId、chunkIndex、totalChunks）
- 响应：UploadResponse

### 4.2 校验接口

- **POST** `/api/video/validate`
- 参数：{fileName, fileSize, fileType}
- 响应：{valid: boolean, message: string}

### 4.3 保存类型接口

- **POST** `/api/video/saveType`
- 参数：{videoId, videoType}
- 响应：{success: boolean}

## 五、组件说明

### 5.1 UploadPage.vue

**Props**: 无

**Events**: 无

**功能**: 视频上传主页面，包含上传组件、类型选择、确认按钮

### 5.2 VideoUploader.vue

**Props**:

- `accept`: string - 接受的文件类型（默认：'video/mp4,video/avi'）
- `maxSize`: number - 最大文件大小（默认：200MB）

**Events**:

- `upload-success`: (videoId: string) => void - 上传成功事件
- `upload-error`: (error: Error) => void - 上传失败事件

**功能**: 视频上传组件，支持拖拽上传、分片上传、进度显示

### 5.3 TypeSelector.vue

**Props**:

- `modelValue`: VideoType | null - 选中的视频类型

**Events**:

- `update:modelValue`: (type: VideoType) => void - 类型变更事件

**功能**: 视频类型选择组件

## 六、开发要点

### 6.1 注意事项

1. 文件校验需在上传前完成，避免无效上传
2. 分片上传需处理网络错误，实现自动重试（最多3次）
3. 断点续传需在localStorage中存储分片信息
4. 上传完成后需清理临时数据

### 6.2 避免冲突的规范

1. 本模块目录为模块私有，其他开发者禁止修改
2. 组件命名使用模块前缀（VideoUploader、TypeSelector）
3. API接口封装在模块内，不直接暴露给其他模块

## 七、测试要求

- 单元测试：测试分片上传逻辑、进度计算、错误处理
- 集成测试：测试完整上传流程、类型选择流程

## 八、依赖关系

- 依赖core模块：使用uploadStore、playStore、request工具函数、类型定义
