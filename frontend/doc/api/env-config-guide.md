# 环境变量配置指南

## 📋 概述

项目支持通过环境变量文件（`.env.dev`、`.env.test`、`.env.prod`）进行灵活配置，所有配置项都可以根据不同环境进行定制。

## 📁 环境变量文件

项目使用以下环境变量文件：

- **`.env.dev`** - 开发环境配置
- **`.env.test`** - 测试环境配置
- **`.env.prod`** - 生产环境配置

## 🚀 使用方法

### 开发环境

```bash
# 使用开发环境配置
npm run dev
# 或
pnpm dev
```

### 测试环境

```bash
# 使用测试环境配置
npm run test
# 或
pnpm test
```

### 生产环境构建

```bash
# 使用生产环境配置构建
npm run build:prod
# 或
pnpm build:prod
```

## 📝 配置项说明

### API配置

| 环境变量 | 说明 | 默认值 | 示例 |
|---------|------|--------|------|
| `VITE_API_BASE_URL` | API基础URL | `/api` | `https://api.example.com` |
| `VITE_API_TIMEOUT` | 请求超时时间（毫秒） | `30000` | `60000` |
| `VITE_API_RETRY_COUNT` | 请求重试次数 | `3` | `5` |
| `VITE_API_RETRY_DELAY` | 请求重试延迟（毫秒） | `1000` | `2000` |
| `VITE_API_RETRY_DELAY_BASE` | 请求重试延迟基数（毫秒） | `1000` | `1000` |
| `VITE_API_RETRY_MAX_DELAY` | 请求重试最大延迟（毫秒） | `10000` | `30000` |
| `VITE_API_CACHE_TTL` | 请求缓存过期时间（毫秒） | `300000` | `600000` |
| `VITE_API_CACHE_MAX_SIZE` | 请求缓存最大数量 | `100` | `200` |
| `VITE_API_MAX_CONCURRENCY` | 请求最大并发数 | `10` | `20` |
| `VITE_API_DEDUPLICATION_WINDOW` | 请求去重时间窗口（毫秒） | `1000` | `2000` |

### Mock服务配置

| 环境变量 | 说明 | 默认值 | 示例 |
|---------|------|--------|------|
| `VITE_ENABLE_MOCK` | 是否启用Mock服务 | `true`（开发/测试）<br>`false`（生产） | `true` / `false` |
| `VITE_APIFOX_MOCK_TYPE` | Mock服务类型 | `cloud` | `cloud` / `local` |
| `VITE_APIFOX_MOCK_CLOUD_URL` | 云端Mock服务URL | `https://m1.apifoxmock.com/m1/...` | - |
| `VITE_APIFOX_MOCK_LOCAL_URL` | 本地Mock服务URL | `http://127.0.0.1:4523/m1/...` | - |
| `VITE_APIFOX_TOKEN` | 云端Mock Token | - | `your_token_here` |
| `VITE_ENABLE_MOCK_TOKEN_AUTH` | 是否启用Token鉴权 | `false` | `true` / `false` |

**注意**：

- 生产环境强制禁用Mock服务，无论配置如何设置
- Token鉴权仅适用于云端Mock，本地Mock不需要Token

### 业务配置

| 环境变量 | 说明 | 默认值 | 示例 |
|---------|------|--------|------|
| `VITE_BUSINESS_SUCCESS_CODE` | 成功状态码 | `200` | `200` |
| `VITE_BUSINESS_DEFAULT_PAGE_SIZE` | 默认分页大小 | `10` | `20` |
| `VITE_BUSINESS_MAX_PAGE_SIZE` | 最大分页大小 | `100` | `200` |

### UI配置

| 环境变量 | 说明 | 默认值 | 示例 |
|---------|------|--------|------|
| `VITE_UI_DEFAULT_THEME_MODE` | 默认主题模式 | `light` | `light` / `dark` |
| `VITE_UI_DEFAULT_THEME_COLOR` | 默认主题色 | `#409EFF` | `#FF6B6B` |
| `VITE_UI_MESSAGE_DURATION` | 消息提示持续时间（毫秒） | `3000` | `5000` |
| `VITE_UI_LOADING_DELAY` | 加载提示延迟（毫秒） | `300` | `500` |

