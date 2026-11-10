# 认证设置指南

本文档详细说明核心基础设施模块的认证机制，包括Token认证、CSRF防护、认证流程、安全注意事项等。

## 目录

- [Token认证](#token-authentication)
- [CSRF防护](#csrf-protection)
- [认证流程](#authentication-flow)
- [安全注意事项](#security-notes)
- [常见问题](#faq)

## Token认证 {#token-authentication}

### Token获取方式

Token通过登录接口获取，登录成功后需要保存Token：

```typescript
import { post } from '@/core/api/request'
import { useUserStore } from '@/stores/modules/user'

async function login(username: string, password: string) {
  // 1. 发送登录请求
  const response = await post<{ token: string; userInfo: UserInfo }>('/api/login', {
    username,
    password,
  })

  // 2. 保存Token和用户信息
  const userStore = useUserStore()
  userStore.setToken(response.data.token)
  userStore.setUserInfo(response.data.userInfo)

  return response.data
}
```

### Token存储方式

Token存储在localStorage中，通过Pinia Store管理：

```typescript
import { useUserStore } from '@/stores/modules/user'

const userStore = useUserStore()

// 设置Token（自动存储到localStorage）
userStore.setToken('your-jwt-token')

// 获取Token
const token = userStore.token

// 清除Token
userStore.logout()
```

**存储位置**：

- localStorage key: `token`（由`STORAGE_KEYS.TOKEN`定义）
- 自动进行XSS防护（使用`sanitizeInput`清理）
- 使用防抖写入，减少频繁IO操作

### Token刷新机制

Token即将过期时（剩余时间<5分钟），会自动刷新Token。

#### 自动刷新

Token刷新是自动的，无需手动调用：

```typescript
import { get } from '@/core/api/request'

// 请求拦截器会自动检测Token过期时间
// 如果剩余时间<5分钟，会自动调用刷新接口
const data = await get('/api/user/info')
// 如果Token即将过期，会自动刷新后再发送请求
```

#### 手动刷新

如果需要手动刷新Token：

```typescript
import { checkAndRefreshToken, refreshToken } from '@/core/api/token-refresh'

// 检查并刷新Token（如果即将过期）
const validToken = await checkAndRefreshToken()

// 强制刷新Token
const newToken = await refreshToken()
```

#### 刷新配置

可以自定义刷新配置：

```typescript
import { checkAndRefreshToken } from '@/core/api/token-refresh'

// 自定义刷新配置
const validToken = await checkAndRefreshToken({
  refreshBeforeExpires: 600, // 过期前10分钟开始刷新（默认5分钟）
  refreshEndpoint: '/api/auth/refresh', // 刷新接口地址
  autoRefresh: true, // 是否自动刷新（默认true）
})
```

#### 刷新流程

1. 请求拦截器检测Token过期时间
2. 如果剩余时间<配置的阈值，调用刷新接口
3. 刷新成功后，更新Store中的Token
4. 刷新失败时，清除Token并跳转登录页

### Token过期处理

当Token过期时，响应拦截器会自动处理：

```typescript
// Token过期时，响应拦截器会自动：
// 1. 清除Token和用户信息
// 2. 跳转到登录页
// 3. 显示"登录已过期，请重新登录"提示

// 无需手动处理，系统会自动处理
```

### Token缓存优化

Token会自动缓存，减少重复获取和刷新：

```typescript
import { tokenCache } from '@/core/api/token-cache'

// Token缓存会自动管理：
// - 缓存有效期：5分钟
// - 自动检测Token过期时间
// - 自动刷新即将过期的Token
// - 减少重复的localStorage访问和JWT解析

// 请求拦截器会自动使用缓存的Token
const token = await tokenCache.getToken()
```

## CSRF防护 {#csrf-protection}

### CSRF Token生成

CSRF Token会自动生成并缓存：

```typescript
import { getCsrfToken, generateCsrfToken } from '@/core/api/csrf'

// 获取CSRF Token（如果不存在则自动生成）
const csrfToken = getCsrfToken()

// 手动生成新的CSRF Token
const newToken = generateCsrfToken()
```

**生成方式**：

- 优先使用`crypto.getRandomValues`（如果可用）
- 降级方案：使用`Math.random` + 时间戳
- 生成32字节的随机Token

### CSRF Token使用

CSRF Token会自动添加到需要防护的请求（POST、PUT、DELETE）中：

```typescript
import { post } from '@/core/api/request'

// POST请求会自动添加CSRF Token
// 无需手动设置，请求拦截器会自动处理
const result = await post('/api/user', {
  name: 'John',
  email: 'john@example.com',
})

// 请求头会自动包含：
// X-CSRF-Token: <csrf-token>
```

**自动添加规则**：

- POST请求：自动添加
- PUT请求：自动添加
- DELETE请求：自动添加
- GET请求：不添加（通常不需要CSRF防护）

### CSRF Token刷新

CSRF Token有效期1小时，过期后会自动刷新：

```typescript
import { refreshCsrfToken } from '@/core/api/csrf'

// CSRF Token刷新是自动的，无需手动处理
// 请求拦截器会自动检测Token过期时间并刷新

// 如果需要手动刷新
const newToken = refreshCsrfToken()
```

### CSRF Token存储

CSRF Token存储在localStorage中：

```typescript
import { setCsrfToken, getCsrfToken, clearCsrfToken } from '@/core/api/csrf'

// 设置CSRF Token（自动设置过期时间）
setCsrfToken('your-csrf-token')

// 获取CSRF Token
const token = getCsrfToken()

// 清除CSRF Token
clearCsrfToken()
```

**存储位置**：

- localStorage key: `csrfToken`
- 过期时间：1小时（3600秒）
- 使用`setStorage`自动管理过期时间

### CSRF Token缓存优化

CSRF Token会自动缓存，减少重复生成：

```typescript
import { csrfTokenCache } from '@/core/api/token-cache'

// CSRF Token缓存会自动管理：
// - 缓存有效期：1小时
// - 自动检测Token过期时间
// - 自动刷新过期的Token
// - 减少重复的localStorage访问

// 请求拦截器会自动使用缓存的CSRF Token
const token = csrfTokenCache.getToken()
```

### CSRF Token验证

可以手动验证CSRF Token：

```typescript
import { validateCsrfToken } from '@/core/api/csrf'

// 验证CSRF Token是否有效
const isValid = validateCsrfToken('your-csrf-token')
if (!isValid) {
  console.error('CSRF Token无效')
}
```

## 认证流程 {#authentication-flow}

### 登录流程

```typescript
import { post } from '@/core/api/request'
import { useUserStore } from '@/stores/modules/user'

async function login(username: string, password: string) {
  try {
    // 1. 发送登录请求
    const response = await post<{ token: string; userInfo: UserInfo }>('/api/login', {
      username,
      password,
    })

    // 2. 保存Token和用户信息
    const userStore = useUserStore()
    userStore.setToken(response.data.token)
    userStore.setUserInfo(response.data.userInfo)

    // 3. Token会自动缓存，后续请求会自动使用
    // 4. CSRF Token会自动生成并缓存

    return response.data
  } catch (error) {
    console.error('登录失败', error)
    throw error
  }
}
```

**流程说明**：

1. 用户输入用户名和密码
2. 发送登录请求到服务器
3. 服务器返回Token和用户信息
4. 保存Token和用户信息到Store和localStorage
5. Token和CSRF Token自动缓存
6. 后续请求自动使用Token和CSRF Token

### Token刷新流程

Token刷新是自动的，流程如下：

```typescript
// 1. 请求拦截器检测Token过期时间
// 2. 如果剩余时间<5分钟，自动调用刷新接口
// 3. 刷新成功后，更新Store中的Token
// 4. 刷新失败时，清除Token并跳转登录页

// 无需手动处理，系统会自动处理
```

**刷新时机**：

- Token剩余时间<5分钟（可配置）
- 每次请求前自动检测
- 如果正在刷新，多个请求共享同一个刷新Promise

### 登出流程

```typescript
import { useUserStore } from '@/stores/modules/user'
import { clearCsrfToken } from '@/core/api/csrf'
import { tokenCache, csrfTokenCache } from '@/core/api/token-cache'

function logout() {
  const userStore = useUserStore()

  // 1. 清除Token和用户信息
  userStore.logout()

  // 2. 清除CSRF Token
  clearCsrfToken()

  // 3. 清除Token缓存
  tokenCache.clear()
  csrfTokenCache.clear()

  // 4. 跳转到登录页
  window.location.href = '/login'
}
```

**流程说明**：

1. 清除Store中的Token和用户信息
2. 清除localStorage中的Token和用户信息
3. 清除CSRF Token
4. 清除Token缓存
5. 跳转到登录页

## 安全注意事项 {#security-notes}

### Token安全存储

1. **存储位置**：
   - Token存储在localStorage中
   - 注意XSS防护，使用`sanitizeInput`清理
   - 不要将Token暴露在URL中

1. **XSS防护**：
   - 使用DOMPurify对用户输入进行清理
   - 使用`safeLog`函数记录日志，自动脱敏敏感信息
   - 避免在HTML中直接输出Token

1. **敏感信息保护**：
   - 使用`mask`函数对敏感信息进行脱敏
   - 使用`safeLog`函数记录日志，自动脱敏Token、手机号、邮箱等
   - 不要在日志中输出完整Token

### CSRF防护

1. **Token生成**：
   - 使用加密安全的随机数生成器
   - Token长度足够（32字节）
   - 定期刷新Token（1小时）

1. **Token使用**：
   - 所有需要防护的请求（POST、PUT、DELETE）自动添加
   - Token存储在localStorage中，注意XSS防护
   - 不要将Token暴露在URL中

1. **Token验证**：
   - 服务器端需要验证CSRF Token
   - Token与用户会话关联
   - 验证Token的有效性和过期时间

### 其他安全建议

1. **HTTPS使用**：
   - 生产环境必须使用HTTPS
   - 防止中间人攻击
   - 保护Token传输安全

1. **Token过期时间**：
   - 设置合理的Token过期时间
   - 使用刷新机制延长会话
   - 定期检查Token有效性

1. **错误处理**：
   - 不要暴露详细的错误信息
   - 使用友好的错误提示
   - 记录错误日志（脱敏后）

1. **权限控制**：
   - 服务器端验证用户权限
   - 前端仅做UI控制，不依赖前端权限验证
   - 使用路由守卫控制页面访问

## 常见问题 {#faq}

### Q1: Token过期后如何处理？

**A**: Token过期后，响应拦截器会自动处理：

1. 清除Token和用户信息
2. 跳转到登录页
3. 显示"登录已过期，请重新登录"提示

无需手动处理，系统会自动处理。

### Q2: Token刷新失败怎么办？

**A**: Token刷新失败时，系统会自动：

1. 清除Token和用户信息
2. 跳转到登录页
3. 显示错误提示

用户需要重新登录。

### Q3: CSRF Token什么时候刷新？

**A**: CSRF Token在以下情况会刷新：

1. Token不存在时，自动生成新的
2. Token过期时（1小时），自动刷新
3. 手动调用`refreshCsrfToken()`时

### Q4: 如何禁用Token自动刷新？

**A**: 可以在刷新配置中禁用：

```typescript
import { checkAndRefreshToken } from '@/core/api/token-refresh'

await checkAndRefreshToken({
  autoRefresh: false, // 禁用自动刷新
})
```

### Q5: Token缓存会影响性能吗？

**A**: 不会，Token缓存会提升性能：

- 减少重复的localStorage访问
- 减少重复的JWT解析
- 减少重复的Token刷新请求
- 缓存有效期：5分钟（Token）、1小时（CSRF Token）

### Q6: 如何手动清除Token缓存？

**A**: 可以手动清除Token缓存：

```typescript
import { tokenCache, csrfTokenCache } from '@/core/api/token-cache'

// 清除Token缓存
tokenCache.clear()

// 清除CSRF Token缓存
csrfTokenCache.clear()
```

## 相关文档

- [API文档](./openapi.yaml)
- [API使用示例](./examples.md)
- [错误代码参考](./error-codes.md)
- [核心基础设施开发指南](../guide.md)
