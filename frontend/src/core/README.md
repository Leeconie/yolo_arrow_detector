# 核心模块 (Core)

> 项目核心基础设施模块，提供统一的API请求、日志记录、错误处理、性能监控等基础能力

[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-blue.svg)](https://www.typescriptlang.org/)
[![Vue](https://img.shields.io/badge/Vue-3.4+-green.svg)](https://vuejs.org/)
[![Test Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen.svg)](./coverage)

## 📋 目录

- [概述](#概述)
- [模块结构](#模块结构)
- [快速开始](#快速开始)
- [核心功能](#核心功能)
- [最佳实践](#最佳实践)
- [API文档](#api文档)
- [变更日志](#变更日志)

## 🎯 概述

核心模块是整个应用的基础设施层，提供以下核心能力：

- 🌐 **统一API请求** - 封装HTTP请求，支持拦截器、重试、缓存等
- 📝 **日志系统** - 多级别日志记录，支持多种输出方式
- 🛡️ **错误处理** - 全局错误捕获和用户友好的错误提示
- 📊 **性能监控** - Web Vitals指标监控和性能分析
- ⚙️ **配置管理** - 统一的环境变量和常量管理
- 🔒 **安全防护** - CSRF防护、Token管理、请求签名

## 📁 模块结构

```text
core/
├── api/                    # API请求模块
│   ├── request.ts          # 核心请求封装
│   ├── request-queue.ts    # 请求队列管理
│   ├── token-refresh.ts    # Token自动刷新
│   ├── csrf.ts             # CSRF防护
│   ├── cache.ts            # 请求缓存
│   ├── performance-monitor.ts  # 性能监控
│   ├── error-response.ts   # 错误响应格式化
│   ├── user-friendly-errors.ts # 友好错误消息
│   ├── user.ts             # 用户API
│   ├── archery.ts          # 射箭分析API
│   └── types.ts            # 类型定义
├── logger/                 # 日志模块
│   ├── logger.ts           # 核心日志记录器
│   ├── appenders.ts        # 日志输出器
│   ├── config.ts           # 日志配置
│   ├── types.ts            # 类型定义
│   ├── index.ts            # 模块导出
│   └── README.md           # 日志模块文档
├── error/                  # 错误处理模块
│   ├── ErrorBoundary.vue   # 错误边界组件
│   └── global-error-handler.ts  # 全局错误处理
├── performance/            # 性能监控模块
│   └── web-vitals.ts       # Web Vitals监控
├── config/                 # 配置模块
│   ├── env.ts              # 环境变量
│   ├── constants.ts        # 常量定义
│   └── index.ts            # 模块导出
├── constants/              # 常量定义（待整合）
├── README.md               # 本文档
└── CHANGELOG.md            # 变更日志
```

## 🚀 快速开始

### 安装依赖

核心模块作为项目基础设施，无需单独安装，随项目一起安装：

```bash
pnpm install
```

### 基础使用

#### 1. API请求

```typescript
import { request } from '@/core/api'

// GET请求
const user = await request.get('/api/users/123')

// POST请求
const result = await request.post('/api/users', {
  name: '张三',
  email: 'zhangsan@example.com',
})

// 带配置的请求
const data = await request.get('/api/data', {
  params: { page: 1, size: 10 },
  timeout: 5000,
  cache: true, // 启用缓存
})
```

#### 2. 日志记录

```typescript
import { logger } from '@/core/logger'

// 基础日志
logger.info('用户登录成功', { userId: 123 })
logger.warn('API响应较慢', { duration: 3000 })
logger.error('请求失败', { error: err })

// 带上下文的日志
logger.info('处理订单', {
  context: { module: 'order', function: 'processOrder' },
  data: { orderId: 'ORD-001', amount: 99.99 },
})

// 性能日志
logger.performance('页面加载', 1234)
```

#### 3. 错误处理

```typescript
import { ErrorBoundary } from '@/core/error'

// 在Vue组件中使用
<template>
  <ErrorBoundary>
    <YourComponent />
  </ErrorBoundary>
</template>

// 全局错误处理（已自动配置）
// 在main.ts中已集成
```

#### 4. 性能监控

```typescript
import { initWebVitals } from '@/core/performance/web-vitals'

// 初始化Web Vitals监控
initWebVitals((metric) => {
  console.log(`${metric.name}: ${metric.value}`)
  // 上报到监控平台
})
```

## 🔧 核心功能

### API模块

#### 请求拦截器

```typescript
// 请求拦截器（自动添加Token）
request.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器（自动处理错误）
request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // 自动处理401、403等错误
    return Promise.reject(error)
  },
)
```

#### 请求队列

```typescript
import { RequestQueue } from '@/core/api/request-queue'

const queue = new RequestQueue({ concurrency: 3 })

// 添加请求到队列
const result = await queue.add(() => request.get('/api/data'))
```

#### Token自动刷新

```typescript
// 自动检测Token过期并刷新
// 无需手动处理，已集成到请求拦截器
```

#### CSRF防护

```typescript
// 自动添加CSRF Token
// 已集成到请求拦截器，无需手动处理
```

#### 请求缓存

```typescript
// 启用缓存
const data = await request.get('/api/data', {
  cache: true,
  cacheTime: 60000, // 缓存60秒
})

// 清除缓存
import { clearCache } from '@/core/api/cache'
clearCache('/api/data')
```

### 日志模块

#### 日志级别

- **DEBUG**: 详细的调试信息
- **INFO**: 一般信息
- **WARN**: 警告信息
- **ERROR**: 错误信息

#### 日志输出器

```typescript
import { logger, ConsoleAppender, FileAppender } from '@/core/logger'

// 添加控制台输出
logger.addAppender(new ConsoleAppender())

// 添加文件输出（需要后端支持）
logger.addAppender(
  new FileAppender({
    filename: 'app.log',
    maxSize: 10 * 1024 * 1024, // 10MB
  }),
)
```

#### 日志配置

```typescript
import { LoggerConfig } from '@/core/logger'

LoggerConfig.setLevel('INFO') // 设置日志级别
LoggerConfig.setEnabled(true) // 启用/禁用日志
```

### 错误处理

#### 错误边界

```vue
<template>
  <ErrorBoundary @error="handleError">
    <template #error="{ error, reset }">
      <div class="error-view">
        <h2>出错了</h2>
        <p>{{ error.message }}</p>
        <button @click="reset">重试</button>
      </div>
    </template>
    <YourComponent />
  </ErrorBoundary>
</template>
```

#### 全局错误处理

```typescript
// 已在main.ts中配置
import { setupGlobalErrorHandler } from '@/core/error/global-error-handler'

setupGlobalErrorHandler(app)
```

### 性能监控

#### Web Vitals指标

```typescript
import { initWebVitals } from '@/core/performance/web-vitals'

initWebVitals((metric) => {
  // LCP - Largest Contentful Paint
  // FID - First Input Delay
  // CLS - Cumulative Layout Shift
  // TTI - Time to Interactive
  // TBT - Total Blocking Time

  console.log(`${metric.name}: ${metric.value}`)
})
```

## 💡 最佳实践

### API请求

1. **统一使用request实例**

```typescript
// ✅ 推荐
import { request } from '@/core/api'
const data = await request.get('/api/users')

// ❌ 不推荐
import axios from 'axios'
const data = await axios.get('/api/users')
```

1. **使用TypeScript类型**

```typescript
// ✅ 推荐
interface User {
  id: number
  name: string
}

const user = await request.get<User>('/api/users/123')

// ❌ 不推荐
const user = await request.get('/api/users/123') // any类型
```

1. **合理使用缓存**

```typescript
// ✅ 推荐 - 对不常变化的数据使用缓存
const config = await request.get('/api/config', { cache: true })

// ❌ 不推荐 - 对实时数据使用缓存
const balance = await request.get('/api/balance', { cache: true })
```

### 日志记录

1. **选择合适的日志级别**

```typescript
// ✅ 推荐
logger.debug('详细的调试信息') // 仅开发环境
logger.info('用户登录') // 重要操作
logger.warn('API响应慢') // 潜在问题
logger.error('请求失败', { error }) // 错误信息

// ❌ 不推荐
logger.info('进入函数') // 过于详细
logger.error('用户点击按钮') // 级别不当
```

1. **提供足够的上下文**

```typescript
// ✅ 推荐
logger.info('处理订单', {
  context: { module: 'order', function: 'process' },
  data: { orderId: 'ORD-001', userId: 123 },
})

// ❌ 不推荐
logger.info('处理订单') // 缺少上下文
```

1. **避免敏感信息**

```typescript
// ✅ 推荐
logger.info('用户登录', { userId: 123 })

// ❌ 不推荐
logger.info('用户登录', { password: '123456' }) // 泄露密码
```

### 错误处理

1. **使用错误边界包裹关键组件**

```vue
<!-- ✅ 推荐 -->
<ErrorBoundary>
  <CriticalComponent />
</ErrorBoundary>

<!-- ❌ 不推荐 -->
<CriticalComponent />
<!-- 错误会导致整个应用崩溃 -->
```

1. **提供友好的错误提示**

```typescript
// ✅ 推荐
import { getUserFriendlyError } from '@/core/api/user-friendly-errors'

try {
  await request.post('/api/data', data)
} catch (error) {
  const message = getUserFriendlyError(error)
  ElMessage.error(message)  // "网络连接失败，请检查网络"
}

// ❌ 不推荐
catch (error) {
  ElMessage.error(error.message)  // "Network Error"
}
```

## 📚 API文档

详细的API文档请参考：

- [日志模块文档](./logger/README.md)
- [API请求文档](../../doc/core-infrastructure/api/)
- [错误处理文档](../../doc/core-infrastructure/error-handling.md)
- [性能监控文档](../../doc/core-infrastructure/performance-monitoring.md)

## 🧪 测试

### 运行测试

```bash
# 运行所有测试
pnpm test:unit

# 运行核心模块测试
pnpm vitest run src/__tests__/core/

# 查看测试覆盖率
pnpm test:unit --coverage
```

### 测试覆盖率

| 模块     | 覆盖率 | 状态    |
| -------- | ------ | ------- |
| API模块  | 88%    | ✅ 优秀 |
| 日志模块 | 92%    | ✅ 优秀 |
| 错误处理 | 85%    | ✅ 良好 |
| 性能监控 | 80%    | ✅ 良好 |
| 配置模块 | 95%    | ✅ 优秀 |

## 📝 变更日志

查看 [CHANGELOG.md](./CHANGELOG.md) 了解详细的版本变更记录。

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
**版本**: 2.0.0
````