### 路由配置

| 环境变量 | 说明 | 默认值 | 示例 |
|---------|------|--------|------|
| `VITE_ROUTE_LOGIN_PATH` | 登录页路径 | `/login` | `/auth/login` |
| `VITE_ROUTE_HOME_PATH` | 首页路径 | `/` | `/home` |
| `VITE_ROUTE_NOT_FOUND_PATH` | 404页面路径 | `/404` | `/not-found` |

### 安全配置

| 环境变量 | 说明 | 默认值 | 示例 |
|---------|------|--------|------|
| `VITE_SECURITY_CSRF_TOKEN_HEADER` | CSRF Token Header名称 | `X-CSRF-Token` | `X-CSRF-Token` |
| `VITE_SECURITY_CSRF_TOKEN_HEADER_ALT` | CSRF Token请求头名称（备用） | `X-XSRF-TOKEN` | `X-XSRF-TOKEN` |
| `VITE_SECURITY_ENABLE_CSRF` | 是否启用CSRF防护 | `true` | `true` / `false` |

## 🔧 配置示例

### 开发环境（.env.dev）

```bash
# API配置
VITE_API_BASE_URL=/api
VITE_API_TIMEOUT=30000

# Mock服务配置
VITE_ENABLE_MOCK=true
VITE_APIFOX_MOCK_TYPE=cloud
VITE_APIFOX_MOCK_CLOUD_URL=https://m1.apifoxmock.com/m1/7676691-7418764-6917011

# UI配置
VITE_UI_DEFAULT_THEME_MODE=light
VITE_UI_DEFAULT_THEME_COLOR=#409EFF
```

### 测试环境（.env.test）

```bash
# API配置
VITE_API_BASE_URL=/api
VITE_API_TIMEOUT=30000

# Mock服务配置
VITE_ENABLE_MOCK=true
VITE_APIFOX_MOCK_TYPE=cloud

# UI配置
VITE_UI_DEFAULT_THEME_MODE=light
```

### 生产环境（.env.prod）

```bash
# API配置
VITE_API_BASE_URL=https://api.example.com
VITE_API_TIMEOUT=30000

# Mock服务配置（生产环境强制禁用）
VITE_ENABLE_MOCK=false

# UI配置
VITE_UI_DEFAULT_THEME_MODE=light
VITE_UI_DEFAULT_THEME_COLOR=#409EFF
```

## 📦 脚本命令

### 开发环境

```bash
# 启动开发服务器（使用 .env.dev）
npm run dev

# 使用标准开发模式（使用 .env.development）
npm run dev:development
```

### 测试环境

```bash
# 启动测试服务器（使用 .env.test）
npm run test
```

### 构建

```bash
# 构建开发环境版本
npm run build:dev

# 构建测试环境版本
npm run build:test

# 构建生产环境版本（默认）
npm run build:prod
npm run build
```

### 预览

```bash
# 预览开发环境构建
npm run preview:dev

# 预览测试环境构建
npm run preview:test

# 预览生产环境构建
npm run preview:prod
npm run preview
```

## 🔍 环境变量加载机制

1. **Vite插件加载**：项目使用自定义Vite插件（`vite.config.env.ts`）加载环境变量文件
2. **模式映射**：
   - `dev` / `development` → `.env.dev`
   - `test` → `.env.test`
   - `prod` / `production` → `.env.prod`
1. **优先级**：环境变量文件中的配置会覆盖代码中的默认值
2. **类型转换**：自动处理数值、字符串、布尔类型的转换

## ⚠️ 注意事项

1. **环境变量命名**：所有环境变量必须以 `VITE_` 开头，才能在前端代码中使用
2. **生产环境Mock**：生产环境强制禁用Mock服务，无论配置如何设置
3. **敏感信息**：不要在环境变量文件中存储敏感信息（如密码、密钥），应使用环境变量或密钥管理服务
4. **Git提交**：环境变量文件已添加到 `.gitignore`，不会被提交到版本控制系统
5. **默认值**：如果环境变量未设置，将使用代码中定义的默认值

## 📚 相关文档

- [Mock服务配置](./mock-config-refactor.md)
- [API文档](./openapi.yaml)
- [使用示例](../core-infrastructure/api/examples.md)
