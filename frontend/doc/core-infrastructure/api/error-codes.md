# 错误代码参考

本文档提供完整的错误代码参考，包括HTTP状态码错误、业务错误码、网络错误类型等，每个错误码都包含错误原因和解决方案。

## 目录

- [HTTP状态码错误](#http状态码错误)
- [业务错误码](#业务错误码)
- [网络错误类型](#网络错误类型)
- [错误处理最佳实践](#错误处理最佳实践)

## HTTP状态码错误

### 400 Bad Request

**错误码值**：400

**错误消息**：请求参数错误，请检查请求参数

**错误原因**：
- 请求参数格式不正确
- 缺少必需的请求参数
- 请求参数类型不匹配
- 请求参数值超出允许范围

**解决方案**：
1. 检查请求参数是否符合API文档要求
2. 确认所有必需参数都已提供
3. 验证参数类型和格式是否正确
4. 检查参数值是否在允许范围内

**使用示例**：

```typescript
import { post } from '@/core/api/request'

try {
  await post('/api/user', {
    name: 'John',
    email: 'invalid-email'  // 邮箱格式错误
  })
} catch (error) {
  if (error.response?.status === 400) {
    console.error('请求参数错误:', error.response.data.message)
    // 提示用户检查输入
  }
}
```

### 401 Unauthorized

**错误码值**：401

**错误消息**：登录已过期，请重新登录

**错误原因**：
- Token无效或已过期
- Token未提供
- Token格式不正确

**解决方案**：
1. 检查Token是否有效
2. 如果Token已过期，重新登录获取新Token
3. 确认Token格式正确（Bearer Token）

**使用示例**：

```typescript
import { get } from '@/core/api/request'
import { ErrorCode } from '@/types/api'

try {
  await get('/api/user/info')
} catch (error) {
  if (error.response?.status === 401 || error.response?.data?.code === ErrorCode.UNAUTHORIZED) {
    // 自动跳转登录页（由响应拦截器处理）
    console.log('Token已过期，请重新登录')
  }
}
```

### 403 Forbidden

**错误码值**：403

**错误消息**：您没有权限访问该资源

**错误原因**：
- 用户没有访问该资源的权限
- 用户角色权限不足
- 资源访问被限制

**解决方案**：
1. 确认用户是否有访问该资源的权限
2. 联系管理员分配相应权限
3. 检查用户角色是否正确

**使用示例**：

```typescript
import { get } from '@/core/api/request'
import { ErrorCode } from '@/types/api'

try {
  await get('/api/admin/users')
} catch (error) {
  if (error.response?.status === 403 || error.response?.data?.code === ErrorCode.FORBIDDEN) {
    console.error('您没有权限访问该资源')
    // 显示权限不足提示
  }
}
```

### 404 Not Found

**错误码值**：404

**错误消息**：请求的资源不存在

**错误原因**：
- 请求的URL路径不存在
- 资源已被删除
- 资源ID不正确

**解决方案**：
1. 检查请求URL是否正确
2. 确认资源是否存在
3. 验证资源ID是否正确

**使用示例**：

```typescript
import { get } from '@/core/api/request'
import { ErrorCode } from '@/types/api'

try {
  await get('/api/user/999')  // 用户不存在
} catch (error) {
  if (error.response?.status === 404 || error.response?.data?.code === ErrorCode.NOT_FOUND) {
    console.error('请求的资源不存在')
    // 显示资源不存在提示
  }
}
```

### 408 Request Timeout

**错误码值**：408

**错误消息**：请求超时，请检查网络连接后重试

**错误原因**：
- 请求超时（超过配置的超时时间）
- 服务器响应时间过长
- 网络连接不稳定

**解决方案**：
1. 检查网络连接是否正常
2. 增加请求超时时间（如果允许）
3. 稍后重试（会自动重试）

**使用示例**：

```typescript
import { get } from '@/core/api/request'
import { ErrorCode } from '@/types/api'

try {
  await get('/api/data', {}, {
    timeout: 5000  // 5秒超时
  })
} catch (error) {
  if (error.response?.status === 408 || error.code === ErrorCode.TIMEOUT) {
    console.error('请求超时，请检查网络连接')
    // 会自动重试（如果配置了retryCount）
  }
}
```

### 500 Internal Server Error

**错误码值**：500

**错误消息**：服务器内部错误，请稍后重试

**错误原因**：
- 服务器内部错误
- 服务器处理异常
- 数据库连接失败

**解决方案**：
1. 稍后重试（会自动重试）
2. 如果问题持续，联系技术支持
3. 检查服务器状态

**使用示例**：

```typescript
import { get } from '@/core/api/request'
import { ErrorCode } from '@/types/api'

try {
  await get('/api/data')
} catch (error) {
  if (error.response?.status === 500 || error.response?.data?.code === ErrorCode.SERVER_ERROR) {
    console.error('服务器内部错误，请稍后重试')
    // 会自动重试（如果配置了retryCount）
  }
}
```

## 业务错误码

### 200 Success

**错误码值**：200

**错误消息**：Success

**说明**：请求成功，无错误

**使用示例**：

```typescript
import { get } from '@/core/api/request'

const response = await get('/api/user/info')
// response.code === 200 表示成功
```

### 0 Network Error

**错误码值**：0

**错误消息**：网络连接失败，请检查网络设置

**错误原因**：
- 网络连接断开
- 无法连接到服务器
- DNS解析失败
- 连接被拒绝

**解决方案**：
1. 检查网络连接是否正常
2. 检查服务器地址是否正确
3. 检查防火墙设置
4. 稍后重试（会自动重试）

**使用示例**：

```typescript
import { get } from '@/core/api/request'
import { ErrorCode, getNetworkErrorType, getNetworkErrorMessage } from '@/core/api/error-messages'

try {
  await get('/api/data')
} catch (error) {
  if (error.code === ErrorCode.NETWORK_ERROR || !error.response) {
    const errorType = getNetworkErrorType(error)
    const errorMessage = getNetworkErrorMessage(errorType)
    console.error('网络错误:', errorMessage)
    // 会自动重试（如果配置了retryCount）
  }
}
```

## 网络错误类型

### OFFLINE - 网络断开

**错误类型**：`NetworkErrorType.OFFLINE`

**错误消息**：网络连接已断开，请检查网络设置后重试

**错误原因**：
- 设备网络连接断开
- WiFi/移动网络未连接
- 网络适配器故障

**解决方案**：
1. 检查设备网络连接状态
2. 重新连接WiFi或移动网络
3. 检查网络适配器设置
4. 重启网络适配器

**使用示例**：

```typescript
import { get } from '@/core/api/request'
import { NetworkErrorType, getNetworkErrorType, getNetworkErrorMessage } from '@/core/api/error-messages'

try {
  await get('/api/data')
} catch (error) {
  if (!error.response) {
    const errorType = getNetworkErrorType(error)
    if (errorType === NetworkErrorType.OFFLINE) {
      const errorMessage = getNetworkErrorMessage(errorType)
      console.error('网络已断开:', errorMessage)
      // 提示用户检查网络连接
    }
  }
}
```

### TIMEOUT - 请求超时

**错误类型**：`NetworkErrorType.TIMEOUT`

**错误消息**：请求超时，请检查网络连接后重试

**错误原因**：
- 请求超时（超过配置的超时时间）
- 服务器响应时间过长
- 网络延迟过高

**解决方案**：
1. 检查网络连接是否正常
2. 增加请求超时时间（如果允许）
3. 稍后重试（会自动重试）

**使用示例**：

```typescript
import { get } from '@/core/api/request'
import { NetworkErrorType, getNetworkErrorType, getNetworkErrorMessage } from '@/core/api/error-messages'

try {
  await get('/api/data', {}, {
    timeout: 10000  // 10秒超时
  })
} catch (error) {
  if (!error.response) {
    const errorType = getNetworkErrorType(error)
    if (errorType === NetworkErrorType.TIMEOUT) {
      const errorMessage = getNetworkErrorMessage(errorType)
      console.error('请求超时:', errorMessage)
      // 提示用户稍后重试
    }
  }
}
```

### DNS_FAILED - DNS解析失败

**错误类型**：`NetworkErrorType.DNS_FAILED`

**错误消息**：无法解析服务器地址，请检查网络设置

**错误原因**：
- DNS服务器无法解析域名
- DNS服务器配置错误
- 域名不存在

**解决方案**：
1. 检查DNS服务器配置
2. 尝试使用其他DNS服务器（如8.8.8.8）
3. 检查域名是否正确
4. 检查网络设置

**使用示例**：

```typescript
import { get } from '@/core/api/request'
import { NetworkErrorType, getNetworkErrorType, getNetworkErrorMessage } from '@/core/api/error-messages'

try {
  await get('/api/data')
} catch (error) {
  if (!error.response) {
    const errorType = getNetworkErrorType(error)
    if (errorType === NetworkErrorType.DNS_FAILED) {
      const errorMessage = getNetworkErrorMessage(errorType)
      console.error('DNS解析失败:', errorMessage)
      // 提示用户检查网络设置
    }
  }
}
```

### CONNECTION_REFUSED - 连接被拒绝

**错误类型**：`NetworkErrorType.CONNECTION_REFUSED`

**错误消息**：服务器连接被拒绝，请稍后重试

**错误原因**：
- 服务器拒绝连接
- 服务器端口未开放
- 防火墙阻止连接

**解决方案**：
1. 检查服务器是否正常运行
2. 检查服务器端口是否开放
3. 检查防火墙设置
4. 稍后重试（会自动重试）

**使用示例**：

```typescript
import { get } from '@/core/api/request'
import { NetworkErrorType, getNetworkErrorType, getNetworkErrorMessage } from '@/core/api/error-messages'

try {
  await get('/api/data')
} catch (error) {
  if (!error.response) {
    const errorType = getNetworkErrorType(error)
    if (errorType === NetworkErrorType.CONNECTION_REFUSED) {
      const errorMessage = getNetworkErrorMessage(errorType)
      console.error('连接被拒绝:', errorMessage)
      // 提示用户稍后重试
    }
  }
}
```

### UNKNOWN - 未知网络错误

**错误类型**：`NetworkErrorType.UNKNOWN`

**错误消息**：网络错误，请检查网络连接

**错误原因**：
- 未知的网络错误
- 无法识别的错误类型

**解决方案**：
1. 检查网络连接是否正常
2. 检查错误详情
3. 稍后重试（会自动重试）
4. 如果问题持续，联系技术支持

**使用示例**：

```typescript
import { get } from '@/core/api/request'
import { NetworkErrorType, getNetworkErrorType, getNetworkErrorMessage } from '@/core/api/error-messages'

try {
  await get('/api/data')
} catch (error) {
  if (!error.response) {
    const errorType = getNetworkErrorType(error)
    const errorMessage = getNetworkErrorMessage(errorType)
    console.error('网络错误:', errorMessage, error)
    // 记录错误详情，便于排查
  }
}
```

## 错误处理最佳实践

### 1. 统一错误处理

```typescript
import { get } from '@/core/api/request'
import { ErrorCode } from '@/types/api'
import { getNetworkErrorType, getNetworkErrorMessage, getBusinessErrorMessage } from '@/core/api/error-messages'

async function handleRequest<T>(requestFn: () => Promise<T>): Promise<T> {
  try {
    return await requestFn()
  } catch (error) {
    // 网络错误
    if (!error.response) {
      const errorType = getNetworkErrorType(error)
      const errorMessage = getNetworkErrorMessage(errorType)
      console.error('网络错误:', errorMessage)
      // 可以在这里进行降级处理
      throw new Error(errorMessage)
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
      
      throw new Error(errorMessage)
    }
    
    // HTTP状态码错误
    console.error(`HTTP错误 (${status}):`, message || '请求失败')
    throw error
  }
}

// 使用示例
const userInfo = await handleRequest(() => get('/api/user/info', { id: 1 }))
```

### 2. 错误重试策略

```typescript
import { get } from '@/core/api/request'

// 自动重试（网络错误、5xx错误、408超时错误会自动重试）
const data = await get('/api/data', {}, {
  retryCount: 3  // 最多重试3次
})

// 手动重试
async function fetchWithRetry<T>(requestFn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn()
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error
      }
      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
  throw new Error('重试失败')
}
```

### 3. 错误日志记录

```typescript
import { safeLog } from '@/utils/sensitive'

try {
  await get('/api/data')
} catch (error) {
  // 使用safeLog自动脱敏敏感信息
  safeLog('请求失败', {
    url: '/api/data',
    error: error.message,
    // Token、手机号等敏感信息会自动脱敏
  })
}
```

### 4. 用户友好的错误提示

```typescript
import { ElMessage } from 'element-plus'
import { get } from '@/core/api/request'
import { ErrorCode } from '@/types/api'
import { getNetworkErrorType, getNetworkErrorMessage, getBusinessErrorMessage } from '@/core/api/error-messages'

try {
  await get('/api/data')
} catch (error) {
  let errorMessage = '操作失败，请稍后重试'
  
  if (!error.response) {
    // 网络错误
    const errorType = getNetworkErrorType(error)
    errorMessage = getNetworkErrorMessage(errorType)
  } else {
    // 业务错误
    const { code, message } = error.response.data || {}
    if (code) {
      errorMessage = getBusinessErrorMessage(code, message)
    }
  }
  
  // 显示用户友好的错误提示
  ElMessage.error(errorMessage)
}
```

## 相关文档

- [API文档](./openapi.yaml)
- [API使用示例](./examples.md)
- [认证设置指南](./authentication.md)
- [核心基础设施开发指南](../guide.md)
