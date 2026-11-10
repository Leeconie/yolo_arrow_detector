# 权限守卫流程图

## 路由守卫完整流程

```mermaid
flowchart TD
    Start([路由跳转]) --> BeforeEach[beforeEach守卫触发]
    BeforeEach --> CheckAuth{路由是否需要认证}
    CheckAuth -->|不需要| CheckLoginPage{是否为登录页}
    CheckAuth -->|需要| CheckLoginStatus{检查登录状态}
    CheckLoginStatus -->|已登录| CheckPermission{检查权限}
    CheckLoginStatus -->|未登录| SaveRedirect[保存原始路径]
    SaveRedirect --> RedirectLogin[跳转登录页]
    CheckLoginPage -->|是| CheckLoggedIn{是否已登录}
    CheckLoginPage -->|否| SetTitle[设置页面标题]
    CheckLoggedIn -->|已登录| RedirectHome[跳转首页]
    CheckLoggedIn -->|未登录| SetTitle
    CheckPermission -->|有权限| SetTitle
    CheckPermission -->|无权限| ShowForbidden[提示无权限]
    SetTitle --> AllowNavigation[允许导航]
    ShowForbidden --> BlockNavigation[阻止导航]
    RedirectLogin --> BlockNavigation
    RedirectHome --> BlockNavigation
    AllowNavigation --> End([页面渲染])
    BlockNavigation --> End
```

## 权限校验决策树

```mermaid
flowchart TD
    Start([开始权限检查]) --> GetRouteMeta[获取路由元信息]
    GetRouteMeta --> CheckRequiresAuth{requiresAuth}
    CheckRequiresAuth -->|false| Allow[允许访问]
    CheckRequiresAuth -->|true| GetUserStore[获取用户Store]
    GetUserStore --> CheckToken{Token是否存在}
    CheckToken -->|不存在| Deny[拒绝访问]
    CheckToken -->|存在| CheckUserInfo{用户信息是否存在}
    CheckUserInfo -->|不存在| Deny
    CheckUserInfo -->|存在| CheckRoles{是否需要角色}
    CheckRoles -->|不需要| CheckPermissions{是否需要权限}
    CheckRoles -->|需要| MatchRoles{角色是否匹配}
    MatchRoles -->|匹配| CheckPermissions
    MatchRoles -->|不匹配| Deny
    CheckPermissions -->|不需要| Allow
    CheckPermissions -->|需要| MatchPermissions{权限是否匹配}
    MatchPermissions -->|匹配| Allow
    MatchPermissions -->|不匹配| Deny
    Allow --> End([允许访问])
    Deny --> End
```

## 路由守卫时序图

```mermaid
sequenceDiagram
    participant User as 用户
    participant Router as 路由实例
    participant Guard as 权限守卫
    participant Store as 用户Store
    participant Component as 目标组件

    User->>Router: 触发路由跳转
    Router->>Guard: 调用beforeEach
    Guard->>Guard: 获取路由元信息
    Guard->>Store: 检查登录状态
    Store-->>Guard: 返回登录状态
    alt 需要认证且未登录
        Guard->>Router: 阻止导航
        Guard->>Router: 跳转登录页
        Router-->>User: 显示登录页
    else 已登录
        Guard->>Guard: 检查权限
        alt 有权限
            Guard->>Guard: 设置页面标题
            Guard->>Router: 允许导航
            Router->>Component: 加载组件
            Component-->>User: 渲染页面
        else 无权限
            Guard->>Router: 阻止导航
            Guard->>Router: 显示无权限提示
            Router-->>User: 显示错误信息
        end
    end
```

## 登录状态检查流程

```mermaid
flowchart LR
    Start([检查登录状态]) --> GetStore[获取用户Store]
    GetStore --> CheckToken{Token是否存在}
    CheckToken -->|存在| CheckValid{Token是否有效}
    CheckToken -->|不存在| NotLoggedIn[未登录]
    CheckValid -->|有效| CheckUserInfo{用户信息是否存在}
    CheckValid -->|无效| NotLoggedIn
    CheckUserInfo -->|存在| LoggedIn[已登录]
    CheckUserInfo -->|不存在| NotLoggedIn
    LoggedIn --> End([返回true])
    NotLoggedIn --> End
```

## 权限不足处理流程

```mermaid
flowchart TD
    Start([权限不足]) --> CheckType{权限不足类型}
    CheckType -->|未登录| SavePath[保存原始路径]
    CheckType -->|无权限| ShowMessage[显示无权限提示]
    SavePath --> RedirectLogin[跳转到登录页]
    ShowMessage --> CheckAction{用户操作}
    CheckAction -->|返回上一页| GoBack[返回上一页]
    CheckAction -->|返回首页| RedirectHome[跳转首页]
    RedirectLogin --> End([结束])
    GoBack --> End
    RedirectHome --> End
```text
