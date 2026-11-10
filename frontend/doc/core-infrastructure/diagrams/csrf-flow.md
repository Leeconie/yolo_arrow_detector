# CSRF防护流程图

## CSRF Token生成流程

```mermaid
flowchart TD
    Start([需要CSRF Token]) --> CheckCrypto{检查crypto API}
    CheckCrypto -->|可用| UseCrypto[使用crypto.getRandomValues<br/>生成32字节随机数]
    CheckCrypto -->|不可用| UseMathRandom[使用Math.random降级方案]
    UseCrypto --> ConvertHex[转换为16进制字符串<br/>64字符]
    UseMathRandom --> CombineRandom[组合随机字符串<br/>+ 时间戳]
    ConvertHex --> ReturnToken[返回Token]
    CombineRandom --> ReturnToken
    ReturnToken --> End([Token生成完成])
```

## CSRF Token存储流程

```mermaid
flowchart TD
    Start([设置CSRF Token]) --> ValidateToken{验证Token}
    ValidateToken -->|无效| End([结束])
    ValidateToken -->|有效| SetStorage[存储到localStorage<br/>key: csrfToken]
    SetStorage --> SetExpiry[设置过期时间<br/>默认3600秒]
    SetExpiry --> End
```

## CSRF Token获取流程

```mermaid
flowchart TD
    Start([获取CSRF Token]) --> GetStorage[从localStorage获取]
    GetStorage --> CheckExists{Token是否存在?}
    CheckExists -->|存在| CheckExpiry{是否过期?}
    CheckExists -->|不存在| GenerateNew[生成新Token]
    CheckExpiry -->|未过期| ReturnToken[返回现有Token]
    CheckExpiry -->|已过期| GenerateNew
    GenerateNew --> SetStorage[存储新Token]
    SetStorage --> ReturnToken
    ReturnToken --> End([返回Token])
```

## CSRF Token验证流程

```mermaid
flowchart TD
    Start([验证CSRF Token]) --> CheckInput{输入Token是否存在?}
    CheckInput -->|不存在| ReturnFalse[返回false]
    CheckInput -->|存在| GetStored[获取存储的Token]
    GetStored --> Compare{比较Token}
    Compare -->|匹配| ReturnTrue[返回true]
    Compare -->|不匹配| ReturnFalse
    ReturnTrue --> End([验证完成])
    ReturnFalse --> End
```

## CSRF Token刷新流程

```mermaid
flowchart TD
    Start([刷新CSRF Token]) --> GenerateNew[生成新Token]
    GenerateNew --> ClearOld[清除旧Token]
    ClearOld --> SetNew[设置新Token]
    SetNew --> ReturnNew[返回新Token]
    ReturnNew --> End([刷新完成])
```

## CSRF防护在请求拦截器中的集成

```mermaid
flowchart TD
    Start([请求拦截器]) --> CheckEnable{是否启用CSRF防护?}
    CheckEnable -->|否| SkipCSRF[跳过CSRF处理]
    CheckEnable -->|是| GetToken[获取CSRF Token]
    GetToken --> CheckToken{Token是否存在?}
    CheckToken -->|不存在| GenerateToken[生成新Token]
    CheckToken -->|存在| AddHeader[添加Token到请求头]
    GenerateToken --> AddHeader
    AddHeader --> AddAltHeader[同时添加备用Header<br/>X-XSRF-TOKEN]
    AddAltHeader --> Continue[继续请求流程]
    SkipCSRF --> Continue
    Continue --> End([发送请求])
```

## CSRF防护完整流程

```mermaid
sequenceDiagram
    participant App as 应用启动
    participant CSRF as CSRF模块
    participant Storage as localStorage
    participant Interceptor as 请求拦截器
    participant Server as 服务器

    App->>CSRF: 首次需要Token
    CSRF->>Storage: 检查是否存在Token
    Storage-->>CSRF: Token不存在
    CSRF->>CSRF: 生成新Token
    CSRF->>Storage: 存储Token
    
    App->>Interceptor: 发起请求
    Interceptor->>CSRF: 获取CSRF Token
    CSRF->>Storage: 读取Token
    Storage-->>CSRF: 返回Token
    CSRF-->>Interceptor: 返回Token
    Interceptor->>Interceptor: 添加Token到请求头<br/>X-CSRF-Token
    Interceptor->>Server: 发送请求（带Token）
    Server-->>Interceptor: 验证Token并返回响应
    
    alt Token过期或需要刷新
        App->>CSRF: 刷新Token
        CSRF->>CSRF: 生成新Token
        CSRF->>Storage: 更新Token
    end
```

## CSRF Token生命周期

```mermaid
stateDiagram-v2
    [*] --> 不存在: 应用启动
    不存在 --> 已生成: 首次获取Token
    已生成 --> 已存储: 存储到localStorage
    已存储 --> 已使用: 添加到请求头
    已使用 --> 已存储: 请求完成
    已存储 --> 已过期: 超过3600秒
    已过期 --> 已生成: 重新生成
    已存储 --> 已刷新: 主动刷新
    已刷新 --> 已存储: 更新存储
    已存储 --> [*]: 清除Token
```text
