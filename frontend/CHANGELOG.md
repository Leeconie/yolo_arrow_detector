# 变更日志 (Changelog)

本文档记录 AIMeasureArchery 项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### 🚧 进行中

- [ ] 系统集成与生产部署
- [ ] 后端API对接和测试
- [ ] 性能优化和监控
- [ ] 生产环境配置

### 📋 计划中

- [ ] 多文件批量上传功能
- [ ] 视频预览和剪辑功能
- [ ] 移动端优化
- [ ] 国际化支持（i18n）
- [ ] PWA支持
- [ ] 离线模式

## [2.1.0] - 2026-01-11

### ✨ 新增

#### 🗄️ 历史记录管理

**核心功能** (`src/modules/video/upload/services/history-storage.ts`)

- IndexedDB本地存储实现，支持大数据量存储
- 上传历史记录的增删改查操作
- 数据统计和性能监控
- 自动清理过期记录

**查询系统** (`src/modules/video/upload/composables/useHistoryQuery.ts`)

- 高级筛选功能：日期范围、文件类型、上传状态
- 实时搜索和排序（文件名、上传时间、文件大小）
- 分页加载和虚拟滚动优化
- 搜索防抖和缓存机制

**数据可视化** (`src/modules/video/upload/components/HistoryCharts.vue`)

- ECharts集成，支持多种图表类型
- 上传趋势分析（折线图）
- 类型分布统计（饼图）
- 性能指标展示（柱状图）
- 图表导出为PNG功能

**用户界面** (`src/views/history/HistoryPage.vue`)

- 响应式数据表格，支持排序和筛选
- 批量操作功能（批量删除、导出）
- 进度条和状态指示器
- 空状态和错误处理

#### 🔌 API客户端架构

**统一API客户端** (`src/core/api/client.ts`)

- Axios封装，统一请求/响应拦截器
- JWT自动认证和Token管理
- 业务错误和HTTP错误统一处理
- 请求重试和超时管理
- 性能监控和日志记录

**认证API** (`src/core/api/user.ts`)

- 用户注册、登录、登出
- 用户信息获取和更新
- 密码修改功能
- JWT Token自动刷新

**视频上传API** (`src/core/api/video-upload.ts`)

- 文件验证和分片上传
- 上传进度跟踪
- 支持多种视频格式
- 错误重试机制

#### 🎨 UI/UX优化

**响应式布局修复**

- 分析历史页面筛选条件重叠问题修复
- 导航栏登出按钮添加
- 首页布局优化，移除过多空白
- 视频上传格式支持扩展

**设计系统完善**

- 配色方案优化，更务实的设计风格
- 组件间距和对齐统一
- 移动端和PC端适配优化

### 🔧 技术改进

#### 代码质量

- ESLint警告全部修复（20个警告 → 0个）
- TypeScript严格模式启用
- 单元测试覆盖率82.52%
- 代码注释规范化

#### 性能优化

- 搜索功能防抖实现
- 数据缓存和压缩
- 虚拟滚动优化大数据展示
- 图片懒加载和错误处理

#### 开发工具

- Markdown文档格式化脚本
- 项目结构优化和清理
- E2E测试用例完善
- CI/CD配置准备

### 📚 文档更新

- README.md全面更新，反映最新功能
- API文档OpenAPI 3.0规范
- 历史管理实现文档
- 系统集成规划文档
- UI优化实施报告

### 🐛 修复

- 视频上传格式支持修复（MP4、AVI、MOV、MKV）
- 分析历史图片加载问题修复
- 筛选条件布局重叠问题修复
- 导航栏功能入口优化

### 📊 质量指标

- **代码质量**: ESLint 0错误，TypeScript 100%通过
- **测试覆盖**: 单元测试82.52%，E2E测试完善
- **性能表现**: 页面加载<3秒，API响应<1秒
- **用户体验**: 响应式设计，移动端适配

## [2.0.0] - 2026-01-10

### ✨ 新增 (2)

#### 核心基础设施

**日志模块** (src/core/logger/)

