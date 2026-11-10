# API使用示例文档

本文档提供核心基础设施模块API的详细使用示例，包括请求取消、请求重试、Mock服务、性能优化、错误处理、认证设置等功能的使用方法。

## 目录

- [基础使用](#基础使用)
- [请求取消](#请求取消)
- [请求重试](#请求重试)
- [性能优化功能](#性能优化功能)
  - [请求缓存](#请求缓存)
  - [请求并发控制](#请求并发控制)
  - [性能监控](#性能监控)
- [错误处理](#错误处理)
- [认证设置](#认证设置)
- [Mock服务配置](#mock服务配置)
- [高级用法](#高级用法)

## 基础使用

### GET请求

```typescript
import { get } from '@/core/api/request'

// 基本用法
const userInfo = await get<UserInfo>('/api/user/info', { id: 1 })

// 带超时配置
const data = await get<ResponseData>('/api/data', { page: 1 }, {
  timeout: 5000
})
```

### POST请求

```typescript
import { post } from '@/core/api/request'

// 基本用法
const result = await post<CreateResult>('/api/user', {
  name: 'John',
  email: 'john@example.com'
})

// 带超时配置
const data = await post<ResponseData>('/api/data', requestData, {
  timeout: 10000
})
```

### PUT请求

```typescript
import { put } from '@/core/api/request'

const result = await put<UpdateResult>('/api/user/1', {
  name: 'John Updated'
})
```

### DELETE请求

```typescript
import { del } from '@/core/api/request'

const result = await del<DeleteResult>('/api/user/1')
```

## 请求取消

使用`AbortController`可以取消正在进行的请求，适用于以下场景：

- 组件卸载时取消未完成的请求
- 用户操作导致需要取消当前请求
- 防止重复请求

### 基本用法

```typescript
import { get, createAbortController } from '@/core/api/request'

// 创建取消控制器
const controller = createAbortController()

// 发起请求，传入signal
const promise = get<UserInfo>('/api/user/info', { id: 1 }, {
  signal: controller.signal
})

// 取消请求
controller.abort()

// 处理取消后的Promise
try {
  const result = await promise
} catch (error) {
  if (error.code === 'ERR_CANCELED') {
    console.log('请求已取消')
  }
}
```

### 在Vue组件中使用

```vue
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { get, createAbortController } from '@/core/api/request'

let controller: AbortController | null = null

onMounted(async () => {
  controller = createAbortController()
  
  try {
    const data = await get('/api/data', {}, {
      signal: controller.signal
    })
    // 处理数据
  } catch (error) {
    if (error.code !== 'ERR_CANCELED') {
      // 处理其他错误
    }
  }
})

onUnmounted(() => {
  // 组件卸载时取消请求
  if (controller) {
    controller.abort()
  }
})
</script>
```

### 取消多个请求

```typescript
import { get, createAbortController } from '@/core/api/request'

const controller = createAbortController()

// 同时发起多个请求
const promise1 = get('/api/data1', {}, { signal: controller.signal })
const promise2 = get('/api/data2', {}, { signal: controller.signal })
const promise3 = get('/api/data3', {}, { signal: controller.signal })

// 取消所有请求
controller.abort()

// 所有Promise都会被拒绝
await Promise.allSettled([promise1, promise2, promise3])
```

## 请求重试

请求封装支持自动重试机制，当遇到以下错误时会自动重试：

- 网络错误（无响应）
- 5xx服务器错误
- 408请求超时错误

### 基本用法

```typescript
import { get } from '@/core/api/request'

// 使用默认重试次数（3次）
const data = await get<ResponseData>('/api/data', { page: 1 })

// 自定义重试次数
const result = await get<ResponseData>('/api/data', { page: 1 }, {
  retryCount: 5  // 最多重试5次
})

// 禁用重试
const data = await get<ResponseData>('/api/data', { page: 1 }, {
  skipRetry: true
})
```

### 重试策略

重试机制使用指数退避算法：

- 第1次重试延迟：1000ms (2^0 * 1000)
- 第2次重试延迟：2000ms (2^1 * 1000)
- 第3次重试延迟：4000ms (2^2 * 1000)
- 最大延迟：30000ms

```typescript
import { get } from '@/core/api/request'

// 重试过程示例
try {
  const data = await get('/api/data', {}, {
    retryCount: 3
  })
} catch (error) {
  // 如果所有重试都失败，会抛出最后一次的错误
  console.error('请求失败，已重试3次', error)
}
```

### 重试与取消结合

```typescript
import { get, createAbortController } from '@/core/api/request'

const controller = createAbortController()

const promise = get('/api/data', {}, {
  signal: controller.signal,
  retryCount: 3
})

// 如果请求被取消，不会进行重试
controller.abort()
```

## Mock服务配置

### 概述

项目支持使用 Apifox Mock 服务进行接口模拟，**仅在开发环境和测试环境启用**，生产环境强制禁用。

Mock服务支持两种模式：

- **云端Mock**：部署在 Apifox 服务器上，无需本地Apifox客户端运行
- **本地Mock**：与Apifox客户端一起安装的本地服务器，需要Apifox客户端运行

参考文档：

- [Apifox Mock 文档](https://docs.apifox.com/mock)
- [Apifox 云端 Mock 文档](https://docs.apifox.com/cloud-mock)
- [Apifox 智能 Mock 文档](https://docs.apifox.com/smart-mock)

### 环境变量配置

在`.env`文件中配置以下环境变量：

```bash
# ==================== Mock服务基础配置 ====================
# 是否启用Mock服务（仅在开发/测试环境有效，生产环境强制禁用）
# 可选值：true | false
# 默认值：开发/测试环境为true，生产环境为false
VITE_ENABLE_MOCK=true

# Mock服务类型：cloud（云端）或 local（本地）
# 可选值：cloud | local
# 默认值：cloud
VITE_APIFOX_MOCK_TYPE=cloud

# ==================== 云端Mock配置 ====================
# 云端Mock服务基础URL
# 格式：https://mock.apifox.cn/m1/{项目ID}-{版本编号}-{服务编号}
# 或：https://m1.apifoxmock.com/m1/{项目ID}-{版本编号}-{服务编号}
# 默认值：https://m1.apifoxmock.com/m1/7676691-7418764-6917011
VITE_APIFOX_MOCK_CLOUD_URL=https://m1.apifoxmock.com/m1/7676691-7418764-6917011

# 云端Mock Token（仅在启用Token鉴权时需要）
# 从Apifox项目设置中获取
VITE_APIFOX_TOKEN=your_token_here

# 是否启用云端Mock Token鉴权
# 可选值：true | false
# 默认值：false（关闭Token鉴权）
VITE_ENABLE_MOCK_TOKEN_AUTH=false

# ==================== 本地Mock配置 ====================
# 本地Mock服务基础URL
# 格式：http://127.0.0.1:4523/m1/{项目ID}-{版本编号}-{服务编号}
# 默认值：http://127.0.0.1:4523/m1/7676691-7418764-6917011
# 注意：本地Mock需要Apifox客户端运行
VITE_APIFOX_MOCK_LOCAL_URL=http://127.0.0.1:4523/m1/7676691-7418764-6917011

# ==================== 生产环境API配置 ====================
# 生产环境API基础URL（Mock服务禁用时使用）
VITE_API_BASE_URL=/api
```

### 环境说明

| 环境 | Mock服务 | 说明 |
|------|---------|------|
| 开发环境 (development) | 默认启用 | 支持云端/本地切换，用于前端开发 |
| 测试环境 (test) | 默认启用 | 支持云端/本地切换，用于接口测试 |
| 生产环境 (production) | 强制禁用 | 使用实际后端API，不启用Mock服务 |

### 使用说明

启用Mock服务后，所有API请求会自动：

1. 将请求URL重定向到Apifox Mock服务地址（根据`VITE_APIFOX_MOCK_TYPE`选择云端或本地）
2. 如果使用云端Mock且启用了Token鉴权（`VITE_ENABLE_MOCK_TOKEN_AUTH=true`），在请求头中添加`apifoxToken`进行鉴权

```typescript
import { get } from '@/core/api/request'

// 当VITE_ENABLE_MOCK=true时，此请求会自动使用Mock服务
// 根据VITE_APIFOX_MOCK_TYPE选择云端或本地Mock
const data = await get('/user/info')
```

### Mock服务地址

#### 云端Mock地址

- **路径模式**：`https://mock.apifox.cn/m1/{项目ID}-{版本编号}-{服务编号}/{接口路径}`
- **ID模式**：`https://mock.apifox.cn/m2/{项目ID}-{版本编号}-{服务编号}/{接口ID}`
- **当前项目地址**：`https://m1.apifoxmock.com/m1/7676691-7418764-6917011`

#### 本地Mock地址

- **路径模式**：`http://127.0.0.1:4523/m1/{项目ID}-{版本编号}-{服务编号}/{接口路径}`
- **ID模式**：`http://127.0.0.1:4523/m2/{项目ID}-{版本编号}-{服务编号}/{接口ID}`
- **当前项目地址**：`http://127.0.0.1:4523/m1/7676691-7418764-6917011`

**注意**：

- 本地Mock需要Apifox客户端运行
- 如需其他设备访问，将IP替换为本机局域网地址
- 检查防火墙或端口`4523`是否被拦截

### 鉴权方式

根据 [Apifox 云端 Mock 文档](https://docs.apifox.com/cloud-mock)，Token鉴权**仅适用于云端Mock**，本地Mock不需要Token。

#### 配置步骤

1. **在Apifox中配置Token鉴权**：
   - 进入 "项目设置 -> 功能设置 -> Mock 设置"
   - 将访问权限设置为 "Token 鉴权" 或 "无鉴权"

1. **在环境变量中配置**：

   ```bash
   # 启用Token鉴权
   VITE_ENABLE_MOCK_TOKEN_AUTH=true
   
   # 配置Token（从Apifox项目设置中获取）
   VITE_APIFOX_TOKEN=your_token_here
   ```

#### 使用说明

- **关闭Token鉴权（默认）**：设置 `VITE_ENABLE_MOCK_TOKEN_AUTH=false` 或不设置
- **开启Token鉴权**：设置 `VITE_ENABLE_MOCK_TOKEN_AUTH=true` 并配置 `VITE_APIFOX_TOKEN`
- **本地Mock**：不需要Token，Token鉴权配置无效

Mock服务使用Header方式传递Token（最安全、最灵活）：

```http
apifoxToken: your_token_here
```

### 使用场景

#### 开发环境

- **使用Mock服务**：前端开发时，后端接口尚未开发完成
- **测试后端API**：设置 `VITE_ENABLE_MOCK=false`，直接调用后端API进行联调
- **切换Mock类型**：通过 `VITE_APIFOX_MOCK_TYPE` 在云端/本地之间切换

#### 测试环境

- **使用Mock服务**：自动化测试时，使用Mock数据作为数据源
- **测试数据隔离**：避免使用生产数据，确保测试环境数据安全

#### 生产环境

- **强制禁用Mock**：生产环境不允许使用Mock服务
- **使用实际API**：所有请求直接调用生产环境后端API

## 高级用法

### 组合使用多个功能

```typescript
import { get, createAbortController } from '@/core/api/request'

const controller = createAbortController()

try {
  const data = await get<ResponseData>('/api/data', { page: 1 }, {
    signal: controller.signal,  // 支持取消
    retryCount: 3,               // 支持重试
    timeout: 10000              // 超时设置
  })
  
  // 处理数据
} catch (error) {
  if (error.code === 'ERR_CANCELED') {
    console.log('请求已取消')
  } else {
    console.error('请求失败', error)
  }
} finally {
  // 清理资源
  controller.abort()
}
```

### 错误处理

```typescript
import { get } from '@/core/api/request'

try {
  const data = await get('/api/data')
} catch (error) {
  // 网络错误（会自动重试）
  if (!error.response) {
    console.error('网络错误', error)
  }
  // 服务器错误（5xx会自动重试）
  else if (error.response.status >= 500) {
    console.error('服务器错误', error)
  }
  // 客户端错误（4xx不会重试）
  else if (error.response.status >= 400) {
    console.error('客户端错误', error)
  }
}
```

## 性能优化功能

### 请求缓存

GET请求默认启用缓存，提升响应速度和减少服务器压力。

#### 基本用法

```typescript
import { get } from '@/core/api/request'

// 第一次请求，会发送网络请求并缓存结果
const userInfo1 = await get<UserInfo>('/api/user/info', { id: 1 })

// 第二次请求，直接返回缓存数据，不会发送网络请求
const userInfo2 = await get<UserInfo>('/api/user/info', { id: 1 })
// userInfo1 === userInfo2（相同的数据）
```

#### 跳过缓存（强制刷新）

```typescript
import { get } from '@/core/api/request'

// 跳过缓存，强制从服务器获取最新数据
const freshData = await get<UserInfo>('/api/user/info', { id: 1 }, {
  skipCache: true
})
```

#### 缓存配置

缓存使用LRU（最近最少使用）策略：
- 默认缓存时间：5分钟
- 最大缓存数量：100条
- 支持TTL（Time-To-Live）过期策略
- 支持版本控制，API版本更新时自动失效相关缓存

### 请求并发控制

所有请求都支持并发控制和优先级处理。

#### 基本用法

```typescript
import { get, post, RequestPriority } from '@/core/api/request'

// 普通优先级请求（默认）
const normalData = await get('/api/data', { page: 1 })

// 高优先级请求（优先处理）
const urgentData = await get('/api/urgent', {}, {
  priority: RequestPriority.HIGH  // 或使用数字 1
})
```

#### 请求去重

相同请求在时间窗口内（默认1000ms）只发送一次：

```typescript
import { get } from '@/core/api/request'

// 同时发起多个相同请求
const promise1 = get('/api/data', { id: 1 })
const promise2 = get('/api/data', { id: 1 })
const promise3 = get('/api/data', { id: 1 })

// 实际上只会发送一次网络请求，所有Promise都会得到相同的结果
const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3])
```

#### 并发控制配置

- 默认最大并发数：10
- 高优先级请求优先处理
- 支持请求去重（相同请求在时间窗口内只发送一次）

### 性能监控

所有请求都自动进行性能监控。

#### 获取性能指标

```typescript
import { defaultPerformanceMonitor } from '@/core/api/performance-monitor'

// 获取性能指标
const metrics = defaultPerformanceMonitor.getMetrics()

console.log('平均请求耗时:', metrics.averageRequestTime, 'ms')
console.log('缓存命中率:', metrics.cacheHitRate * 100, '%')
console.log('总请求数:', metrics.totalRequests)
console.log('成功请求数:', metrics.successfulRequests)
console.log('失败请求数:', metrics.failedRequests)
```

#### 查看请求耗时详情

```typescript
import { defaultPerformanceMonitor } from '@/core/api/performance-monitor'

const metrics = defaultPerformanceMonitor.getMetrics()

// 查看最近的请求耗时
metrics.requestTimings.forEach(timing => {
  console.log(`请求 ${timing.url} 总耗时: ${timing.totalTime}ms`)
  console.log(`  - 拦截器耗时: ${timing.interceptorTime}ms`)
  console.log(`  - 网络请求耗时: ${timing.networkTime}ms`)
  console.log(`  - 响应处理耗时: ${timing.responseTime}ms`)
})
```

## 错误处理

### 网络错误处理

```typescript
import { get } from '@/core/api/request'
import { getNetworkErrorType, getNetworkErrorMessage, NetworkErrorType } from '@/core/api/error-messages'

try {
  const data = await get('/api/data')
} catch (error) {
  // 判断网络错误类型
  if (!error.response) {
    const errorType = getNetworkErrorType(error)
    const errorMessage = getNetworkErrorMessage(errorType)
    
    switch (errorType) {
      case NetworkErrorType.OFFLINE:
        console.error('网络已断开:', errorMessage)
        // 提示用户检查网络连接
        break
      case NetworkErrorType.TIMEOUT:
        console.error('请求超时:', errorMessage)
        // 提示用户稍后重试
        break
      case NetworkErrorType.DNS_FAILED:
        console.error('DNS解析失败:', errorMessage)
        // 提示用户检查网络设置
        break
      case NetworkErrorType.CONNECTION_REFUSED:
        console.error('连接被拒绝:', errorMessage)
        // 提示用户稍后重试
        break
      default:
        console.error('未知网络错误:', errorMessage)
    }
  }
}
```

### 业务错误处理

```typescript
import { get } from '@/core/api/request'
import { ErrorCode } from '@/types/api'
import { getBusinessErrorMessage } from '@/core/api/error-messages'

try {
  const data = await get('/api/data')
} catch (error) {
  if (error.response) {
    const { code, message } = error.response.data
    
    // 处理业务错误
    switch (code) {
      case ErrorCode.UNAUTHORIZED:
        // 401: 未授权，自动跳转登录页
        console.error('登录已过期，请重新登录')
        // 跳转到登录页
        break
      case ErrorCode.FORBIDDEN:
        // 403: 无权限
        console.error('您没有权限访问该资源')
        break
      case ErrorCode.NOT_FOUND:
        // 404: 资源不存在
        console.error('请求的资源不存在')
        break
      default:
        // 其他业务错误
        const errorMessage = getBusinessErrorMessage(code, message)
        console.error('业务错误:', errorMessage)
    }
  }
}
```

### 错误重试示例

```typescript
import { get } from '@/core/api/request'

try {
  // 网络错误会自动重试（默认3次）
  const data = await get('/api/data', {}, {
    retryCount: 5  // 最多重试5次
  })
} catch (error) {
  // 如果所有重试都失败，会抛出最后一次的错误
  console.error('请求失败，已重试5次', error)
  
  // 可以在这里进行降级处理
  // 例如：使用缓存数据、显示错误提示等
}
```

### 完整错误处理示例

```typescript
import { get } from '@/core/api/request'
import { ErrorCode } from '@/types/api'
import { getNetworkErrorType, getNetworkErrorMessage, getBusinessErrorMessage } from '@/core/api/error-messages'

async function fetchDataWithErrorHandling() {
  try {
    const data = await get('/api/data', {}, {
      retryCount: 3,
      timeout: 10000
    })
    return data
  } catch (error) {
    // 网络错误
    if (!error.response) {
      const errorType = getNetworkErrorType(error)
      const errorMessage = getNetworkErrorMessage(errorType)
      console.error('网络错误:', errorMessage)
      // 可以在这里进行降级处理
      return null
    }
    
    // HTTP错误
    const status = error.response.status
    const { code, message } = error.response.data || {}
    
    // 业务错误
    if (code) {
      const errorMessage = getBusinessErrorMessage(code, message)
      console.error('业务错误:', errorMessage)
      
      // 根据错误码进行不同处理
      if (code === ErrorCode.UNAUTHORIZED) {
        // 跳转登录页
        window.location.href = '/login'
      } else if (code === ErrorCode.FORBIDDEN) {
        // 显示权限不足提示
        alert('您没有权限访问该资源')
      }
    } else {
      // HTTP状态码错误
      console.error(`HTTP错误 (${status}):`, message || '请求失败')
    }
    
    throw error
  }
}
```

## 认证设置

### Token认证

Token通过请求拦截器自动添加到请求头中，无需手动设置。

#### Token获取和存储

```typescript
import { useUserStore } from '@/stores/modules/user'

const userStore = useUserStore()

// 设置Token（登录后）
userStore.setToken('your-jwt-token')

// Token会自动存储在localStorage中
// 请求拦截器会自动从localStorage读取Token并添加到请求头
```

#### Token刷新机制

Token即将过期时（剩余时间<5分钟），会自动刷新Token：

```typescript
import { checkAndRefreshToken } from '@/core/api/token-refresh'

// Token刷新是自动的，无需手动调用
// 请求拦截器会自动检测Token过期时间并刷新

// 如果需要手动刷新Token
try {
  await checkAndRefreshToken()
} catch (error) {
  // Token刷新失败，跳转登录页
  window.location.href = '/login'
}
```

#### Token过期处理

当Token过期时，响应拦截器会自动处理：

```typescript
// Token过期时，响应拦截器会自动：
// 1. 清除Token
// 2. 跳转到登录页
// 3. 显示"登录已过期，请重新登录"提示

// 无需手动处理，系统会自动处理
```

### CSRF防护

CSRF Token会自动生成并添加到需要防护的请求（POST、PUT、DELETE）中。

#### CSRF Token生成

```typescript
import { getCsrfToken } from '@/core/api/csrf'

// CSRF Token会自动生成并缓存
// 首次请求时会自动生成，后续请求会使用缓存的Token

// 如果需要手动获取CSRF Token
const csrfToken = await getCsrfToken()
```

#### CSRF Token使用

CSRF Token会自动添加到请求头中：

```typescript
import { post } from '@/core/api/request'

// POST请求会自动添加CSRF Token
// 无需手动设置，请求拦截器会自动处理
const result = await post('/api/user', {
  name: 'John',
  email: 'john@example.com'
})

// 请求头会自动包含：
// X-CSRF-Token: <csrf-token>
```

#### CSRF Token刷新

CSRF Token有效期1小时，过期后会自动刷新：

```typescript
// CSRF Token刷新是自动的，无需手动处理
// 请求拦截器会自动检测Token过期时间并刷新
```

### 认证流程

#### 登录流程

```typescript
import { post } from '@/core/api/request'
import { useUserStore } from '@/stores/modules/user'

async function login(username: string, password: string) {
  try {
    // 1. 发送登录请求
    const response = await post<{ token: string; userInfo: UserInfo }>('/api/login', {
      username,
      password
    })
    
    // 2. 保存Token和用户信息
    const userStore = useUserStore()
    userStore.setToken(response.data.token)
    userStore.setUserInfo(response.data.userInfo)
    
    // 3. Token会自动缓存，后续请求会自动使用
    return response.data
  } catch (error) {
    console.error('登录失败', error)
    throw error
  }
}
```

#### Token刷新流程

```typescript
// Token刷新是自动的，流程如下：
// 1. 请求拦截器检测Token过期时间
// 2. 如果剩余时间<5分钟，自动调用刷新接口
// 3. 刷新成功后，更新Token
// 4. 刷新失败时，清除Token并跳转登录页

// 无需手动处理，系统会自动处理
```

#### 登出流程

```typescript
import { useUserStore } from '@/stores/modules/user'

function logout() {
  const userStore = useUserStore()
  
  // 1. 清除Token和用户信息
  userStore.clearToken()
  userStore.clearUserInfo()
  
  // 2. 跳转到登录页
  window.location.href = '/login'
}
```

### 安全注意事项

1. **Token安全存储**：
   - Token存储在localStorage中，注意XSS防护
   - 不要将Token暴露在URL中
   - 不要在日志中输出Token

1. **XSS防护**：
   - 使用DOMPurify对用户输入进行清理
   - 使用`safeLog`函数记录日志，自动脱敏敏感信息

1. **敏感信息保护**：
   - 使用`mask`函数对敏感信息进行脱敏
   - 使用`safeLog`函数记录日志，自动脱敏Token、手机号、邮箱等

详细安全规范请参考：[认证设置指南](./authentication.md)

### 请求配置选项

```typescript
interface RequestConfig {
  /** 请求超时时间（毫秒） */
  timeout?: number
  /** 是否显示加载提示 */
  showLoading?: boolean
  /** 是否显示错误提示 */
  showError?: boolean
  /** 请求重试次数（0表示不重试） */
  retryCount?: number
  /** 请求取消信号 */
  signal?: AbortSignal
  /** 是否跳过重试（用于某些特殊场景） */
  skipRetry?: boolean
  /** 是否跳过缓存（用于强制刷新，仅对GET请求有效） */
  skipCache?: boolean
  /** 请求优先级（1=高优先级，2=普通优先级） */
  priority?: number
}
```

## SDK使用示例

### TypeScript使用示例

```typescript
import { get, post, put, del as delete, RequestPriority } from '@/core/api/request'
import type { ApiResponse, RequestConfig } from '@/types/api'

// 定义响应数据类型
interface UserInfo {
  id: number
  name: string
  email: string
}

// GET请求
const userInfo = await get<UserInfo>('/api/user/info', { id: 1 })

// POST请求
const newUser = await post<UserInfo>('/api/user', {
  name: 'John',
  email: 'john@example.com'
})

// PUT请求
const updatedUser = await put<UserInfo>('/api/user/1', {
  name: 'John Updated'
})

// DELETE请求
await delete('/api/user/1')
```

### JavaScript使用示例

```javascript
import { get, post, put, del as delete } from '@/core/api/request'

// GET请求
const userInfo = await get('/api/user/info', { id: 1 })

// POST请求
const newUser = await post('/api/user', {
  name: 'John',
  email: 'john@example.com'
})

// PUT请求
const updatedUser = await put('/api/user/1', {
  name: 'John Updated'
})

// DELETE请求
await delete('/api/user/1')
```

### Vue组件中使用示例

```vue
<template>
  <div>
    <button @click="fetchUserInfo">获取用户信息</button>
    <button @click="createUser">创建用户</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { get, post, createAbortController, RequestPriority } from '@/core/api/request'
import type { UserInfo } from '@/types/user'

const userInfo = ref<UserInfo | null>(null)
let controller: AbortController | null = null

async function fetchUserInfo() {
  controller = createAbortController()
  
  try {
    const data = await get<UserInfo>('/api/user/info', { id: 1 }, {
      signal: controller.signal,
      priority: RequestPriority.HIGH
    })
    userInfo.value = data
  } catch (error) {
    if (error.code !== 'ERR_CANCELED') {
      console.error('获取用户信息失败', error)
    }
  }
}

async function createUser() {
  try {
    const newUser = await post<UserInfo>('/api/user', {
      name: 'John',
      email: 'john@example.com'
    }, {
      priority: RequestPriority.HIGH
    })
    userInfo.value = newUser
  } catch (error) {
    console.error('创建用户失败', error)
  }
}

onUnmounted(() => {
  if (controller) {
    controller.abort()
  }
})
</script>
```

## 注意事项

1. **请求取消**：取消的请求不会触发重试机制
2. **重试条件**：只有网络错误、5xx错误、408超时错误会触发重试
3. **Mock服务**：仅在开发环境（`VITE_ENABLE_MOCK=true`）时生效
4. **Token安全**：Mock Token通过Header传递，确保安全性
5. **资源清理**：组件卸载时记得取消未完成的请求，避免内存泄漏
6. **缓存使用**：GET请求默认启用缓存，使用`skipCache: true`强制刷新
7. **优先级设置**：关键操作（如登录、支付）建议使用高优先级
8. **性能监控**：定期查看性能指标，优化慢请求

## 相关文档

- [API文档](./openapi.yaml)
- [错误代码参考](./error-codes.md)
- [认证设置指南](./authentication.md)
- [核心基础设施开发指南](../guide.md)
- [TODO清单](../todo.md)
