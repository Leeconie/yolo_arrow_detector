# API请求性能优化流程图

本文档描述API请求性能优化的流程图，包括请求缓存机制、并发控制、拦截器优化和性能对比。

## 1. 请求缓存机制流程图

### 1.1 缓存命中流程

```mermaid
flowchart TD
    Start([发起GET请求]) --> CheckCache{检查缓存}
    CheckCache -->|缓存存在| CheckExpire{检查是否过期}
    CheckExpire -->|未过期| GetCache[获取缓存数据]
    CheckExpire -->|已过期| RemoveCache[删除过期缓存]
    GetCache --> ReturnCache[返回缓存数据]
    RemoveCache --> SendRequest[发送HTTP请求]
    CheckCache -->|缓存不存在| SendRequest
    SendRequest --> WaitResponse[等待服务器响应]
    WaitResponse --> StoreCache[存储响应到缓存]
    StoreCache --> ReturnData[返回响应数据]
    ReturnCache --> End([结束])
    ReturnData --> End
```

### 1.2 缓存失效流程

```mermaid
flowchart TD
    Start([缓存失效触发]) --> CheckType{失效类型}
    CheckType -->|时间过期| TimeExpire[TTL过期检查]
    CheckType -->|手动清除| ManualClear[调用clear方法]
    CheckType -->|版本控制| VersionCheck[版本号变更检查]
    TimeExpire --> RemoveExpired[删除过期缓存]
    ManualClear --> RemoveAll[清除所有缓存]
    VersionCheck --> RemoveVersion[删除旧版本缓存]
    RemoveExpired --> UpdateStats[更新统计信息]
    RemoveAll --> UpdateStats
    RemoveVersion --> UpdateStats
    UpdateStats --> End([结束])
```

### 1.3 缓存更新流程

```mermaid
flowchart TD
    Start([请求响应成功]) --> CheckMethod{请求方法}
    CheckMethod -->|GET| CheckCacheable{是否可缓存}
    CheckMethod -->|POST/PUT/DELETE| InvalidateRelated[使相关缓存失效]
    CheckCacheable -->|可缓存| GenerateKey[生成缓存键]
    CheckCacheable -->|不可缓存| SkipCache[跳过缓存]
    GenerateKey --> CheckSize{检查缓存大小}
    CheckSize -->|未超限| StoreCache[存储到缓存]
    CheckSize -->|超限| LRURemove[LRU移除最旧缓存]
    LRURemove --> StoreCache
    StoreCache --> SetTTL[设置过期时间]
    SetTTL --> UpdateStats[更新统计信息]
    InvalidateRelated --> End([结束])
    SkipCache --> End
    UpdateStats --> End
```

## 2. 请求并发控制流程图

### 2.1 请求队列处理流程

```mermaid
flowchart TD
    Start([新请求到达]) --> CheckConcurrency{检查当前并发数}
    CheckConcurrency -->|未达上限| ExecuteRequest[立即执行请求]
    CheckConcurrency -->|已达上限| AddToQueue[加入请求队列]
    AddToQueue --> CheckPriority{检查优先级}
    CheckPriority -->|高优先级| InsertFront[插入队列前端]
    CheckPriority -->|普通优先级| AppendBack[追加到队列末尾]
    InsertFront --> WaitSlot[等待可用槽位]
    AppendBack --> WaitSlot
    ExecuteRequest --> IncrementConcurrency[增加并发计数]
    IncrementConcurrency --> ProcessRequest[处理请求]
    ProcessRequest --> DecrementConcurrency[减少并发计数]
    DecrementConcurrency --> CheckQueue{检查队列}
    CheckQueue -->|队列非空| ProcessNext[处理下一个请求]
    CheckQueue -->|队列为空| End([结束])
    WaitSlot --> CheckSlot{检查槽位}
    CheckSlot -->|有槽位| ExecuteRequest
    CheckSlot -->|无槽位| WaitSlot
    ProcessNext --> ExecuteRequest
```

### 2.2 请求去重流程

