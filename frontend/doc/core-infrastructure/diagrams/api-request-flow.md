# API请求流程图

## API请求完整流程

```mermaid
flowchart TD
    Start([组件发起请求]) --> CheckToken{检查Token}
    CheckToken -->|有Token| AddToken[添加Token到请求头]
    CheckToken -->|无Token| SetHeaders[设置请求头]
    AddToken --> SetHeaders
    SetHeaders --> SendRequest[发送HTTP请求]
    SendRequest --> WaitResponse[等待服务器响应]
    WaitResponse --> CheckResponse{检查响应状态}
    CheckResponse -->|成功| ParseData[解析响应数据]
    CheckResponse -->|失败| HandleError[处理错误]
    ParseData --> CheckCode{检查业务码}
    CheckCode -->|code=200| ReturnData[返回数据]
    CheckCode -->|code!=200| HandleError
    HandleError --> CheckErrorCode{检查错误码}
    CheckErrorCode -->|401| RedirectLogin[跳转登录页]
    CheckErrorCode -->|403| ShowForbidden[提示无权限]
    CheckErrorCode -->|其他| ShowError[显示错误消息]
    ReturnData --> End([返回给组件])
    RedirectLogin --> End
    ShowForbidden --> End
    ShowError --> End
```

## 请求拦截器流程

```mermaid
flowchart LR
    Start([请求拦截器]) --> GetToken[从Store获取Token]
    GetToken --> CheckToken{Token是否存在}
    CheckToken -->|存在| AddAuthHeader[添加Authorization头]
    CheckToken -->|不存在| SetContentType[设置Content-Type]
    AddAuthHeader --> SetContentType
    SetContentType --> AddTimestamp{是否为GET请求}
    AddTimestamp -->|是| AddTimeParam[添加时间戳参数]
    AddTimestamp -->|否| ReturnConfig[返回配置]
    AddTimeParam --> ReturnConfig
    ReturnConfig --> End([继续发送请求])
```

## 响应拦截器流程

```mermaid
flowchart TD
    Start([响应拦截器]) --> GetResponse[获取响应数据]
    GetResponse --> CheckCode{检查code}
    CheckCode -->|code=200| ExtractData[提取data字段]
    CheckCode -->|code!=200| CheckErrorCode{检查错误码}
    ExtractData --> ReturnData[返回数据]
    CheckErrorCode -->|401| Logout[清除登录状态]
    CheckErrorCode -->|403| ShowForbidden[提示无权限]
    CheckErrorCode -->|其他| ShowError[显示错误消息]
    Logout --> RedirectLogin[跳转登录页]
    ShowForbidden --> Reject[拒绝Promise]
    ShowError --> Reject
    RedirectLogin --> Reject
    ReturnData --> End([返回给调用者])
    Reject --> End
```

## API请求时序图

```mermaid
sequenceDiagram
    participant Component as 组件
    participant Interceptor as 请求拦截器
    participant Axios as Axios实例
    participant Server as 服务器
    participant ResponseInterceptor as 响应拦截器

    Component->>Interceptor: 发起请求
    Interceptor->>Interceptor: 获取Token
    Interceptor->>Interceptor: 添加请求头
    Interceptor->>Axios: 传递配置
    Axios->>Server: 发送HTTP请求
    Server-->>Axios: 返回响应
    Axios->>ResponseInterceptor: 传递响应
    ResponseInterceptor->>ResponseInterceptor: 检查响应码
    alt 响应成功
        ResponseInterceptor->>ResponseInterceptor: 提取data字段
        ResponseInterceptor-->>Component: 返回数据
    else 响应失败
        ResponseInterceptor->>ResponseInterceptor: 处理错误
        ResponseInterceptor-->>Component: 抛出错误
    end
```

## 错误处理流程

```mermaid
flowchart TD
    Start([捕获错误]) --> CheckType{错误类型}
    CheckType -->|响应错误| GetStatus[获取HTTP状态码]
    CheckType -->|网络错误| ShowNetworkError[显示网络错误]
    CheckType -->|请求错误| ShowRequestError[显示请求错误]
    GetStatus --> CheckStatus{状态码}
    CheckStatus -->|401| ClearToken[清除Token]
    CheckStatus -->|403| ShowForbidden[提示无权限]
    CheckStatus -->|404| ShowNotFound[提示资源不存在]
    CheckStatus -->|500| ShowServerError[提示服务器错误]
    CheckStatus -->|其他| ShowCustomError[显示自定义错误]
    ClearToken --> RedirectLogin[跳转登录页]
    ShowForbidden --> End([结束])
    ShowNotFound --> End
    ShowServerError --> End
    ShowCustomError --> End
    ShowNetworkError --> End
    ShowRequestError --> End
    RedirectLogin --> End
```

