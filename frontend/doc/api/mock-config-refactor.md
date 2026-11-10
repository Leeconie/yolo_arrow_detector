# Mock服务配置重构报告

## 📋 执行时间

2026-01-10

## 🎯 重构目标

根据实际需求，重构Mock服务配置，实现以下功能：

1. **环境隔离**：只在开发环境和测试环境使用Mock，生产环境强制禁用
2. **灵活配置**：支持云端Mock和本地Mock切换
3. **完整配置项**：提供所有必要的配置开关
4. **文档完善**：按照规范更新API文档，对数据模型进行分类

## ✅ 重构内容

### 1. 配置项重构

#### 文件：`src/core/config/constants.ts`

**新增配置项**：

```typescript
export const APIFOX_CONFIG = {
  /** 是否启用Mock服务（仅在开发/测试环境有效，生产环境强制禁用） */
  ENABLE_MOCK: (() => {
    const mode = import.meta.env.MODE
    const isDevOrTest = mode === 'development' || mode === 'test'
    const envEnable = import.meta.env.VITE_ENABLE_MOCK === 'true'
    // 生产环境强制禁用Mock
    if (mode === 'production') {
      return false
    }
    // 开发/测试环境：如果环境变量明确设置为false，则禁用；否则默认启用
    return isDevOrTest && (import.meta.env.VITE_ENABLE_MOCK !== 'false' || envEnable)
  })(),

  /** Mock服务类型：云端(cloud) 或 本地(local) */
  MOCK_TYPE: (import.meta.env.VITE_APIFOX_MOCK_TYPE as MockType) || 'cloud',

  /** 云端Mock服务基础URL */
  MOCK_CLOUD_URL: import.meta.env.VITE_APIFOX_MOCK_CLOUD_URL || 'https://m1.apifoxmock.com/m1/7676691-7418764-6917011',

  /** 本地Mock服务基础URL */
  MOCK_LOCAL_URL: import.meta.env.VITE_APIFOX_MOCK_LOCAL_URL || 'http://127.0.0.1:4523/m1/7676691-7418764-6917011',

  /** 云端Mock服务Token（用于Token鉴权） */
  MOCK_TOKEN: import.meta.env.VITE_APIFOX_TOKEN || '',

  /** 是否启用Mock服务Token鉴权 */
  ENABLE_MOCK_TOKEN_AUTH: import.meta.env.VITE_ENABLE_MOCK_TOKEN_AUTH === 'true',

  /** 获取当前使用的Mock服务基础URL */
  get MOCK_BASE_URL(): string {
    return this.MOCK_TYPE === 'cloud' ? this.MOCK_CLOUD_URL : this.MOCK_LOCAL_URL
  },
}
```

**关键改进**：

1. **环境判断逻辑**：
   - 生产环境强制禁用Mock（`mode === 'production'` 时返回 `false`）
   - 开发/测试环境默认启用，但可通过环境变量控制

1. **Mock类型支持**：
   - 支持 `cloud`（云端）和 `local`（本地）两种类型
   - 通过 `MOCK_BASE_URL` getter 自动选择对应的URL

1. **配置项完整性**：
   - `ENABLE_MOCK`：是否启用Mock服务
   - `MOCK_TYPE`：Mock服务类型（云端/本地）
   - `MOCK_CLOUD_URL`：云端Mock地址
   - `MOCK_LOCAL_URL`：本地Mock地址
   - `MOCK_TOKEN`：云端Mock Token
   - `ENABLE_MOCK_TOKEN_AUTH`：是否启用Token鉴权

### 2. 请求拦截器优化

#### 文件：`src/core/api/request.ts`

**新增函数**：

```typescript
/**
 * 获取API基础URL
 * @description 根据环境配置返回正确的API基础URL
 * - 如果启用Mock服务（仅开发/测试环境），返回Mock服务URL
 * - 否则返回生产环境API URL
 */
function getBaseURL(): string {
  if (APIFOX_CONFIG.ENABLE_MOCK) {
    return APIFOX_CONFIG.MOCK_BASE_URL
  }
  return import.meta.env.VITE_API_BASE_URL || '/api'
}
```

**Token鉴权逻辑优化**：

```typescript
// 如果启用Mock服务且使用云端Mock且启用Token鉴权，添加API FOX Token到请求头
// Token鉴权仅适用于云端Mock，本地Mock不需要Token
if (
  APIFOX_CONFIG.ENABLE_MOCK &&
  APIFOX_CONFIG.MOCK_TYPE === 'cloud' &&
  APIFOX_CONFIG.ENABLE_MOCK_TOKEN_AUTH &&
  APIFOX_CONFIG.MOCK_TOKEN
) {
  config.headers.apifoxToken = APIFOX_CONFIG.MOCK_TOKEN
}
```

**关键改进**：

1. **环境隔离**：生产环境不会使用Mock服务
2. **Token鉴权优化**：仅在云端Mock时使用Token，本地Mock不需要
3. **URL自动选择**：根据Mock类型自动选择对应的URL

### 3. API文档更新

#### 文件：`doc/api/openapi.yaml`

**更新内容**：

1. **Mock服务配置章节**：
   - 详细说明环境变量配置
   - 说明云端Mock和本地Mock的区别
   - 提供完整的环境变量配置示例