```mermaid
flowchart TD
    Start([新请求到达]) --> GenerateKey[生成请求唯一键]
    GenerateKey --> CheckDuplicate{检查重复请求}
    CheckDuplicate -->|存在相同请求| CheckStatus{检查请求状态}
    CheckDuplicate -->|不存在| AddToMap[添加到请求映射]
    CheckStatus -->|进行中| MergeRequest[合并到现有请求]
    CheckStatus -->|已完成| ReturnCached[返回缓存结果]
    MergeRequest --> WaitPromise[等待现有Promise]
    WaitPromise --> ReturnResult[返回结果]
    AddToMap --> ExecuteRequest[执行请求]
    ExecuteRequest --> StorePromise[存储Promise]
    StorePromise --> WaitResponse[等待响应]
    WaitResponse --> RemoveFromMap[从映射中移除]
    RemoveFromMap --> ReturnResult
    ReturnCached --> End([结束])
    ReturnResult --> End
```

### 2.3 优先级处理流程

```mermaid
flowchart TD
    Start([请求队列]) --> CheckPriority{检查优先级}
    CheckPriority -->|高优先级| HighPriorityQueue[高优先级队列]
    CheckPriority -->|普通优先级| NormalPriorityQueue[普通优先级队列]
    HighPriorityQueue --> CheckHighEmpty{高优先级队列是否为空}
    NormalPriorityQueue --> CheckNormalEmpty{普通优先级队列是否为空}
    CheckHighEmpty -->|非空| ProcessHigh[处理高优先级请求]
    CheckHighEmpty -->|为空| CheckNormalEmpty
    CheckNormalEmpty -->|非空| ProcessNormal[处理普通优先级请求]
    CheckNormalEmpty -->|为空| End([结束])
    ProcessHigh --> DequeueHigh[出队高优先级请求]
    ProcessNormal --> DequeueNormal[出队普通优先级请求]
    DequeueHigh --> ExecuteRequest[执行请求]
    DequeueNormal --> ExecuteRequest
    ExecuteRequest --> End
```

## 3. 请求拦截器性能优化流程图

### 3.1 优化前流程

```mermaid
flowchart TD
    Start([请求拦截器]) --> GetUserStore[每次调用useUserStore]
    GetUserStore --> GetToken[每次获取Token]
    GetToken --> CheckTokenRefresh[每次检查Token刷新]
    CheckTokenRefresh --> GetCsrfToken[每次生成CSRF Token]
    GetCsrfToken --> AddHeaders[设置所有请求头]
    AddHeaders --> AddTimestamp[为所有GET请求添加时间戳]
    AddTimestamp --> ReturnConfig[返回配置]
    ReturnConfig --> End([结束])
```

### 3.2 优化后流程

```mermaid
flowchart TD
    Start([请求拦截器]) --> CheckTokenCache{检查Token缓存}
    CheckTokenCache -->|缓存有效| UseCachedToken[使用缓存Token]
    CheckTokenCache -->|缓存无效| GetUserStore[获取UserStore]
    GetUserStore --> RefreshToken[刷新Token]
    RefreshToken --> CacheToken[缓存Token]
    CacheToken --> UseCachedToken
    UseCachedToken --> CheckCsrfCache{检查CSRF Token缓存}
    CheckCsrfCache -->|缓存有效| UseCachedCsrf[使用缓存CSRF Token]
    CheckCsrfCache -->|缓存无效| GenerateCsrf[生成CSRF Token]
    GenerateCsrf --> CacheCsrf[缓存CSRF Token]
    CacheCsrf --> UseCachedCsrf
    UseCachedCsrf --> ConditionalHeaders{条件设置请求头}
    ConditionalHeaders -->|需要| AddHeaders[设置请求头]
    ConditionalHeaders -->|不需要| SkipHeaders[跳过请求头]
    AddHeaders --> CheckCacheControl{检查缓存控制}
    CheckCacheControl -->|需要防缓存| AddTimestamp[添加时间戳]
    CheckCacheControl -->|不需要| SkipTimestamp[跳过时间戳]
    SkipHeaders --> ReturnConfig[返回配置]
    AddTimestamp --> ReturnConfig
    SkipTimestamp --> ReturnConfig
    ReturnConfig --> End([结束])
```

### 3.3 性能优化对比

