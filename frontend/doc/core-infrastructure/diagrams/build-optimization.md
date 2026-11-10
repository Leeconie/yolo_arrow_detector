# 构建产物优化流程图

本文档描述构建产物优化的流程图，包括代码分割、静态资源处理、打包体积优化和构建分析。

## 1. 代码分割策略流程图

### 1.1 路由懒加载流程

```mermaid
flowchart TD
    Start([路由访问]) --> CheckLoaded{检查是否已加载}
    CheckLoaded -->|已加载| UseCached[使用缓存的模块]
    CheckLoaded -->|未加载| DynamicImport[动态导入模块]
    DynamicImport --> LoadChunk[加载代码块]
    LoadChunk --> ExecuteModule[执行模块]
    ExecuteModule --> CacheModule[缓存模块]
    CacheModule --> UseModule[使用模块]
    UseCached --> End([结束])
    UseModule --> End
```

### 1.2 模块分割流程

```mermaid
flowchart TD
    Start([构建过程]) --> AnalyzeDeps[分析依赖关系]
    AnalyzeDeps --> SplitByRoute[按路由分割]
    AnalyzeDeps --> SplitByModule[按模块分割]
    SplitByRoute --> CreateRouteChunk[创建路由代码块]
    SplitByModule --> CreateModuleChunk[创建模块代码块]
    CreateRouteChunk --> ExtractCommon[提取公共代码]
    CreateModuleChunk --> ExtractCommon
    ExtractCommon --> CreateVendorChunk[创建vendor代码块]
    CreateVendorChunk --> End([结束])
```

### 1.3 第三方库分割流程

```mermaid
flowchart TD
    Start([构建过程]) --> IdentifyVendor[识别第三方库]
    IdentifyVendor --> CheckSize{检查库大小}
    CheckSize -->|大型库| SeparateChunk[分离为独立代码块]
    CheckSize -->|小型库| MergeCommon[合并到公共代码块]
    SeparateChunk --> LazyLoad[按需懒加载]
    MergeCommon --> Bundle[打包]
    LazyLoad --> End([结束])
    Bundle --> End
```

## 2. 静态资源处理优化流程图

### 2.1 图片压缩流程

```mermaid
flowchart TD
    Start([图片资源]) --> CheckFormat{检查格式}
    CheckFormat -->|未优化| CompressImage[压缩图片]
    CheckFormat -->|已优化| SkipCompress[跳过压缩]
    CompressImage --> OptimizeFormat[优化格式]
    OptimizeFormat --> GenerateWebP[生成WebP格式]
    GenerateWebP --> StoreOptimized[存储优化后的图片]
    SkipCompress --> End([结束])
    StoreOptimized --> End
```

### 2.2 字体优化流程

```mermaid
flowchart TD
    Start([字体文件]) --> CheckSubset{检查是否需要子集化}
    CheckSubset -->|需要| CreateSubset[创建字体子集]
    CheckSubset -->|不需要| CheckFormat{检查格式}
    CreateSubset --> CheckFormat
    CheckFormat -->|非WOFF2| ConvertFormat[转换为WOFF2]
    CheckFormat -->|WOFF2| StoreFont[存储字体]
    ConvertFormat --> StoreFont
    StoreFont --> End([结束])
```

### 2.3 资源懒加载流程

```mermaid
flowchart TD
    Start([资源请求]) --> CheckViewport{检查视口}
    CheckViewport -->|在视口内| LoadResource[加载资源]
    CheckViewport -->|不在视口内| WaitScroll[等待滚动]
    LoadResource --> DisplayResource[显示资源]
    WaitScroll --> CheckViewport
    DisplayResource --> End([结束])
```

## 3. 打包体积优化流程图

### 3.1 tree-shaking流程

```mermaid
flowchart TD
    Start([构建过程]) --> AnalyzeImports[分析导入]
    AnalyzeImports --> MarkUsed[标记使用的代码]
    MarkUsed --> RemoveUnused[移除未使用的代码]
    RemoveUnused --> OptimizeBundle[优化打包]
    OptimizeBundle --> End([结束])
```

### 3.2 代码压缩流程

```mermaid
flowchart TD
    Start([构建产物]) --> MinifyJS[压缩JavaScript]
    MinifyJS --> MinifyCSS[压缩CSS]
    MinifyCSS --> MinifyHTML[压缩HTML]
    MinifyHTML --> OptimizeNames[优化变量名]
    OptimizeNames --> End([结束])
```

### 3.3 Gzip/Brotli压缩流程

```mermaid
flowchart TD
    Start([构建产物]) --> CheckServer{检查服务器支持}
    CheckServer -->|支持Brotli| CompressBrotli[使用Brotli压缩]
    CheckServer -->|仅支持Gzip| CompressGzip[使用Gzip压缩]
    CompressBrotli --> StoreCompressed[存储压缩文件]
    CompressGzip --> StoreCompressed
    StoreCompressed --> End([结束])
```

## 4. 构建产物分析图

### 4.1 体积分析流程

```mermaid
flowchart TD
    Start([构建完成]) --> AnalyzeSize[分析产物大小]
    AnalyzeSize --> IdentifyLarge[识别大型模块]
    IdentifyLarge --> CheckOptimize{检查优化空间}
    CheckOptimize -->|可优化| ApplyOptimize[应用优化]
    CheckOptimize -->|已优化| GenerateReport[生成报告]
    ApplyOptimize --> GenerateReport
    GenerateReport --> End([结束])
```

### 4.2 优化前后对比

```mermaid
graph LR
    subgraph Before[优化前]
        B1[未分割代码] --> B2[大体积文件]
        B2 --> B3[慢速加载]
    end
    
    subgraph After[优化后]
        A1[代码分割] --> A2[小体积文件]
        A2 --> A3[快速加载]
    end
    
    Before -->|性能提升| After
```

## 5. 完整构建优化流程

```mermaid
flowchart TD
    Start([开始构建]) --> CodeSplit[代码分割]
    CodeSplit --> OptimizeAssets[优化静态资源]
    OptimizeAssets --> TreeShaking[tree-shaking]
    TreeShaking --> Minify[代码压缩]
    Minify --> Compress[Gzip/Brotli压缩]
    Compress --> Analyze[构建分析]
    Analyze --> GenerateReport[生成报告]
    GenerateReport --> End([结束])
```

## 优化要点总结

1. **代码分割**：
   - 路由懒加载：使用动态import实现按需加载
   - 模块分割：按业务模块分割代码
   - 第三方库分割：vendor chunk分离
   - 公共代码提取：提取公共依赖

1. **静态资源优化**：
   - 图片压缩：使用vite-plugin-imagemin等
   - 字体优化：字体子集化、格式优化
   - CDN资源：将大型库迁移到CDN
   - 资源懒加载：图片懒加载、组件懒加载

1. **打包体积优化**：
   - tree-shaking：确保未使用代码被移除
   - 代码压缩：Terser、ESBuild压缩
   - Gzip/Brotli压缩：服务器端压缩
   - 依赖优化：按需引入、移除未使用依赖

1. **构建分析**：
   - vite-bundle-visualizer：可视化分析构建产物
   - 构建报告：生成构建产物分析报告
   - 产物大小监控：记录构建产物大小变化