1. **Servers配置**：

   ```yaml
   servers:
     - url: /api
       description: 生产环境API基础路径
     - url: https://m1.apifoxmock.com/m1/7676691-7418764-6917011
       description: Apifox云端Mock服务（开发/测试环境）
     - url: http://127.0.0.1:4523/m1/7676691-7418764-6917011
       description: Apifox本地Mock服务（开发/测试环境，需要Apifox客户端运行）
   ```

1. **数据模型分类**：
   - 通用响应模型：`ApiResponse`
   - 错误响应模型：`ErrorResponse`
   - 用户管理相关模型：`UserInfo`, `LoginRequest`, `LoginResponse`, `RegisterRequest`, `RegisterResponse`
   - 射箭分析相关模型：`ArcheryStats`, `HitPoint`, `TrajectoryPoint`, `ArcheryDetail`, `UploadArcheryVideoResponse`
   - 视频上传相关模型：`ChunkUploadResponse`, `ValidateVideoRequest`, `ValidateVideoResponse`, `SaveVideoTypeRequest`, `SaveVideoTypeResponse`
   - 标准错误响应模型：`BadRequest`, `Unauthorized`, `Forbidden`, `NotFound`, `InternalServerError`

### 4. 使用示例文档更新

#### 文件：`doc/core-infrastructure/api/examples.md`

**更新内容**：

1. **完整的环境变量配置说明**
2. **环境说明表格**：清晰说明各环境的Mock使用情况
3. **使用场景说明**：开发环境、测试环境、生产环境的使用场景
4. **Mock服务地址说明**：云端和本地的地址格式

## 📊 环境变量配置

### 完整配置示例

```bash
# ==================== Mock服务基础配置 ====================
# 是否启用Mock服务（仅在开发/测试环境有效，生产环境强制禁用）
VITE_ENABLE_MOCK=true

# Mock服务类型：cloud（云端）或 local（本地）
VITE_APIFOX_MOCK_TYPE=cloud

# ==================== 云端Mock配置 ====================
# 云端Mock服务基础URL
VITE_APIFOX_MOCK_CLOUD_URL=https://m1.apifoxmock.com/m1/7676691-7418764-6917011

# 云端Mock Token（仅在启用Token鉴权时需要）
VITE_APIFOX_TOKEN=your_token_here

# 是否启用云端Mock Token鉴权
VITE_ENABLE_MOCK_TOKEN_AUTH=false

# ==================== 本地Mock配置 ====================
# 本地Mock服务基础URL
VITE_APIFOX_MOCK_LOCAL_URL=http://127.0.0.1:4523/m1/7676691-7418764-6917011

# ==================== 生产环境API配置 ====================
# 生产环境API基础URL（Mock服务禁用时使用）
VITE_API_BASE_URL=/api
```

## 🔍 环境行为说明

### 开发环境 (development)

- **Mock服务**：默认启用
- **Mock类型**：可通过 `VITE_APIFOX_MOCK_TYPE` 切换云端/本地
- **使用场景**：
  - 前端开发时，后端接口尚未开发完成 → 使用Mock服务
  - 需要测试后端API连通性 → 设置 `VITE_ENABLE_MOCK=false`

### 测试环境 (test)

- **Mock服务**：默认启用
- **Mock类型**：可通过 `VITE_APIFOX_MOCK_TYPE` 切换云端/本地
- **使用场景**：
  - 自动化测试时，使用Mock数据作为数据源
  - 测试数据隔离，避免使用生产数据

### 生产环境 (production)

- **Mock服务**：强制禁用（无论环境变量如何设置）
- **API地址**：使用 `VITE_API_BASE_URL` 或默认 `/api`
- **安全保证**：生产环境不会使用Mock服务

## ✅ 验证结果

### 1. 类型检查

```bash
npx vue-tsc --noEmit --project tsconfig.app.json
# 结果：0 个错误
```

### 2. Linter检查

```bash
# 结果：无错误
```

### 3. 功能验证

- ✅ 生产环境强制禁用Mock
- ✅ 开发/测试环境默认启用Mock
- ✅ 支持云端/本地Mock切换
- ✅ Token鉴权仅在云端Mock时使用
- ✅ 所有配置项正常工作

## 📝 使用指南

### 开发环境使用Mock

```bash
# .env.development
VITE_ENABLE_MOCK=true
VITE_APIFOX_MOCK_TYPE=cloud  # 或 local
```

### 开发环境测试后端API

```bash
# .env.development
VITE_ENABLE_MOCK=false
VITE_API_BASE_URL=http://localhost:8080/api
```

### 测试环境使用Mock

```bash
# .env.test
VITE_ENABLE_MOCK=true
VITE_APIFOX_MOCK_TYPE=cloud
```

### 生产环境（自动禁用Mock）

```bash
# .env.production
# 无需配置Mock相关变量，系统会自动禁用Mock
VITE_API_BASE_URL=https://api.yourdomain.com
```

## 🔗 参考文档

- [Apifox Mock 文档](https://docs.apifox.com/mock)
- [Apifox 云端 Mock 文档](https://docs.apifox.com/cloud-mock)
- [Apifox 智能 Mock 文档](https://docs.apifox.com/smart-mock)
- [本地 API 文档](./openapi.yaml)

## ✅ 重构完成

所有重构已完成，Mock服务配置更加灵活和完善，支持环境隔离和云端/本地切换。