```mermaid
flowchart LR
    subgraph Before[优化前]
        B1[每次获取Store] --> B2[每次获取Token]
        B2 --> B3[每次生成CSRF]
        B3 --> B4[设置所有请求头]
        B4 --> B5[所有GET添加时间戳]
    end
    
    subgraph After[优化后]
        A1[缓存Token] --> A2[缓存CSRF]
        A2 --> A3[条件设置请求头]
        A3 --> A4[条件添加时间戳]
    end
    
    Before -->|性能提升| After
```

## 4. 性能优化前后对比图

### 4.1 响应时间对比

```mermaid
graph LR
    subgraph Before[优化前]
        B1[首次请求: 200ms]
        B2[重复请求: 200ms]
        B3[并发请求: 500ms]
    end
    
    subgraph After[优化后]
        A1[首次请求: 200ms]
        A2[缓存命中: 5ms]
        A3[并发请求: 300ms]
    end
    
    Before -->|性能提升| After
```

### 4.2 并发处理能力对比

```mermaid
graph TD
    subgraph Before[优化前]
        B1[无并发控制]
        B2[请求阻塞]
        B3[响应时间: 500ms+]
    end
    
    subgraph After[优化后]
        A1[并发队列管理]
        A2[请求优先级]
        A3[响应时间: 300ms]
    end
    
    Before -->|性能提升| After
```

### 4.3 缓存命中率统计

```mermaid
flowchart TD
    Start([请求统计]) --> CountTotal[总请求数]
    CountTotal --> CountCacheHit[缓存命中数]
    CountCacheHit --> CountCacheMiss[缓存未命中数]
    CountCacheMiss --> CalculateRate[计算命中率]
    CalculateRate --> CheckTarget{命中率≥60%?}
    CheckTarget -->|是| Success[达到目标]
    CheckTarget -->|否| Optimize[优化缓存策略]
    Optimize --> AdjustTTL[调整TTL]
    AdjustTTL --> AdjustSize[调整缓存大小]
    AdjustSize --> CheckTarget
    Success --> End([结束])
```

### 4.4 性能监控指标

```mermaid
flowchart TD
    Start([性能监控]) --> TrackRequestTime[跟踪请求耗时]
    TrackRequestTime --> TrackCacheHit[跟踪缓存命中率]
    TrackCacheHit --> TrackConcurrency[跟踪并发数]
    TrackConcurrency --> TrackMemory[跟踪内存使用]
    TrackMemory --> GenerateReport[生成性能报告]
    GenerateReport --> CheckMetrics{检查指标}
    CheckMetrics -->|达标| Success[性能达标]
    CheckMetrics -->|未达标| Alert[性能告警]
    Alert --> Optimize[优化建议]
    Optimize --> End([结束])
    Success --> End
```

## 5. 完整性能优化流程

```mermaid
flowchart TD
    Start([API请求]) --> CheckCache{检查缓存}
    CheckCache -->|命中| ReturnCache[返回缓存]
    CheckCache -->|未命中| CheckQueue{检查并发队列}
    CheckQueue -->|队列未满| ExecuteRequest[执行请求]
    CheckQueue -->|队列已满| WaitQueue[等待队列]
    WaitQueue --> ExecuteRequest
    ExecuteRequest --> OptimizeInterceptor[优化拦截器]
    OptimizeInterceptor --> SendRequest[发送请求]
    SendRequest --> TrackPerformance[性能监控]
    TrackPerformance --> StoreCache[存储缓存]
    StoreCache --> ReturnData[返回数据]
    ReturnCache --> End([结束])
    ReturnData --> End
```

## 优化要点总结

1. **缓存机制**：
   - LRU缓存策略
   - TTL过期控制
   - 版本控制失效
   - 缓存大小限制

1. **并发控制**：
   - 最大并发数限制
   - 请求队列管理
   - 优先级处理
   - 请求去重

1. **拦截器优化**：
   - Token缓存
   - CSRF Token缓存
   - 条件请求头设置
   - 条件时间戳添加

1. **性能监控**：
   - 请求耗时统计
   - 缓存命中率统计
   - 并发数统计
   - 内存使用统计
