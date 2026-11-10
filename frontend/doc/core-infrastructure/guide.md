# 核心基础设施模块开发文档

> **文档版本**：v0.2.0  
> **最后更新**：2026-01-08  
> **维护人员**：开发团队

## 一、模块概述

核心基础设施模块是整个前端视频分析系统的基础支撑，为其他功能模块提供统一的API封装、状态管理、路由管理、工具函数、类型定义等核心能力。该模块是系统架构的基石，所有其他模块都依赖于此模块。

### 1.1 模块职责

- **API封装**：统一HTTP请求封装，提供请求拦截、响应处理、错误处理等能力
- **状态管理**：基于Pinia的全局状态管理，提供用户信息、主题配置等全局状态
- **路由管理**：基于vue-router的路由配置，提供路由守卫、权限控制等功能
- **工具函数**：提供日期处理、字符串处理、加密解密等通用工具方法
- **类型定义**：提供TypeScript类型定义，确保类型安全
- **配置管理**：提供环境配置、常量定义等配置管理能力

### 1.2 技术栈版本

| 技术模块                | 版本号 | 说明                   |
| ----------------------- | ------ | ---------------------- |
| Vue                     | 3.5.26 | 核心框架               |
| Vite                    | 7.3.0  | 构建工具               |
| TypeScript              | 5.9.3  | 类型检查               |
| Pinia                   | 3.0.4  | 状态管理               |
| vue-router              | 4.6.4  | 路由管理               |
| Axios                   | 1.13.2 | HTTP客户端（安全版本） |
| Element Plus            | 2.13.0 | UI组件库               |
| @element-plus/icons-vue | 2.3.1  | 图标库                 |
| Tailwind CSS            | 3.4.10 | 样式方案               |
| ESLint                  | 9.39.2 | 代码检查               |
| Prettier                | 3.7.4  | 代码格式化             |
| pnpm                    | 9.12.3 | 包管理器               |

## 二、目录结构

```text
src/
├── core/                    # 核心模块
│   ├── api/                 # API封装
│   │   ├── request.ts       # HTTP请求封装
│   │   ├── types.ts         # API类型定义
│   │   └── index.ts         # API导出
│   ├── config/              # 配置管理
│   │   ├── env.ts           # 环境配置
│   │   ├── constants.ts     # 常量定义
│   │   └── index.ts         # 配置导出
│   └── constants/           # 常量定义（备用）
│       └── index.ts
├── utils/                   # 工具函数
│   ├── date.ts              # 日期处理
│   ├── string.ts            # 字符串处理
│   ├── encrypt.ts           # 加密解密
│   ├── validate.ts           # 数据校验
│   ├── storage.ts           # 本地存储
│   └── index.ts             # 工具函数导出
├── types/                   # TypeScript类型定义
│   ├── api.ts               # API类型
│   ├── common.ts            # 通用类型
│   ├── user.ts              # 用户类型
│   └── index.ts             # 类型导出
├── stores/                  # Pinia状态管理
│   ├── modules/             # 状态模块
│   │   ├── user.ts          # 用户状态
│   │   ├── theme.ts         # 主题状态
│   │   └── app.ts           # 应用状态
│   ├── types/               # Store类型定义
│   │   └── index.ts
│   └── index.ts             # Store导出
├── router/                  # 路由配置
│   ├── modules/             # 路由模块
│   │   ├── index.ts         # 路由定义
│   │   └── routes.ts        # 路由配置
│   ├── guards/              # 路由守卫
│   │   ├── auth.ts          # 权限守卫
│   │   └── index.ts         # 守卫导出
│   └── index.ts             # 路由导出
└── assets/                  # 静态资源
    ├── images/              # 图片资源
    ├── styles/              # 样式文件
    │   ├── variables.css    # CSS变量
    │   ├── common.css      # 通用样式
    │   └── index.css       # 样式入口
    └── fonts/               # 字体文件
```

## 三、技术实现要点

### 3.1 API封装（core/api/request.ts）

**核心功能**：

- 基于Axios封装统一的HTTP请求方法
- 实现请求拦截器（添加token、设置请求头）
- 实现响应拦截器（统一错误处理、数据格式化）
- 支持请求取消、重试机制
- 提供GET、POST、PUT、DELETE等常用方法