- 完整的日志系统实现，支持DEBUG、INFO、WARN、ERROR四个级别
- 多种输出方式：控制台、文件、远程服务器
- 上下文信息记录和性能监控
- 生产环境自动优化

**API增强** (src/core/api/)

- 标准化错误响应格式 (`error-response.ts`)
- 用户友好错误消息转换 (`user-friendly-errors.ts`)
- 请求队列管理 (`request-queue.ts`)
- Token自动刷新机制 (`token-refresh.ts`)
- CSRF防护实现 (`csrf.ts`)
- 请求缓存机制 (`cache.ts`)
- 性能监控 (`performance-monitor.ts`)

**错误处理** (src/core/error/)

- Vue错误边界组件 (`ErrorBoundary.vue`)
- 全局错误处理器 (`global-error-handler.ts`)

**性能监控** (src/core/performance/)

- Web Vitals性能指标监控 (`web-vitals.ts`)
  - LCP (Largest Contentful Paint)
  - FID (First Input Delay)
  - CLS (Cumulative Layout Shift)
  - TTI (Time to Interactive)
  - TBT (Total Blocking Time)

**安全工具** (src/utils/)

- 文件验证工具 (`file-validation.ts`)
  - 文件类型验证
  - 文件大小验证
  - MIME类型验证
  - 安全性检查
- 输入清理工具 (`input-sanitization.ts`)
  - XSS攻击防护
  - SQL注入防护
  - HTML标签清理
  - 特殊字符转义

#### 视频上传模块

**完整功能实现** (src/modules/video/upload/)

- 大文件分片上传（最大512MB）
- 断点续传支持
- 实时进度显示
- 拖拽上传功能
- 视频类型选择（运动人体/射箭）
- 文件验证和安全检查

## 组件

- `VideoUploader.vue` - 主上传组件
- `TypeSelector.vue` - 类型选择组件
- `UploadPage.vue` - 上传页面

## API封装

- 分片上传接口
- 上传初始化接口
- 上传完成确认接口
- 上传取消接口

### 系统配置

#### 配置管理

**环境配置** (vite.config.env.ts)

- 多环境支持（dev/test/prod）
- 类型安全的环境变量访问
- 默认值和验证机制
- 敏感信息保护

### 🔧 优化

#### API模块

- 优化请求拦截器，增强错误处理能力
- 优化Token管理，支持自动刷新和缓存
- 优化请求性能监控，记录详细的性能指标

#### 配置模块

- 优化环境变量管理，增强类型安全
- 优化常量定义，统一管理项目常量

#### 构建配置

- 更新TypeScript配置
- 优化Vite构建配置
- 更新ESLint规则
- 优化Playwright测试配置

### 🐛 修复 (2)

#### TypeScript类型错误

- 修复 `ErrorBoundary.vue` 中 `instance` 参数类型
- 修复 `web-vitals.ts` 中 `any` 类型使用
- 修复各模块中的类型定义问题

#### ESLint规范问题

- 移除未使用的导入和变量
  - `scripts/mock-upload-server.js` - 移除 `createWriteStream`、`fileType`
  - `scripts/performance-test.js` - 移除 `result`、优化 `error` 处理
  - `src/core/error/global-error-handler.ts` - 移除 `ElMessageBox`
  - `src/__tests__/scripts/mock-upload-server.test.ts` - 移除 `createReadStream`
- 替换 `require()` 为 ES6 `import`
- 优化代码格式和命名

#### E2E测试警告

- 添加 `eslint-disable` 注释处理必要的条件判断
- 优化测试用例结构

### 🔒 安全

#### 新增安全功能

- CSRF防护机制
- 请求签名验证
- Token安全管理
- 文件上传安全验证
- 输入清理和验证
- 错误信息脱敏处理

#### 安全测试

- XSS攻击场景测试
- SQL注入测试
- 文件类型伪造测试
- 特殊字符处理测试

### 📝 文档

#### 新增文档

