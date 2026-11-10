# Types 类型定义

类型定义模块提供TypeScript类型定义，确保类型安全。

## 目录结构

````plaintext
types/
├── api.ts        # API类型定义
├── common.ts     # 通用类型定义
├── user.ts       # 用户类型定义
└── index.ts      # 类型导出
```

## 模块说明

### API类型 (api.ts)

定义API请求和响应的类型，包括：

- `ApiResponse<T>` - API响应统一格式
- `ApiError` - API错误类型
- `RequestConfig` - 请求配置类型
- `ErrorCode` - 错误码枚举

### 通用类型 (common.ts)

定义通用的数据类型，包括：

- `Pagination` - 分页类型
- `SortOrder` - 排序类型
- `TimeRange` - 时间范围类型

### 用户类型 (user.ts)

定义用户相关的类型，包括：

- `UserInfo` - 用户信息接口
- `UserRole` - 用户角色枚举
- `Permission` - 权限类型

## 使用示例

```ts
// 导入类型定义
import type { UserInfo, ApiResponse, Pagination } from '@/types'

// 使用类型
const user: UserInfo = {
  id: 1,
  name: '张三',
  email: 'zhangsan@example.com',
}

// API响应类型
const response: ApiResponse<UserInfo> = {
  code: 200,
  message: 'success',
  data: user,
}
```

## 依赖关系

- 无依赖
- 被所有模块使用
````
