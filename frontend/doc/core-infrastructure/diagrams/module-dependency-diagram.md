# 核心基础设施模块依赖关系图

## 模块依赖关系

```mermaid
graph TB
    subgraph "核心基础设施模块"
        API[API封装<br/>core/api]
        Config[配置管理<br/>core/config]
        Types[类型定义<br/>types/]
        Stores[状态管理<br/>stores/]
        Router[路由管理<br/>router/]
        Utils[工具函数<br/>utils/]
        Assets[静态资源<br/>assets/]
    end
    
    subgraph "业务模块"
        Business1[业务模块1]
        Business2[业务模块2]
        Business3[业务模块3]
    end
    
    API --> Types
    API --> Config
    API --> Stores
    Router --> Stores
    Router --> Types
    Stores --> Types
    Utils --> Types
    
    Business1 --> API
    Business1 --> Stores
    Business1 --> Router
    Business1 --> Utils
    Business1 --> Types
    
    Business2 --> API
    Business2 --> Stores
    Business2 --> Router
    Business2 --> Utils
    Business2 --> Types
    
    Business3 --> API
    Business3 --> Stores
    Business3 --> Router
    Business3 --> Utils
    Business3 --> Types
```

## 数据流向图

```mermaid
flowchart LR
    subgraph "前端应用"
        Component[组件]
        Page[页面]
    end
    
    subgraph "核心基础设施"
        Router[路由管理]
        Store[状态管理]
        API[API封装]
        Utils[工具函数]
    end
    
    subgraph "外部服务"
        Backend[后端API]
        Storage[本地存储]
    end
    
    Component --> Router
    Component --> Store
    Component --> Utils
    Page --> Router
    Page --> Store
    Page --> API
    
    Router --> Store
    API --> Backend
    API --> Store
    Store --> Storage
    Utils --> Storage
```

## 模块说明

- **API封装**：提供统一的HTTP请求接口，处理请求拦截、响应拦截、错误处理
- **配置管理**：管理环境变量、常量定义
- **类型定义**：提供TypeScript类型定义，确保类型安全
- **状态管理**：基于Pinia的全局状态管理
- **路由管理**：基于vue-router的路由配置和权限守卫
- **工具函数**：提供日期、字符串、加密、校验、存储等工具函数
- **静态资源**：CSS变量、通用样式等静态资源
