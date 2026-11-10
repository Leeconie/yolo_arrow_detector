# 模块间数据流向图

## 完整数据流向

```mermaid
flowchart TB
    subgraph "用户交互层"
        UserAction[用户操作]
    end
    
    subgraph "视图层"
        Component[组件]
        Page[页面]
    end
    
    subgraph "路由层"
        Router[路由管理]
        Guard[权限守卫]
    end
    
    subgraph "状态管理层"
        UserStore[用户Store]
        ThemeStore[主题Store]
        AppStore[应用Store]
    end
    
    subgraph "API层"
        Request[请求封装]
        Interceptor[拦截器]
    end
    
    subgraph "工具层"
        Utils[工具函数]
        Storage[本地存储]
    end
    
    subgraph "外部服务"
        Backend[后端API]
        LocalStorage[浏览器存储]
    end
    
    UserAction --> Component
    UserAction --> Page
    Component --> Router
    Component --> UserStore
    Component --> Request
    Page --> Router
    Page --> UserStore
    Page --> Request
    
    Router --> Guard
    Guard --> UserStore
    Guard --> Router
    
    UserStore --> Storage
    ThemeStore --> Storage
    AppStore --> Storage
    
    Request --> Interceptor
    Interceptor --> UserStore
    Interceptor --> Backend
    Backend --> Interceptor
    Interceptor --> UserStore
    Interceptor --> Component
    
    Storage --> LocalStorage
    Utils --> Storage
```

## 登录流程数据流

```mermaid
sequenceDiagram
    participant User as 用户
    participant LoginPage as 登录页
    participant API as API封装
    participant Backend as 后端
    participant UserStore as 用户Store
    participant Storage as 本地存储

    User->>LoginPage: 输入账号密码
    LoginPage->>API: 调用登录接口
    API->>Backend: 发送登录请求
    Backend-->>API: 返回Token和用户信息
    API->>UserStore: 更新Token和用户信息
    UserStore->>Storage: 持久化Token和用户信息
    UserStore-->>LoginPage: 返回登录结果
    LoginPage->>LoginPage: 跳转到首页
```

## 状态更新数据流

```mermaid
flowchart LR
    Component[组件] -->|调用方法| Store[Store]
    Store -->|更新状态| ReactiveState[响应式状态]
    ReactiveState -->|触发更新| Component
    Store -->|持久化| Storage[本地存储]
    Storage -->|恢复| Store
```text
