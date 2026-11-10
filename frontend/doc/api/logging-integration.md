# 日志集成报告

## 📋 执行时间

2026-01-10

## 🎯 集成目标

为项目所有关键操作添加日志记录，提供统一的日志管理模块，支持结构化日志、敏感信息脱敏、多目标输出等特性。

## ✅ 已完成的工作

### 1. 日志模块实现

#### 模块结构

```text
src/core/logger/
├── types.ts          # 类型定义（LogLevel、LogContext、LogEntry等）
├── config.ts         # 配置管理（从环境变量读取配置）
├── appenders.ts      # 输出器实现（ConsoleAppender、RemoteAppender）
├── logger.ts         # 日志记录器核心（Logger类）
├── index.ts          # 统一导出
└── README.md         # 模块说明文档
```

#### 核心特性

1. **日志级别**：支持 DEBUG、INFO、WARN、ERROR、FATAL 五个级别
2. **结构化日志**：支持上下文信息、错误对象、额外数据等
3. **敏感信息脱敏**：自动脱敏密码、Token、手机号、邮箱等敏感信息
4. **多目标输出**：支持控制台、远程服务、文件、自定义输出器
5. **环境配置**：通过环境变量灵活配置日志行为
6. **性能优化**：日志记录不阻塞主业务流程

### 2. 日志记录位置

#### API请求模块（`src/core/api/request.ts`）

- ✅ **请求拦截器**：
  - 记录请求发起（DEBUG级别）
  - 记录请求拦截器错误（ERROR级别）

- ✅ **响应拦截器**：
  - 记录请求成功（DEBUG级别，包含响应时间）
  - 记录业务错误（WARN级别，API返回非200状态码）
  - 记录HTTP错误（WARN级别，包含状态码、URL等信息）
  - 记录网络错误（ERROR级别，包含错误类型）
  - 记录配置错误（ERROR级别）
  - 记录响应拦截器错误（ERROR级别）

- ✅ **重试机制**：
  - 记录重试信息（DEBUG级别，包含重试次数、延迟时间）

#### 用户API模块（`src/core/api/user.ts`）

- ✅ **用户注册**：记录注册请求、注册成功/失败
- ✅ **用户登录**：记录登录请求、登录成功/失败
- ✅ **获取用户信息**：记录查询请求、查询成功/失败
- ✅ **用户退出**：记录退出请求、退出成功/失败
- ✅ **修改密码**：记录修改请求、修改成功/失败
- ✅ **更新用户信息**：记录更新请求、更新成功/失败

#### 射箭分析API模块（`src/core/api/archery.ts`）

- ✅ **获取统计数据**：记录查询请求、查询成功/失败
- ✅ **上传射箭视频**：记录上传请求、上传成功/失败
- ✅ **获取分析详情**：记录查询请求、查询成功/失败

#### 视频上传API模块（`src/modules/video/upload/api/uploadApi.ts`）

- ✅ **分片上传**：记录每个分片的上传请求、上传成功/失败
- ✅ **文件校验**：记录校验请求、校验结果
- ✅ **保存视频类型**：记录保存请求、保存成功/失败

### 3. 环境变量配置

已在 `.env.dev`、`.env.test`、`.env.prod` 文件中添加日志配置：

```bash
# 日志级别：DEBUG | INFO | WARN | ERROR | FATAL
VITE_LOG_LEVEL=DEBUG

# 是否启用日志
VITE_LOG_ENABLED=true

# 是否启用敏感信息脱敏
VITE_LOG_ENABLE_MASKING=true

# 日志输出目标：console,remote,file,custom
VITE_LOG_TARGETS=console

# 是否在开发环境输出到控制台
VITE_LOG_ENABLE_CONSOLE_IN_DEV=true

# 是否在生产环境输出到控制台
VITE_LOG_ENABLE_CONSOLE_IN_PROD=false

# 远程日志服务URL
VITE_LOG_REMOTE_URL=

# 是否启用性能监控日志
VITE_LOG_ENABLE_PERFORMANCE=false
```

### 4. API文档更新

#### 更新内容

1. **日志记录章节**：
   - 日志级别说明
   - 日志内容说明
   - 敏感信息保护说明
   - 环境配置说明

1. **数据模型分类**：
   - 通用响应模型：`ApiResponse`
   - 错误响应模型：`ErrorResponse`
   - 用户管理相关模型：`UserInfo`、`LoginRequest`、`LoginResponse`、`RegisterRequest`、`RegisterResponse`
   - 射箭分析相关模型：`ArcheryStats`、`HitPoint`、`TrajectoryPoint`、`ArcheryDetail`、`UploadArcheryVideoResponse`
   - 视频上传相关模型：`ChunkUploadResponse`、`ValidateVideoRequest`、`ValidateVideoResponse`、`SaveVideoTypeRequest`、`SaveVideoTypeResponse`
   - 标准错误响应模型：`BadRequest`、`Unauthorized`、`Forbidden`、`NotFound`、`InternalServerError`