## 请求取消机制流程

```mermaid
flowchart TD
    Start([组件发起请求]) --> CreateController[创建AbortController]
    CreateController --> SetSignal[设置signal到请求配置]
    SetSignal --> SendRequest[发送HTTP请求]
    SendRequest --> CheckCancel{是否取消}
    CheckCancel -->|未取消| WaitResponse[等待响应]
    CheckCancel -->|已取消| AbortRequest[中止请求]
    WaitResponse --> CheckCancel2{检查取消状态}
    CheckCancel2 -->|已取消| AbortRequest
    CheckCancel2 -->|未取消| ReceiveResponse[接收响应]
    AbortRequest --> RejectPromise[拒绝Promise]
    ReceiveResponse --> ReturnData[返回数据]
    RejectPromise --> End([结束])
    ReturnData --> End
```

## 请求取消时序图

```mermaid
sequenceDiagram
    participant Component as 组件
    participant Controller as AbortController
    participant Request as 请求封装
    participant Axios as Axios实例
    participant Server as 服务器

    Component->>Controller: 创建AbortController
    Component->>Request: 发起请求（带signal）
    Request->>Axios: 发送请求（signal已设置）
    Axios->>Server: HTTP请求
    
    alt 请求完成前取消
        Component->>Controller: abort()
        Controller->>Axios: 发送取消信号
        Axios->>Server: 取消请求
        Axios-->>Request: 抛出CanceledError
        Request-->>Component: 拒绝Promise
    else 请求正常完成
        Server-->>Axios: 返回响应
        Axios-->>Request: 返回数据
        Request-->>Component: 返回数据
    end
```

## 请求重试机制流程

```mermaid
flowchart TD
    Start([发起请求]) --> ExecuteRequest[执行请求]
    ExecuteRequest --> CheckSuccess{请求成功?}
    CheckSuccess -->|成功| ReturnData[返回数据]
    CheckSuccess -->|失败| CheckSkipRetry{是否跳过重试?}
    CheckSkipRetry -->|是| ThrowError[抛出错误]
    CheckSkipRetry -->|否| CheckCanceled{是否已取消?}
    CheckCanceled -->|是| ThrowError
    CheckCanceled -->|否| CheckShouldRetry{是否应该重试?}
    CheckShouldRetry -->|否| ThrowError
    CheckShouldRetry -->|是| CheckRetryCount{重试次数<最大次数?}
    CheckRetryCount -->|否| ThrowError
    CheckRetryCount -->|是| CalculateDelay[计算延迟时间<br/>指数退避算法]
    CalculateDelay --> WaitDelay[等待延迟时间]
    WaitDelay --> IncrementCount[重试次数+1]
    IncrementCount --> ExecuteRequest
    ReturnData --> End([结束])
    ThrowError --> End
```

## 请求重试条件判断

```mermaid
flowchart TD
    Start([捕获错误]) --> CheckErrorType{错误类型}
    CheckErrorType -->|网络错误<br/>无响应| RetryYes[应该重试]
    CheckErrorType -->|5xx服务器错误| RetryYes
    CheckErrorType -->|408超时错误| RetryYes
    CheckErrorType -->|4xx客户端错误| RetryNo[不应该重试]
    CheckErrorType -->|已取消| RetryNo
    CheckErrorType -->|其他错误| RetryNo
    RetryYes --> End([继续重试流程])
    RetryNo --> End
```

## 指数退避算法

```mermaid
flowchart TD
    Start([计算重试延迟]) --> GetRetryCount[获取当前重试次数]
    GetRetryCount --> CalculateBase[计算基础延迟<br/>delay = 2^retryCount * 1000ms]
    CalculateBase --> CheckMaxDelay{延迟 > 最大延迟?}
    CheckMaxDelay -->|是| UseMaxDelay[使用最大延迟<br/>30000ms]
    CheckMaxDelay -->|否| UseCalculated[使用计算的延迟]
    UseMaxDelay --> ReturnDelay[返回延迟时间]
    UseCalculated --> ReturnDelay
    ReturnDelay --> End([等待后重试])
    
    Note1[示例:<br/>第1次重试: 1000ms<br/>第2次重试: 2000ms<br/>第3次重试: 4000ms<br/>第4次重试: 8000ms<br/>...<br/>最大延迟: 30000ms]
```text
