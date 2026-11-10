# Router 路由管理

路由管理模块基于vue-router实现路由配置和权限控制。

## 目录结构

````plaintext
router/
├── modules/      # 路由模块
│   ├── index.ts  # 路由定义
│   └── routes.ts # 路由配置
├── guards/       # 路由守卫
│   ├── auth.ts   # 权限守卫
│   └── index.ts  # 守卫导出
└── index.ts      # 路由导出
```

## 模块说明

### 路由配置 (modules/routes.ts)

定义应用的所有路由，包括：

- 路由路径
- 路由组件（懒加载）
- 路由元信息（title、requiresAuth等）

### 权限守卫 (guards/auth.ts)

实现路由权限控制，包括：

- `beforeEach` - 路由前置守卫
- 登录状态检查
- 权限检查
- 未授权跳转逻辑

## 使用示例

```ts
// 在组件中使用路由
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// 路由跳转
router.push('/home')

// 获取路由信息
const title = route.meta.title
const requiresAuth = route.meta.requiresAuth
```

## 依赖关系

- 依赖 `@/stores` - 状态管理（用于权限检查）
- 依赖 `@/types` - 类型定义
- 被所有页面组件使用
````