- 核心模块 CHANGELOG 和 README
- 视频上传模块 CHANGELOG 和 README
- 日志模块完整文档
- API模块使用指南
- 错误处理最佳实践
- 代码质量修复文档 (`doc/code-quality-fix-2026-01-10.md`)
- 项目清理报告 (`doc/project-cleanup-2026-01-10.md`)
- 项目提交总结 (`doc/commit-summary-2026-01-10.md`)

#### 更新文档

- API文档（7个文件）
- 基础设施文档（31个文件）
- 项目README

### 🧪 测试

#### 新增测试

- API模块单元测试（10个文件）
  - cache.test.ts - 缓存机制测试
  - csrf.test.ts - CSRF防护测试
  - error-handling.test.ts - 错误处理测试
  - performance-monitor.test.ts - 性能监控测试
  - request-cancel.test.ts - 请求取消测试
  - request-queue.test.ts - 请求队列测试
  - request-retry.test.ts - 请求重试测试
  - token-refresh.test.ts - Token刷新测试
  - request.test.ts - 请求测试
  - performance.test.ts - 性能测试

- 配置模块单元测试（2个文件）
  - constants.test.ts - 常量测试
  - env.test.ts - 环境变量测试

- 工具函数测试（3个文件）
  - file-validation.test.ts - 文件验证测试（95%+覆盖率）
  - input-sanitization.test.ts - 输入清理测试（95%+覆盖率）
  - test-helpers.ts - 测试辅助工具

#### 测试覆盖率

- 总覆盖率：82.52%
- Statements: 82.52%
- Branch: 69.65%
- Functions: 85.34%
- Lines: 82.48%
- 测试用例：614个通过，2个跳过

### 📊 代码质量

#### Lint检查

- ✅ 0 errors
- ✅ 0 warnings
- ✅ 所有代码符合ESLint规范

#### TypeScript类型检查

- ✅ 无类型错误
- ✅ 严格类型检查通过

### 🗂️ 项目清理

#### 清理内容

- 删除临时文件和目录 (`temp/`)
- 清理ESLint缓存 (`.eslintcache`)
- 归档临时测试文档
- 更新 `.gitignore` 配置

### 📦 依赖更新

- 更新 `package.json` 脚本命令
- 优化依赖版本管理
- 添加新的开发工具

### 🎨 UI/UX改进

- 视频上传界面现代化设计
- 渐变色背景和圆角卡片
- 悬停动画效果
- 响应式布局优化
- 上传状态视觉反馈

### ⚡ 性能优化

- 代码分割和懒加载
- 请求缓存机制
- 状态持久化优化
- 资源预加载
- 性能监控集成

## [1.0.0] - 2025-12-20

### ✨ 新增 (3)

#### 项目初始化

- Vue 3 + TypeScript + Vite 项目搭建
- Element Plus UI组件库集成
- Pinia状态管理
- Vue Router路由管理
- Axios HTTP客户端

#### 核心功能

- 用户认证系统（登录/注册）
- 射箭分析基础功能
- 个人中心页面
- 首页布局

#### 基础设施

- API请求封装
- 环境配置管理
- 常量定义
- 类型定义系统

#### 开发工具

- ESLint代码规范
- Prettier代码格式化
- TypeScript严格模式
- Vitest单元测试
- Playwright E2E测试

#### 文档

- 项目README
- 开发规范文档
- API文档基础结构

### 🔧 配置

- Vite构建配置
- TypeScript配置
- ESLint配置
- 测试配置
- Git配置

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
- **文档**: 文档更新
- **测试**: 测试相关变更

### 相关链接

- [项目README](./README.md)
- [核心模块CHANGELOG](./src/core/CHANGELOG.md)
- [视频上传模块CHANGELOG](./src/modules/video/upload/CHANGELOG.md)
- [文档目录](./doc/)
- [GitHub仓库](https://github.com/HeZaoCha/AIMeasureArchery)
- [CNB仓库](https://cnb.cool/he.zaocha/Lnu/AIMeasureArchery-Front)

---

**维护者**: 前端开发团队  
**项目负责人**: HeZaoCha  
**最后更新**: 2026-01-10