**技术要点**：

- 使用TypeScript泛型确保类型安全
- 实现请求/响应拦截器链
- 统一错误码处理和错误提示
- 支持请求超时配置
- 实现请求取消功能（AbortController）

**示例代码结构**：

```typescript
// core/api/request.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/modules/user'

// 创建axios实例
const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json;charset=UTF-8',
  },
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data
    if (res.code !== 200) {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res.data
  },
  (error) => {
    // 统一错误处理
    return Promise.reject(error)
  },
)

export default service
```

### 3.2 状态管理（stores/modules/）

**核心功能**：

- 用户状态管理（用户信息、登录状态、权限信息）
- 主题状态管理（主题模式、主题色配置）
- 应用状态管理（全局loading、菜单状态等）

**技术要点**：

- 使用Pinia的setup语法
- 实现状态持久化（localStorage/sessionStorage）
- 提供actions用于状态更新
- 使用TypeScript确保类型安全

**示例代码结构**：

```typescript
// stores/modules/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo } from '@/types/user'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>('')
  const userInfo = ref<UserInfo | null>(null)

  const isLoggedIn = computed(() => !!token.value)

  const setToken = (newToken: string) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  const setUserInfo = (info: UserInfo) => {
    userInfo.value = info
  }

  const logout = () => {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    setToken,
    setUserInfo,
    logout,
  }
})
```

### 3.3 路由管理（router/）

**核心功能**：

- 路由配置（路由定义、路由懒加载）
- 路由守卫（权限校验、登录校验）
- 路由元信息（页面标题、权限要求等）

**技术要点**：

- 使用vue-router 4.x的API
- 实现路由懒加载优化性能
- 配置路由守卫实现权限控制
- 使用TypeScript定义路由类型

**示例代码结构**：

```typescript
// router/index.ts
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { setupRouterGuards } from './guards'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: {
      title: '首页',
      requiresAuth: true,
    },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 设置路由守卫
setupRouterGuards(router)

export default router
```

### 3.4 工具函数（utils/）

**核心功能**：

- 日期处理（格式化、解析、计算）
- 字符串处理（加密、解密、格式化）
- 数据校验（表单校验、数据格式校验）
- 本地存储（localStorage、sessionStorage封装）

**技术要点**：

- 提供纯函数，无副作用
- 使用TypeScript确保类型安全
- 提供完整的JSDoc注释
- 实现错误处理机制

### 3.5 类型定义（types/）

**核心功能**：

- API响应类型定义
- 通用数据类型定义
- 用户、业务实体类型定义

**技术要点**：

- 使用TypeScript接口和类型别名
- 提供完整的类型导出
- 确保类型定义与后端接口一致

## 四、API定义

### 4.1 请求方法

| 方法   | 说明     | 使用场景           |
| ------ | -------- | ------------------ |
| GET    | 获取数据 | 查询列表、获取详情 |
| POST   | 创建数据 | 创建资源、提交表单 |
| PUT    | 更新数据 | 更新资源           |
| DELETE | 删除数据 | 删除资源           |

### 4.2 响应格式

```typescript
// types/api.ts
export interface ApiResponse<T = any> {
  code: number // 状态码，200表示成功
  message: string // 消息描述
  data: T // 数据内容
  timestamp?: number // 时间戳（可选）
}
```

### 4.3 错误码定义

| 错误码 | 说明       | 处理方式       |
| ------ | ---------- | -------------- |
| 200    | 成功       | 正常处理       |
| 401    | 未授权     | 跳转登录页     |
| 403    | 无权限     | 提示无权限     |
| 404    | 资源不存在 | 提示资源不存在 |
| 500    | 服务器错误 | 提示服务器错误 |

## 五、组件规范

### 5.1 组件命名

- 组件文件使用PascalCase命名（如`UserInfo.vue`）
- 组件名使用PascalCase，且必须为多个单词（如`BaseButton`）

### 5.2 组件结构

