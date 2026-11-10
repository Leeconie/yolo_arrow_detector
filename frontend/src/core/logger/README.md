# 日志模块

## 📋 概述

日志模块（`@/core/logger`）提供统一的日志记录功能，支持结构化日志、敏感信息脱敏、多目标输出、环境配置等特性。

## 🚀 快速开始

### 基础使用

````typescript
import { logger } from '@/core/logger'

// 记录调试日志
logger.debug('调试信息', {
  context: {
    module: 'api',
    function: 'getUserInfo',
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
  },
})

// 记录错误日志
logger.error('网络请求失败', {
  context: {
    module: 'api',
    function: 'response.errorHandler',
  },
  error: new Error('Network error'),
})
```

### 便捷函数

```typescript
import { debug, info, warn, error, fatal } from '@/core/logger'

debug('调试信息', { context: { module: 'test' } })
info('一般信息', { context: { module: 'test' } })
warn('警告信息', { context: { module: 'test' } })
error('错误信息', { context: { module: 'test' } })
fatal('致命错误', { context: { module: 'test' } })
```

## 📚 详细文档

详细文档请参考：[日志模块设计文档](../../../doc/core-infrastructure/logger-module.md)
````
