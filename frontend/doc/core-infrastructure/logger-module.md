# 日志模块设计文档

## 📋 概述

日志模块（`@/core/logger`）提供统一的日志记录功能，支持结构化日志、敏感信息脱敏、多目标输出、环境配置等特性。

## 🎯 设计目标

1. **统一日志接口**: 提供统一的日志记录API，替代分散的 `console.log` 调用
2. **结构化日志**: 支持结构化日志格式，便于日志分析和查询
3. **敏感信息保护**: 自动脱敏敏感信息，确保日志安全
4. **灵活配置**: 支持通过环境变量灵活配置日志行为
5. **多目标输出**: 支持控制台、远程服务、文件等多种输出方式
6. **性能优化**: 日志记录不影响主业务流程性能

## 📁 模块结构

```text
src/core/logger/
├── types.ts          # 类型定义
├── config.ts         # 配置管理
├── appenders.ts      # 输出器实现
├── logger.ts         # 日志记录器核心
└── index.ts          # 统一导出
```

## 🔧 核心组件

### 1. 日志级别（LogLevel）

```typescript
enum LogLevel {
  DEBUG = 0, // 调试信息
  INFO = 1, // 一般信息
  WARN = 2, // 警告
  ERROR = 3, // 错误
  FATAL = 4, // 致命错误
}
```

### 2. 日志上下文（LogContext）

```typescript
interface LogContext {
  module?: string // 模块名称
  function?: string // 功能名称
  userId?: string // 用户ID
  requestId?: string // 请求ID
  sessionId?: string // 会话ID
  tags?: string[] // 自定义标签
  [key: string]: unknown
}
```

### 3. 日志条目（LogEntry）

```typescript
interface LogEntry {
  timestamp: string // ISO 8601时间戳
  level: LogLevel // 日志级别
  levelName: string // 日志级别名称
  message: string // 日志消息
  context?: LogContext // 上下文信息
  error?: Error // 错误对象
  data?: unknown // 额外数据
  env?: {
    // 环境信息
    mode: string
    version?: string
  }
}
```

## 📝 使用方法

### 基础使用

```typescript
import { logger } from '@/core/logger'

// 记录调试日志
logger.debug('调试信息', {
  context: {
    module: 'api',
    function: 'getUserInfo',
  },
  data: {
    userId: 123,
  },
})

// 记录信息日志
logger.info('用户登录', {
  context: {
    module: 'api',
    function: 'userLogin',
  },
  data: {
    username: 'zhangsan',
  },
})

// 记录警告日志
logger.warn('API业务错误', {
  context: {
    module: 'api',
    function: 'response.interceptor',
  },
  data: {
    code: 400,
    message: '请求参数错误',
  },
})

// 记录错误日志
logger.error('网络请求失败', {
  context: {
    module: 'api',
    function: 'response.errorHandler',
  },
  error: new Error('Network error'),
  data: {
    url: '/api/user/info',
  },
})
```

### 创建子日志记录器

```typescript
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

### 便捷函数

```typescript
import { debug, info, warn, error, fatal } from '@/core/logger'

// 直接使用便捷函数
debug('调试信息', { context: { module: 'test' } })
info('一般信息', { context: { module: 'test' } })
warn('警告信息', { context: { module: 'test' } })
error('错误信息', { context: { module: 'test' } })
fatal('致命错误', { context: { module: 'test' } })
```

## ⚙️ 配置说明

### 环境变量配置

在 `.env.dev`、`.env.test`、`.env.prod` 文件中配置：

```bash
# 日志级别：DEBUG | INFO | WARN | ERROR | FATAL
VITE_LOG_LEVEL=DEBUG

# 是否启用日志
VITE_LOG_ENABLED=true

# 是否启用敏感信息脱敏
VITE_LOG_ENABLE_MASKING=true

# 日志输出目标：console,remote,file,custom（多个用逗号分隔）
VITE_LOG_TARGETS=console

# 是否在开发环境输出到控制台
VITE_LOG_ENABLE_CONSOLE_IN_DEV=true

# 是否在生产环境输出到控制台
VITE_LOG_ENABLE_CONSOLE_IN_PROD=false

# 远程日志服务URL（如果使用remote目标）
VITE_LOG_REMOTE_URL=https://log.example.com/api/logs