```vue
<script setup lang="ts">
// 1. 导入依赖
import { ref, computed } from 'vue'
import type { UserInfo } from '@/types/user'

// 2. 定义Props
interface Props {
  title: string
  disabled?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})

// 3. 定义Emits
const emit = defineEmits<{
  (e: 'change', value: boolean): void
  (e: 'submit', data: any): void
}>()

// 4. 定义响应式数据
const count = ref(0)

// 5. 定义计算属性
const doubleCount = computed(() => count.value * 2)

// 6. 定义方法
const handleClick = () => {
  emit('change', true)
}
</script>

<template>
  <div class="component-name">
    <!-- 组件模板 -->
  </div>
</template>

<style scoped lang="scss">
.component-name {
  // 组件样式
}
</style>
```

## 六、开发要点

### 6.1 代码规范

- 遵循Vue 3组合式API最佳实践
- 使用TypeScript严格模式
- 遵循ESLint和Prettier配置
- 组件必须添加JSDoc注释
- 复杂逻辑必须添加注释说明

### 6.2 性能优化

- 路由使用懒加载（`() => import()`）
- 组件按需引入
- 合理使用computed和watch
- 避免不必要的响应式数据

### 6.3 错误处理

- API请求统一错误处理
- 使用try-catch捕获异常
- 提供友好的错误提示
- 记录错误日志

### 6.4 安全性

- Token存储在localStorage，注意XSS防护
- API请求添加CSRF防护
- 敏感数据加密传输
- 输入数据校验和过滤

## 七、测试要求

### 7.1 单元测试

- API封装函数测试覆盖率≥80%
- 工具函数测试覆盖率≥90%
- Store模块测试覆盖率≥80%

### 7.2 集成测试

- 路由跳转测试
- API请求流程测试
- 状态管理流程测试

### 7.3 测试工具

- Vitest：单元测试框架
- @vue/test-utils：Vue组件测试工具
- Playwright：端到端测试（可选）

## 八、依赖关系

### 8.1 内部依赖

- 无（核心模块不依赖其他业务模块）

### 8.2 外部依赖

- Vue 3.5.26
- Pinia 3.0.4
- vue-router 4.6.4
- Axios 1.13.2
- Element Plus 2.13.0
- TypeScript 5.9.3

### 8.3 被依赖模块

- 所有业务模块都依赖核心基础设施模块

## 九、开发计划

### 9.1 第一阶段：基础搭建

1. 创建目录结构
2. 配置TypeScript类型定义
3. 配置ESLint和Prettier
4. 配置Vite构建配置

### 9.2 第二阶段：API封装

1. 实现Axios请求封装
2. 实现请求/响应拦截器
3. 实现错误处理机制
4. 编写API类型定义

### 9.3 第三阶段：状态管理

1. 实现用户状态管理
2. 实现主题状态管理
3. 实现应用状态管理
4. 实现状态持久化

### 9.4 第四阶段：路由管理

1. 配置基础路由
2. 实现路由守卫
3. 实现权限控制
4. 配置路由懒加载

### 9.5 第五阶段：工具函数

1. 实现日期处理工具
2. 实现字符串处理工具
3. 实现数据校验工具
4. 实现本地存储工具

### 9.6 第六阶段：测试与文档

1. 编写单元测试
2. 编写集成测试
3. 完善开发文档
4. 代码审查与优化

## 十、注意事项

1. **版本锁定**：所有依赖版本必须严格按照技术栈版本表锁定，避免版本不一致导致的问题
2. **类型安全**：所有代码必须使用TypeScript，禁止使用any类型（特殊情况需添加注释说明）
3. **错误处理**：所有API请求必须实现错误处理，提供友好的错误提示
4. **性能优化**：注意代码性能，避免不必要的响应式数据和计算
5. **代码规范**：严格遵循项目代码规范，通过ESLint和Prettier检查
6. **文档更新**：代码变更时及时更新相关文档

## 十一、参考资料

- [Vue 3 官方文档](https://vuejs.org/)
- [Pinia 官方文档](https://pinia.vuejs.org/)
- [vue-router 官方文档](https://router.vuejs.org/)
- [Axios 官方文档](https://axios-http.com/)
- [Element Plus 官方文档](https://element-plus.org/)
- [TypeScript 官方文档](https://www.typescriptlang.org/)
