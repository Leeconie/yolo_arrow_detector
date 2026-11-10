# 视频上传API文档

## 概述

视频上传模块提供完整的文件上传和管理API，支持分片上传、格式验证、进度监控等功能。

## 核心API接口

### 文件上传接口

#### POST /api/archery/upload

上传视频文件到服务器进行分析。

**请求参数**:

```typescript
interface UploadRequest {
  file: File // 视频文件
  type: 'target' | 'pose' // 视频类型：箭靶视频或人体姿态视频
}
```

**响应格式**:

```typescript
interface UploadResponse {
  code: number
  message: string
  data: {
    taskId: string // 分析任务ID
    status: 'pending' | 'processing' | 'completed' | 'failed'
    progress: number // 处理进度 (0-100)
  }
}
```

**使用示例**:

```typescript
// 上传箭靶视频
const targetFormData = new FormData()
targetFormData.append('file', targetVideoFile)
targetFormData.append('type', 'target')

const targetResponse = await fetch('/api/archery/upload', {
  method: 'POST',
  body: targetFormData,
})

// 上传人体姿态视频
const poseFormData = new FormData()
poseFormData.append('file', poseVideoFile)
poseFormData.append('type', 'pose')

const poseResponse = await fetch('/api/archery/upload', {
  method: 'POST',
  body: poseFormData,
})
```

### 分析状态查询

#### GET /api/archery/analysis/{taskId}

查询视频分析任务的处理状态。

**响应格式**:

```typescript
interface AnalysisStatusResponse {
  code: number
  message: string
  data: {
    taskId: string
    status: 'pending' | 'processing' | 'completed' | 'failed'
    progress: number
    result?: AnalysisResult // 分析完成时返回结果
    error?: string // 失败时返回错误信息
  }
}
```

### 分析结果获取

#### GET /api/archery/result/{taskId}

获取完整的视频分析结果。

**响应格式**:

```typescript
interface AnalysisResult {
  taskId: string
  overallScore: number // 总体评分 (0-100)
  stabilityScore: number // 稳定性评分
  precisionScore: number // 精准度评分
  techniqueScore: number // 技术规范评分
  hitPoints: HitPoint[] // 命中点数据
  trajectory: TrajectoryPoint[] // 轨迹数据
  recommendations: string[] // 改进建议
  completedAt: string // 完成时间
}
```

## 错误处理

### 常见错误码

| 错误码 | 说明           | 处理建议                               |
| ------ | -------------- | -------------------------------------- |
| 4001   | 文件格式不支持 | 检查文件格式，仅支持MP4、AVI、MOV、MKV |
| 4002   | 文件大小超限   | 压缩文件或分片上传，最大512MB          |
| 4003   | 文件损坏       | 检查文件完整性，重新录制               |
| 5001   | 服务器处理失败 | 稍后重试，如持续失败联系技术支持       |
| 5002   | 分析超时       | 文件可能过大，建议分割处理             |

### 错误响应格式

```typescript
interface ErrorResponse {
  code: number
  message: string
  details?: {
    field: string // 错误字段
    reason: string // 错误原因
    suggestion: string // 建议解决方案
  }
}
```

## 浏览器兼容性

### 文件选择支持

| 浏览器      | accept属性支持 | 推荐配置                                 |
| ----------- | -------------- | ---------------------------------------- |
| Chrome 90+  | 完全支持       | `accept="video/mp4,video/avi,.mp4,.avi"` |
| Firefox 88+ | 扩展名优先     | `accept=".mp4,.avi,.mov,.mkv,video/*"`   |
| Safari 14+  | MIME类型优先   | `accept="video/mp4,video/quicktime"`     |
| Edge 90+    | 完全支持       | 同Chrome                                 |

### 上传限制

- **文件大小**: 最大512MB
- **支持格式**: MP4、AVI、MOV、MKV
- **网络要求**: 稳定的网络连接，支持断点续传

## 最佳实践

### 1. 文件预处理

```typescript
// 客户端文件验证
function validateVideoFile(file: File): boolean {
  // 格式检查
  const allowedTypes = ['video/mp4', 'video/avi', 'video/quicktime']
  const allowedExtensions = ['.mp4', '.avi', '.mov', '.mkv']

  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
  const isValidType = allowedTypes.includes(file.type) || allowedExtensions.includes(extension)
  const isValidSize = file.size <= 512 * 1024 * 1024 // 512MB

  return isValidType && isValidSize
}
```

### 2. 上传进度监控

```typescript
// 进度监听
const xhr = new XMLHttpRequest()

xhr.upload.addEventListener('progress', (event) => {
  if (event.lengthComputable) {
    const percentComplete = (event.loaded / event.total) * 100
    console.log(`上传进度: ${percentComplete}%`)
  }
})
```

### 3. 错误重试机制

```typescript
// 自动重试逻辑
async function uploadWithRetry(file: File, maxRetries = 3): Promise<UploadResponse> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await uploadFile(file)
      return response
    } catch (error) {
      if (attempt === maxRetries) throw error

      // 指数退避重试
      const delay = Math.pow(2, attempt) * 1000
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
}
```

## 故障排除

### 文件不显示在选择器中

**问题**: 点击文件选择按钮，只看到部分格式的文件

**解决方案**:

1. 检查浏览器版本，确保支持现代文件API
2. 尝试手动选择"All Files"(_._)
3. 确认文件扩展名正确(.mp4, .avi, .mov, .mkv)
4. 在移动设备上可能需要额外的权限设置

### 上传失败

**问题**: 文件上传过程中失败

**排查步骤**:

1. 检查网络连接稳定性
2. 确认文件未损坏
3. 查看浏览器控制台错误信息
4. 检查服务器状态和API可用性

### 分析结果异常

**问题**: 分析完成后结果不准确

**排查步骤**:

1. 确保视频质量清晰，光线充足
2. 检查视频角度是否正确
3. 确认箭靶和人体在画面中清晰可见
4. 查看具体的错误信息和建议

## 更新日志

- **v1.2.0** (2026-01-11): 修复文件格式过滤和状态同步问题，提升浏览器兼容性
- **v1.2.0** (2026-01-11): 前端UI修复完成 - 按钮状态同步和类型安全
- **v1.1.0** (2026-01-10): 添加分片上传和断点续传功能
- **v1.0.0** (2026-01-09): 基础上传功能实现

---

**API版本**: v1.2.0
**最后更新**: 2026-01-11
**维护者**: HeZaoCha
