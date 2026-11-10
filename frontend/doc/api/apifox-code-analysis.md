# Apifox 文档与代码对比分析报告

## 📋 执行时间

2026-01-10

## 🔍 分析概述

通过访问 Apifox 文档（<https://hzpp1nxbou.apifox.cn/），对比实际> API 文档与本地代码实现，发现以下问题需要修复。

## ✅ 代码与文档一致性检查

### 1. 接口路径一致性

#### ✅ 所有接口路径正确

从 Apifox 文档检查，所有接口路径都已正确（不包含 `/api` 前缀）：

| 接口         | Apifox路径                 | 代码路径                    | 状态    |
| ------------ | -------------------------- | --------------------------- | ------- |
| 用户注册     | `/user/register`           | `/user/register`            | ✅ 一致 |
| 用户登录     | `/user/login`              | `/user/login`               | ✅ 一致 |
| 获取用户信息 | `/user/info`               | `/user/info`                | ✅ 一致 |
| 用户登出     | `/user/logout`             | `/user/logout`              | ✅ 一致 |
| 修改密码     | `/user/update-pwd`         | `/user/update-pwd`          | ✅ 一致 |
| 更新用户信息 | `/user/update-info`        | `/user/update-info`         | ✅ 一致 |
| 刷新Token    | `/auth/refresh`            | `/auth/refresh`             | ✅ 一致 |
| 获取统计数据 | `/archery/stats`           | `/archery/stats`            | ✅ 一致 |
| 上传射箭视频 | `/archery/upload`          | `/archery/upload`           | ✅ 一致 |
| 获取分析详情 | `/archery/detail/{taskId}` | `/archery/detail/${taskId}` | ✅ 一致 |
| 分片上传视频 | `/video/upload`            | `/video/upload`             | ✅ 一致 |
| 校验视频文件 | `/video/validate`          | `/video/validate`           | ✅ 一致 |
| 保存视频类型 | `/video/saveType`          | `/video/saveType`           | ✅ 一致 |

### 2. 请求参数一致性

#### ✅ 所有请求参数正确

从 Apifox 文档检查，所有请求参数定义与代码实现一致：

- **用户注册**：`nickname`, `username`, `password`, `email`(可选), `phone`(可选) ✅
- **用户登录**：`username`, `password`, `captcha`(可选) ✅
- **上传射箭视频**：`archerVideo`, `targetVideo`, `note`(可选) ✅
- **分片上传视频**：`file`, `videoId`, `chunkIndex`, `totalChunks`, `totalSize`, `fileName`, `fileType` ✅

### 3. 响应格式一致性

#### ⚠️ 发现的问题：ApiResponse 的 data 字段类型

**问题描述**：

- 在 Apifox 文档中，`ApiResponse` 的 `data` 字段类型被定义为 `string`
- 这是错误的，因为 `data` 字段应该根据具体接口返回不同的数据类型（object、array等）

**影响范围**：

- 这主要是 Apifox 文档的问题，不影响代码运行
- 但会导致 Mock 数据生成不正确
- 可能影响 API 文档的可读性

**代码中的正确定义**：

```typescript
// src/types/api.ts
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T // 泛型类型，根据具体接口定义
  timestamp?: number
}
```

**建议修复**：
在 Apifox 中更新 `ApiResponse` Schema，将 `data` 字段类型改为：

- 使用 `oneOf` 支持多种类型：`object`, `array`, `string`, `number`, `boolean`, `null`
- 或者使用 `description` 说明：`响应数据，类型根据具体接口而定`

### 4. 文件上传配置一致性

#### ✅ 文件上传配置正确

从 Apifox 文档检查：

- **文件大小限制**：512MB ✅
- **支持格式**：mp4、avi、mov、mkv ✅
- **Content-Type**：multipart/form-data ✅
- **字段名称**：`archerVideo`, `targetVideo`, `file` ✅

### 5. Token 鉴权配置

#### ✅ Token 鉴权配置正确

- **当前状态**：已关闭（默认）✅
- **配置方式**：通过 `VITE_ENABLE_MOCK_TOKEN_AUTH` 环境变量控制 ✅
- **代码实现**：正确，只有当 `ENABLE_MOCK_TOKEN_AUTH=true` 时才添加 Token ✅

## 🔍 发现的问题

### 问题 1：Apifox 文档中 ApiResponse 的 data 字段类型错误