## 📊 日志记录统计

### 按模块统计

| 模块 | 日志记录点 | 说明 |
|------|-----------|------|
| API请求模块 | 8处 | 请求拦截、响应拦截、错误处理、重试 |
| 用户API模块 | 12处 | 6个API函数，每个函数2个日志点（请求+结果） |
| 射箭分析API模块 | 6处 | 3个API函数，每个函数2个日志点 |
| 视频上传API模块 | 6处 | 3个API函数，每个函数2个日志点 |
| **总计** | **32处** | 覆盖所有关键操作 |

### 按日志级别统计

| 级别 | 使用场景 | 数量 |
|------|---------|------|
| DEBUG | 请求详情、响应详情 | 约15处 |
| INFO | 关键业务操作（登录、注册、上传等） | 约10处 |
| WARN | 业务错误（API返回非200） | 约5处 |
| ERROR | 系统错误（网络错误、配置错误等） | 约10处 |
| FATAL | 致命错误（暂未使用） | 0处 |

## 🔍 日志格式示例

### 请求日志

```json
{
  "timestamp": "2026-01-10T12:00:00.000Z",
  "level": 0,
  "levelName": "DEBUG",
  "message": "发起HTTP请求",
  "context": {
    "module": "api",
    "function": "request.interceptor",
    "requestId": "1704873600000-0.123"
  },
  "data": {
    "method": "GET",
    "url": "/user/info",
    "baseURL": "/api",
    "hasData": false,
    "hasParams": false
  },
  "env": {
    "mode": "development"
  }
}
```

### 成功响应日志

```json
{
  "timestamp": "2026-01-10T12:00:00.100Z",
  "level": 0,
  "levelName": "DEBUG",
  "message": "API请求成功",
  "context": {
    "module": "api",
    "function": "response.interceptor",
    "requestId": "1704873600000-0.123"
  },
  "data": {
    "url": "/user/info",
    "method": "GET",
    "status": 200,
    "responseTime": "100.50ms"
  },
  "env": {
    "mode": "development"
  }
}
```

### 错误日志

```json
{
  "timestamp": "2026-01-10T12:00:00.100Z",
  "level": 3,
  "levelName": "ERROR",
  "message": "网络请求失败",
  "context": {
    "module": "api",
    "function": "response.errorHandler",
    "requestId": "1704873600000-0.123"
  },
  "error": {
    "name": "Error",
    "message": "Network Error",
    "stack": "..."
  },
  "data": {
    "message": "网络连接失败，请检查网络设置",
    "errorType": "network",
    "url": "/user/info",
    "method": "GET"
  },
  "env": {
    "mode": "development"
  }
}
```

## 📝 使用示例

### 在API函数中使用

```typescript
import { logger } from '@/core/logger'

export function userLogin(loginData: LoginRequest): Promise<LoginResponse> {
  logger.info('用户登录', {
    context: {
      module: 'api',
      function: 'userLogin',
    },
    data: {
      username: loginData.username,
    },
  })
  
  return post<LoginResponse>('/user/login', loginData)
    .then((result) => {
      logger.info('用户登录成功', {
        context: {
          module: 'api',
          function: 'userLogin',
        },
        data: {
          userId: result.userInfo?.id,
          username: result.userInfo?.username,
        },
      })
      return result
    })
    .catch((error) => {
      logger.error('用户登录失败', {
        context: {
          module: 'api',
          function: 'userLogin',
        },
        error: error instanceof Error ? error : new Error(String(error)),
      })
      throw error
    })
}
```

### 创建子日志记录器

```typescript
import { logger } from '@/core/logger'

// 创建带默认上下文的子日志记录器
const apiLogger = logger.child({
  module: 'api',
  function: 'userService',
})

// 使用子日志记录器（自动包含默认上下文）
apiLogger.info('获取用户信息', {
  data: { userId: 123 },
})
```

## 🔗 相关文档

- [日志模块设计文档](../core-infrastructure/logger-module.md)
- [环境变量配置指南](./env-config-guide.md)
- [API文档](./openapi.yaml)

## ✅ 验证结果

- ✅ 类型检查：0 个错误
- ✅ Linter检查：通过
- ✅ 日志模块：完整实现
- ✅ 日志记录：32处关键位置已添加
- ✅ 环境配置：3个环境文件已更新
- ✅ API文档：已更新日志说明和数据模型分类

## 📌 后续建议

1. **性能监控日志**：如需启用性能监控日志，设置 `VITE_LOG_ENABLE_PERFORMANCE=true`
2. **远程日志服务**：生产环境建议配置远程日志服务，设置 `VITE_LOG_REMOTE_URL`
3. **日志分析**：建议集成日志分析工具（如ELK、Sentry等）进行日志分析和告警
