# 状态管理流程图

## 用户状态管理流程

```mermaid
flowchart TD
    Start([状态初始化]) --> LoadToken[从localStorage加载Token]
    LoadToken --> CheckToken{Token是否存在}
    CheckToken -->|存在| SetToken[设置Token状态]
    CheckToken -->|不存在| LoadUserInfo[加载用户信息]
    SetToken --> LoadUserInfo
    LoadUserInfo --> CheckUserInfo{用户信息是否存在}
    CheckUserInfo -->|存在| ParseUserInfo[解析用户信息]
    CheckUserInfo -->|不存在| SetNull[设置为null]
    ParseUserInfo --> ValidateData{数据校验}
    ValidateData -->|有效| SetUserInfo[设置用户信息状态]
    ValidateData -->|无效| ClearStorage[清除存储]
    ClearStorage --> SetNull
    SetUserInfo --> End([初始化完成])
    SetNull --> End
```

## 登录状态流转图

```mermaid
stateDiagram-v2
    [*] --> 未登录: 初始状态
    未登录 --> 登录中: 发起登录请求
    登录中 --> 已登录: 登录成功
    登录中 --> 未登录: 登录失败
    已登录 --> 登出中: 发起登出
    登出中 --> 未登录: 登出完成
    已登录 --> 已登录: 刷新Token
```

## 状态持久化流程

```mermaid
flowchart LR
    Start([状态更新]) --> UpdateState[更新响应式状态]
    UpdateState --> CheckPersist{是否需要持久化}
    CheckPersist -->|是| Serialize[序列化数据]
    CheckPersist -->|否| End([完成])
    Serialize --> SaveStorage[保存到localStorage]
    SaveStorage --> CheckError{保存是否成功}
    CheckError -->|成功| End
    CheckError -->|失败| LogError[记录错误]
    LogError --> End
```

## 状态更新时序图

```mermaid
sequenceDiagram
    participant Component as 组件
    participant Store as Pinia Store
    participant State as 响应式状态
    participant Storage as localStorage

    Component->>Store: 调用setToken/setUserInfo
    Store->>State: 更新状态值
    State-->>Component: 触发响应式更新
    Store->>Storage: 保存到localStorage
    Storage-->>Store: 保存成功
    Store-->>Component: 返回更新结果
```

## 用户信息更新流程

```mermaid
flowchart TD
    Start([setUserInfo调用]) --> ValidateInput{验证输入}
    ValidateInput -->|无效| Reject[拒绝更新]
    ValidateInput -->|有效| UpdateState[更新userInfo状态]
    UpdateState --> Serialize[序列化为JSON]
    Serialize --> SaveStorage[保存到localStorage]
    SaveStorage --> CheckError{保存是否成功}
    CheckError -->|成功| NotifyComponents[通知组件更新]
    CheckError -->|失败| LogError[记录错误]
    NotifyComponents --> End([更新完成])
    LogError --> End
    Reject --> End
```text