# 是否启用性能监控日志
VITE_LOG_ENABLE_PERFORMANCE=false
```

### 默认配置

| 环境     | 日志级别 | 控制台输出 | 说明                             |
| -------- | -------- | ---------- | -------------------------------- |
| 开发环境 | DEBUG    | 是         | 记录所有日志，便于调试           |
| 测试环境 | INFO     | 是         | 记录关键信息，过滤调试日志       |
| 生产环境 | WARN     | 否         | 仅记录警告和错误，不输出到控制台 |

## 🔒 敏感信息保护

日志模块自动对以下类型的敏感信息进行脱敏：

- **密码**: `password`、`pwd`、`pass` 等字段
- **Token**: `token`、`accessToken`、`refreshToken` 等字段
- **手机号**: 自动脱敏为 `138****8000` 格式
- **邮箱**: 自动脱敏为 `abc***@example.com` 格式
- **身份证号**: 自动脱敏中间部分

### 自定义脱敏

```typescript
// 跳过脱敏（谨慎使用）
logger.info('敏感信息', {
  data: {
    password: 'plaintext',
  },
  skipMasking: true, // 跳过脱敏
})
```

## 📤 输出目标

### 1. 控制台输出（console）

默认输出到浏览器控制台，支持不同日志级别的颜色区分。

### 2. 远程输出（remote）

将日志发送到远程日志服务，支持批量发送和自动重试。

```bash
# 配置远程日志服务
VITE_LOG_TARGETS=remote
VITE_LOG_REMOTE_URL=https://log.example.com/api/logs
```

### 3. 文件输出（file）

将日志写入本地文件（需要自定义实现）。

### 4. 自定义输出（custom）

通过 `LoggerConfig.appenders` 配置自定义输出器。

```typescript
import { Logger, type LogAppender, type LogEntry } from '@/core/logger'

class CustomAppender implements LogAppender {
  name = 'custom'

  append(entry: LogEntry): void {
    // 自定义输出逻辑
  }
}

// 使用自定义输出器
logger.updateConfig({
  appenders: [new CustomAppender()],
})
```

## 📊 日志格式

### 控制台输出格式

```text
[INFO] [2026-01-10T12:00:00.000Z] [api] [userLogin] 用户登录 { context: { userId: '123' }, data: { username: 'zhangsan' } }
```

### 结构化JSON格式（远程输出）

```json
{
  "timestamp": "2026-01-10T12:00:00.000Z",
  "level": 1,
  "levelName": "INFO",
  "message": "用户登录",
  "context": {
    "module": "api",
    "function": "userLogin",
    "userId": "123"
  },
  "data": {
    "username": "zhangsan"
  },
  "env": {
    "mode": "development"
  }
}
```

## 🔍 日志记录位置

### API请求模块

- **请求拦截器**: 记录请求发起、Token添加、CSRF Token添加等
- **响应拦截器**: 记录响应成功、业务错误、HTTP错误等
- **错误处理**: 记录网络错误、配置错误等
- **重试机制**: 记录重试次数、重试延迟等

### 用户API模块

- **用户注册**: 记录注册请求、注册成功/失败
- **用户登录**: 记录登录请求、登录成功/失败
- **获取用户信息**: 记录查询请求、查询成功/失败
- **用户退出**: 记录退出请求、退出成功/失败
- **修改密码**: 记录修改请求、修改成功/失败
- **更新用户信息**: 记录更新请求、更新成功/失败

### 射箭分析API模块

- **获取统计数据**: 记录查询请求、查询成功/失败
- **上传射箭视频**: 记录上传请求、上传成功/失败
- **获取分析详情**: 记录查询请求、查询成功/失败

### 视频上传API模块

- **分片上传**: 记录每个分片的上传请求、上传成功/失败
- **文件校验**: 记录校验请求、校验结果
- **保存视频类型**: 记录保存请求、保存成功/失败

## 📚 最佳实践

### 1. 日志级别选择

- **DEBUG**: 用于开发调试，记录详细的执行流程
- **INFO**: 用于记录关键业务操作（登录、注册、数据修改等）
- **WARN**: 用于记录业务错误（API返回非200、数据校验失败等）
- **ERROR**: 用于记录系统错误（网络错误、配置错误等）
- **FATAL**: 用于记录致命错误（导致系统无法继续运行的错误）

### 2. 上下文信息

始终提供足够的上下文信息，便于问题定位：

```typescript
logger.error('API请求失败', {
  context: {
    module: 'api', // 模块名称
    function: 'getUserInfo', // 功能名称
    requestId: 'req-123', // 请求ID（用于关联多个日志）
  },
  error: error, // 错误对象
  data: {
    // 相关数据
    url: '/api/user/info',
    method: 'GET',
  },
})
```

### 3. 敏感信息处理

不要手动脱敏，让日志模块自动处理：

```typescript
// ✅ 正确：让日志模块自动脱敏
logger.info('用户登录', {
  data: {
    username: 'zhangsan',
    password: 'plaintext', // 会自动脱敏
  },
})

// ❌ 错误：手动脱敏（可能导致遗漏）
logger.info('用户登录', {
  data: {
    username: 'zhangsan',
    password: '****', // 不应该手动脱敏
  },
})
```

### 4. 性能考虑

- 日志记录是异步的，不会阻塞主业务流程
- 生产环境默认不输出DEBUG日志，减少性能开销
- 远程日志采用批量发送，减少网络请求

## 🔗 相关文档

- [环境变量配置指南](../api/env-config-guide.md)
- [API文档](../api/openapi.yaml)
- [敏感信息保护工具](../../src/utils/sensitive.ts)
