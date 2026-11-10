# 核心模块变更日志

本文档记录核心基础设施模块的所有重要变更。

## [Unreleased]

## [2.0.0] - 2026-01-10

### ✨ 新增功能

#### 日志模块 (logger/)

- **新增** 完整的日志系统实现
  - 支持 DEBUG、INFO、WARN、ERROR 四个日志级别
  - 多种输出方式：控制台、文件、远程服务器
  - 上下文信息记录和性能监控
  - 生产环境自动优化
- **新增** `logger.ts` - 核心日志记录器
- **新增** `appenders.ts` - 日志输出器实现
- **新增** `config.ts` - 日志配置管理
- **新增** `types.ts` - 日志类型定义
- **新增** `README.md` - 日志模块使用文档

#### API模块 (api/)

- **新增** `error-response.ts` - 标准化错误响应格式
- **新增** `user-friendly-errors.ts` - 用户友好错误消息转换
- **新增** `request-queue.ts` - 请求队列管理
- **新增** `token-refresh.ts` - Token自动刷新机制
- **新增** `csrf.ts` - CSRF防护实现
- **新增** `cache.ts` - 请求缓存机制
- **新增** `performance-monitor.ts` - 性能监控

#### 错误处理模块 (error/)

- **新增** `ErrorBoundary.vue` - Vue错误边界组件
- **新增** `global-error-handler.ts` - 全局错误处理器

#### 性能监控模块 (performance/)

- **新增** `web-vitals.ts` - Web Vitals性能指标监控
  - LCP (Largest Contentful Paint)
  - FID (First Input Delay)
  - CLS (Cumulative Layout Shift)
  - TTI (Time to Interactive)
  - TBT (Total Blocking Time)

### 🔧 优化改进

#### API模块

- **优化** 请求拦截器，增强错误处理能力
- **优化** Token管理，支持自动刷新和缓存
- **优化** 请求性能监控，记录详细的性能指标

#### 配置模块 (config/)

- **优化** 环境变量管理，增强类型安全
- **优化** 常量定义，统一管理项目常量

### 🐛 问题修复

- **修复** TypeScript类型错误
  - 修复 `ErrorBoundary.vue` 中 `instance` 参数类型
  - 修复 `web-vitals.ts` 中 `any` 类型使用
- **修复** ESLint规范问题
  - 移除未使用的导入和变量
  - 优化代码格式和命名

### 🔒 安全增强

- **新增** CSRF防护机制
- **新增** 请求签名验证
- **新增** Token安全管理
- **优化** 错误信息脱敏处理

### 📝 文档更新

- **新增** 日志模块完整文档
- **新增** API模块使用指南
- **新增** 错误处理最佳实践
- **更新** 核心模块README

### 🧪 测试覆盖

- **新增** API模块单元测试
  - cache.test.ts - 缓存机制测试
  - csrf.test.ts - CSRF防护测试
  - error-handling.test.ts - 错误处理测试
  - performance-monitor.test.ts - 性能监控测试
  - request-cancel.test.ts - 请求取消测试
  - request-queue.test.ts - 请求队列测试
  - request-retry.test.ts - 请求重试测试
  - token-refresh.test.ts - Token刷新测试
- **新增** 配置模块单元测试
  - constants.test.ts - 常量测试
  - env.test.ts - 环境变量测试

## [1.0.0] - 2025-12-20

### ✨ 初始版本

#### API模块

- **新增** 基础请求封装 (`request.ts`)
- **新增** 用户API (`user.ts`)
- **新增** 射箭分析API (`archery.ts`)
- **新增** 类型定义 (`types.ts`)

#### 配置模块

- **新增** 环境变量配置 (`env.ts`)
- **新增** 常量定义 (`constants.ts`)

#### 基础架构

- **新增** TypeScript严格模式配置
- **新增** ESLint代码规范
- **新增** 项目目录结构

---

## 版本说明

### 版本号规则

采用语义化版本控制 (Semantic Versioning):

- **主版本号**: 不兼容的API修改
- **次版本号**: 向下兼容的功能性新增
- **修订号**: 向下兼容的问题修正

### 变更类型

- **新增**: 新功能
- **优化**: 改进现有功能
- **修复**: Bug修复
- **移除**: 删除功能
- **废弃**: 即将删除的功能
- **安全**: 安全相关修复

### 相关链接

- [核心模块README](./README.md)
- [日志模块文档](./logger/README.md)
- [API文档](../../doc/api/)
- [项目CHANGELOG](../../CHANGELOG.md)

---

**维护者**: 前端开发团队  
**最后更新**: 2026-01-10
