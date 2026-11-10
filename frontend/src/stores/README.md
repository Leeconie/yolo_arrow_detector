# Stores 状态管理

状态管理模块基于Pinia实现全局状态管理，提供用户信息、主题配置、应用状态等全局状态。

## 目录结构

````plaintext
stores/
├── modules/      # 状态模块
│   ├── user.ts   # 用户状态
│   ├── theme.ts  # 主题状态
│   └── app.ts    # 应用状态
├── types/        # Store类型定义
│   └── index.ts
└── index.ts      # Store导出
```

## 模块说明

### 用户状态 (modules/user.ts)

管理用户相关的状态，包括：

- `token` - 用户认证token
- `userInfo` - 用户信息
- `isLoggedIn` - 登录状态（计算属性）
- `setToken()` - 设置token
- `setUserInfo()` - 设置用户信息
- `logout()` - 登出

### 主题状态 (modules/theme.ts)

管理主题相关的状态，包括：

- `themeMode` - 主题模式（light/dark）
- `themeColor` - 主题颜色
- `toggleTheme()` - 切换主题

### 应用状态 (modules/app.ts)

管理应用全局状态，包括：

- `loading` - 全局加载状态
- `menuCollapsed` - 菜单折叠状态

## 使用示例

```ts
// 导入Store
import { useUserStore, useThemeStore } from '@/stores'

// 在组件中使用
const userStore = useUserStore()
const themeStore = useThemeStore()

// 获取状态
const isLoggedIn = userStore.isLoggedIn
const themeMode = themeStore.themeMode

// 更新状态
userStore.setToken('token')
themeStore.toggleTheme()
```

## 依赖关系

- 依赖 `@/types` - 类型定义
- 依赖 `@/core/api` - API封装（可选，用于获取用户信息）
- 被所有业务模块使用
````