**严重程度**：中等

**问题描述**：

- Apifox 文档中 `ApiResponse` 的 `data` 字段类型为 `string`
- 这会导致 Mock 数据生成不正确
- 影响 API 文档的可读性

**影响范围**：

- Apifox Mock 数据生成
- API 文档可读性
- 不影响代码运行（代码中的类型定义是正确的）

**修复建议**：

1. 在 Apifox 中更新 `ApiResponse` Schema
2. 将 `data` 字段类型改为支持多种类型（object、array、string等）
3. 或者使用 `description` 说明类型根据具体接口而定

### 问题 2：Apifox 文档中 servers 配置为空

**严重程度**：低

**问题描述**：

- Apifox 文档中的 `servers` 配置显示 `url: ''`（空字符串）
- 这可能是 Apifox 的显示问题，不影响实际使用

**影响范围**：

- 仅影响文档显示
- 不影响 Mock 服务使用

**修复建议**：

- 在 Apifox 中配置正确的服务器地址（如果需要）

## ✅ 代码正确性验证

### 1. baseURL 配置

**当前配置**：

```typescript
baseURL: APIFOX_CONFIG.ENABLE_MOCK
  ? APIFOX_CONFIG.MOCK_BASE_URL // https://m1.apifoxmock.com/m1/7676691-7418764-6917011
  : import.meta.env.VITE_API_BASE_URL || '/api'
```

**验证结果**：✅ 正确

- Mock 服务：`https://m1.apifoxmock.com/m1/7676691-7418764-6917011`
- 生产环境：`/api` 或 `VITE_API_BASE_URL`
- 所有 API 路径都不包含 `/api` 前缀，与 baseURL 配置一致

### 2. Token 鉴权配置

**当前配置**：

```typescript
ENABLE_MOCK_TOKEN_AUTH: import.meta.env.VITE_ENABLE_MOCK_TOKEN_AUTH === 'true'
```

**验证结果**：✅ 正确

- 默认值为 `false`（关闭 Token 鉴权）
- 只有当环境变量设置为 `true` 时才启用
- 代码逻辑正确

### 3. FormData 处理

**当前实现**：

```typescript
if (config.data instanceof FormData) {
  delete config.headers['Content-Type']
}
```

**验证结果**：✅ 正确

- 正确处理 FormData，让浏览器自动设置 Content-Type
- 与 Apifox 文档中的 multipart/form-data 要求一致

## 📊 总结

### ✅ 代码实现完全正确

1. **接口路径**：100% 正确，与 Apifox 文档一致
2. **请求参数**：100% 正确，与 Apifox 文档一致
3. **响应格式**：代码中的类型定义正确（Apifox 文档中的类型定义有误）
4. **文件上传**：配置正确，支持 512MB，格式正确
5. **Token 鉴权**：配置正确，已关闭（默认）

### ⚠️ Apifox 文档需要修复

1. **ApiResponse 的 data 字段类型**：需要更新为支持多种类型
2. **servers 配置**：可以配置正确的服务器地址（可选）

### 🎯 结论

**代码实现完全满足系统需求，无需修复。**

Apifox 文档中的 `ApiResponse` 类型定义问题不影响代码运行，但建议在 Apifox 中修复，以便：

1. 生成正确的 Mock 数据
2. 提高 API 文档的可读性
3. 确保文档与代码的一致性

## 📝 建议操作

### 在 Apifox 中修复 ApiResponse Schema

1. 打开 Apifox 项目
2. 找到 `ApiResponse` Schema 定义
3. 将 `data` 字段类型从 `string` 改为：

   ```yaml
   data:
     description: 响应数据，类型根据具体接口而定
     oneOf:
       - type: object
       - type: array
       - type: string
       - type: number
       - type: boolean
       - type: null
   ```

1. 保存并同步文档

### 验证 Mock 服务

1. 确认 Token 鉴权已关闭（当前状态）
2. 测试所有接口的 Mock 响应
3. 验证文件上传接口的 Mock 数据格式

## 🔗 相关文档

- [Apifox 项目文档](https://hzpp1nxbou.apifox.cn/)
- [Apifox 云端 Mock 文档](https://docs.apifox.com/cloud-mock)
- [本地 API 文档](./openapi.yaml)
- [Token 鉴权修复报告](./token-auth-fix.md)
