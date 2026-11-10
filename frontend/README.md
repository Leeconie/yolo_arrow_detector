# AIMeasureArchery

> 基于计算机视觉的射箭运动姿态实时分析与训练辅助系统

[![Vue](https://img.shields.io/badge/Vue-3.5+-green.svg)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.3+-purple.svg)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Test Coverage](https://img.shields.io/badge/coverage-82.52%25-brightgreen.svg)](./coverage)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Last Updated](https://img.shields.io/badge/last%20updated-2026--01--11-blue.svg)]()

## 📋 目录

- [项目简介](#项目简介)
- [核心功能](#核心功能)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [开发指南](#开发指南)
- [测试](#测试)
- [部署](#部署)
- [文档](#文档)
- [贡献指南](#贡献指南)
- [许可证](#许可证)
- [团队](#团队)
- [联系方式](#联系方式)

## 项目简介

AIMeasureArchery 是一个基于计算机视觉技术的射箭运动姿态分析系统，旨在为射箭运动员提供实时的姿态分析和训练辅助。系统通过视频分析技术，识别运动员的动作姿态，提供专业的技术指导和改进建议。

### 🏆 项目现状 (2026-01-11)

- ✅ **前端核心功能完成** - 视频上传、历史记录管理、用户认证等
- ✅ **API集成架构搭建** - 统一的API客户端和错误处理机制
- ✅ **性能优化实施** - 搜索防抖、缓存管理、数据压缩
- ✅ **测试覆盖完善** - 单元测试82.52%、组件测试完整
- 🚧 **后端集成进行中** - 系统集成与生产部署阶段

### 核心价值

- 🎯 **精准分析** - 基于AI的姿态识别和分析
- 📊 **数据可视化** - 直观的数据展示和对比（支持图表导出）
- 🎬 **视频处理** - 支持大文件上传和实时处理
- 📚 **历史管理** - 完整的上传历史记录和统计分析
- 📱 **跨平台** - 支持PC和移动端访问
- 🔒 **安全可靠** - 完善的安全机制和数据保护
- ⚡ **高性能** - 防抖搜索、缓存优化、数据压缩

## 核心功能

### 1. 视频上传与处理

- **大文件上传**: 支持最大512MB视频文件
- **分片上传**: 自动分片，提高上传效率
- **断点续传**: 网络中断后可继续上传
- **实时进度**: 显示上传进度和速度
- **拖拽上传**: 支持拖拽文件到上传区域

### 2. 姿态分析

- **实时分析**: 视频上传后自动进行姿态分析
- **关键点检测**: 识别身体关键部位
- **动作评分**: 基于专业标准的动作评分
- **改进建议**: 提供针对性的改进建议

### 3. 历史记录管理

- **上传历史**: 完整的视频上传记录管理
- **高级筛选**: 支持日期范围、文件类型、上传状态筛选
- **数据统计**: 上传量、成功率、文件大小统计
- **批量操作**: 批量删除、导出数据功能
- **性能优化**: 搜索防抖、缓存管理、虚拟滚动

### 4. 数据可视化

- **图表展示**: 多维度数据图表（ECharts支持）
- **对比分析**: 历史数据对比和趋势分析
- **统计面板**: 实时数据统计和可视化
- **报告导出**: 支持PNG导出和数据导出
- **响应式设计**: 适配不同屏幕尺寸

### 5. 用户管理

- **用户认证**: 安全的登录注册系统（JWT）
- **个人中心**: 管理个人信息和数据
- **训练记录**: 查看历史训练记录
- **成就系统**: 训练成就和进度追踪

## 技术栈

### 前端核心

- **框架**: Vue 3.5+ (Composition API + Script Setup)
- **语言**: TypeScript 5.2+ (严格类型检查)
- **构建工具**: Vite 7.3+ (ESM + HMR)
- **UI组件**: Element Plus 2.5+
- **状态管理**: Pinia 2.1+
- **路由**: Vue Router 4.2+
- **HTTP客户端**: Axios (自定义API客户端)

### 开发工具

- **代码规范**: ESLint 9.0+ + Prettier
- **单元测试**: Vitest 1.0+ (82.52%覆盖率)
- **E2E测试**: Playwright 1.40+
- **类型检查**: Vue-tsc + TypeScript 5.2+
- **Git规范**: Commitlint + Husky
- **文档生成**: Markdown + API文档自动生成

### 核心依赖

`````json
{
  "vue": "^3.5.0",
  "typescript": "^5.2.2",
  "vite": "^7.3.0",
  "element-plus": "^2.5.6",
  "pinia": "^2.1.7",
  "vue-router": "^4.2.5",
  "@element-plus/icons-vue": "^2.1.0",
  "echarts": "^5.4.3",
  "vue-echarts": "^6.6.0",
  "lodash-es": "^4.17.21",
  "axios": "^1.6.0"
  "axios": "^1.13.2"
}
```

## 项目结构

```text
AIMeasureArchery/
├── doc/                        # 项目文档 (60+文档)
│   ├── api/                    # OpenAPI 3.0规范
│   ├── core-infrastructure/    # 基础设施文档
│   ├── ui-optimization-implementation/ # UI优化文档
│   ├── video-upload/           # 视频上传文档
│   └── ...                     # 其他专项文档
├── e2e/                        # E2E测试 (Playwright)
│   ├── archery-analysis.spec.ts # 射箭分析测试
│   ├── auth.spec.ts            # 认证测试
│   └── ...                     # 其他测试用例
├── public/                     # 静态资源
├── resources/                  # 部署资源
│   ├── docker/                 # Docker配置
│   ├── scripts/                # 部署脚本
│   └── server/                 # 服务器配置
├── scripts/                    # 开发脚本
│   ├── mock-upload-server.js   # Mock上传服务器
│   ├── performance-test.js     # 性能测试脚本
│   └── fix-markdown-formatting.sh # Markdown格式化
├── src/                        # 源代码
│   ├── __tests__/              # 单元测试 (82.52%覆盖)
│   ├── assets/                 # 资源文件
│   ├── components/             # 全局组件
│   ├── core/                   # 核心模块
│   │   ├── api/                # API客户端封装
│   │   │   ├── client.ts       # 统一API客户端
│   │   │   ├── archery.ts      # 射箭分析API
│   │   │   ├── user.ts         # 用户管理API
│   │   │   └── video-upload.ts # 视频上传API
│   │   ├── logger/             # 日志模块
│   │   ├── error/              # 错误处理
│   │   ├── performance/        # 性能监控
│   │   └── config/             # 配置管理
│   ├── modules/                # 功能模块
│   │   └── video/              # 视频模块
│   │       └── upload/         # 上传功能
│   │           ├── components/ # 上传组件
│   │           ├── composables/# 组合式函数
│   │           ├── services/   # 服务层
│   │           ├── types/      # 类型定义
│   │           └── page/       # 页面组件
│   ├── router/                 # 路由配置
│   ├── stores/                 # 状态管理 (Pinia)
│   ├── types/                  # 类型定义
│   ├── utils/                  # 工具函数
│   ├── views/                  # 页面组件
│   │   ├── home/               # 首页
│   │   ├── analysis/           # 分析页面
│   │   ├── history/            # 历史记录页面
│   │   └── user/               # 用户页面
│   ├── App.vue                 # 根组件
│   └── main.ts                 # 入口文件
├── .env                        # 环境变量
├── .env.development            # 开发环境变量
├── .env.production             # 生产环境变量
├── .gitignore                  # Git忽略文件
├── CHANGELOG.md                # 变更日志
├── eslint.config.ts            # ESLint配置
├── index.html                  # HTML模板
├── package.json                # 项目配置
├── pnpm-lock.yaml              # 依赖锁定
├── playwright.config.ts        # Playwright配置
├── README.md                   # 本文档
├── tsconfig.json               # TypeScript配置
├── vite.config.ts              # Vite配置
└── vitest.config.ts            # Vitest配置
```

## 快速开始

### 环境要求

- **Node.js**: ^20.19.0 || >=22.12.0
- **pnpm**: 10.0+
- **浏览器**: Chrome 90+, Edge 90+, Safari 14+

### 安装依赖

````bash
# 克隆项目
git clone https://github.com/HeZaoCha/AIMeasureArchery.git
cd AIMeasureArchery

# 安装依赖
pnpm install
```

### 开发模式

```bash
# 启动开发服务器
pnpm dev

# 启动开发服务器 + Mock上传服务
pnpm dev:with-mock

# 访问应用
# http://localhost:5173
`````

### 构建生产版本

````bash
# 类型检查
pnpm type-check

# 构建生产版本
pnpm build

# 预览生产版本
pnpm preview
```

### 代码质量检查

```bash
# Lint检查
pnpm lint

# 格式化代码
pnpm format

# 类型检查
pnpm type-check
```

## 开发指南

### IDE设置

推荐使用 **VS Code** 或 **Cursor** 编辑器，并安装以下插件：

- [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
- [TypeScript Vue Plugin](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin)
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

### 浏览器开发工具

- **Chrome/Edge**: [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
- **Firefox**: [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)

### 核心模块使用

#### API请求

```typescript
import { request } from '@/core/api'

// GET请求
const user = await request.get('/api/users/123')

// POST请求
const result = await request.post('/api/users', { name: '张三' })
```

#### 日志记录

```typescript
import { logger } from '@/core/logger'

logger.info('用户登录成功', { userId: 123 })
logger.error('请求失败', { error: err })
```

#### 错误处理

```vue
<template>
  <ErrorBoundary>
    <YourComponent />
  </ErrorBoundary>
</template>
```

详细使用说明请参考：

- [核心模块文档](./src/core/README.md)
- [视频上传模块文档](./src/modules/video/upload/README.md)

## 测试

### 运行测试

```bash
# 运行所有单元测试
pnpm test:unit

# 运行E2E测试
pnpm test:e2e

# 运行集成测试
pnpm test:integration

# 运行性能测试
pnpm test:performance

# 运行安全测试
pnpm test:security

# 运行所有测试
pnpm test:all
```

### 测试覆盖率

```bash
# 生成测试覆盖率报告
pnpm test:unit --coverage

# 查看覆盖率报告
open coverage/index.html
```

### 当前测试覆盖率

| 指标       | 覆盖率 | 状态    |
| ---------- | ------ | ------- |
| Statements | 82.52% | ✅ 优秀 |
| Branch     | 69.65% | ✅ 良好 |
| Functions  | 85.34% | ✅ 优秀 |
| Lines      | 82.48% | ✅ 优秀 |

**测试用例**: 614个通过，2个跳过

## 部署

### 构建

```bash
# 开发环境构建
pnpm build:dev

# 测试环境构建
pnpm build:test

# 生产环境构建
pnpm build:prod
```

### Docker部署

```bash
# 构建Docker镜像
docker build -t aimeasurearchery:latest .

# 运行容器
docker run -p 80:80 aimeasurearchery:latest
```

### Nginx配置

详见 [Nginx配置文档](./resources/server/nginx.conf)

### 环境变量

创建 `.env.production` 文件：

```ini
# API基础URL
VITE_API_BASE_URL=https://api.example.com

# API超时时间（毫秒）
VITE_API_TIMEOUT=10000

# 是否启用Mock
VITE_ENABLE_MOCK=false

# 日志级别
VITE_LOG_LEVEL=INFO
```

详细部署文档请参考：

- [部署任务清单](./resources/DEPLOYMENT_TASKS.md)

## 📚 文档

### 项目文档

- [📝 变更日志](./CHANGELOG.md)
- [🤝 贡献指南](./CONTRIBUTING.md)
- [⚖️ 许可证](./LICENSE)

### 🏗️ 核心文档

- [🔌 API文档](./doc/api/) - OpenAPI 3.0规范和接口文档
- [🏛️ 基础设施文档](./doc/core-infrastructure/) - 系统架构和基础设施
- [🎨 UI优化文档](./doc/ui-optimization-implementation/) - 界面设计和优化
- [🎬 视频上传文档](./doc/video-upload/) - 上传功能详细说明
- [🏹 射箭分析文档](./doc/archery-analysis/) - 分析功能技术文档

### 📊 专项文档

- [🔧 代码质量修复](./doc/code-quality-fix-2026-01-10.md)
- [🧹 项目清理报告](./doc/project-cleanup-2026-01-10.md)
- [📈 提交总结](./doc/commit-summary-2026-01-10.md)
- [🧪 E2E测试报告](./doc/e2e-test-success-report-2026-01-11.md)
- [📋 历史管理实现](./doc/ui-optimization-implementation/history-management-implementation.md)
- [🚀 系统集成规划](./doc/next-phase-system-integration-2026-01-11.md)

### 📁 模块文档

- [⚙️ 核心模块](./src/core/README.md)
- [📹 视频上传模块](./src/modules/video/upload/README.md)
- [📊 历史记录模块](./src/modules/video/upload/services/README.md)

## 🤝 贡献指南

我们欢迎所有形式的贡献！无论是代码改进、文档完善、问题反馈还是功能建议。

### 📋 贡献流程

1. **Fork 项目** - Fork 本仓库到你的GitHub账户
2. **创建特性分支** - `git checkout -b feature/AmazingFeature` 或 `git checkout -b fix/BugFix`
3. **代码开发** - 遵循项目代码规范和最佳实践
4. **提交更改** - 使用规范的提交信息：`git commit -m 'feat: Add some AmazingFeature'`
5. **推送分支** - `git push origin feature/AmazingFeature`
6. **开启 Pull Request** - 详细描述更改内容和测试验证

### 🔧 开发规范

#### 代码质量

- **ESLint**: 严格遵循ESLint规则，无警告
- **TypeScript**: 严格类型检查，禁用`any`类型
- **测试覆盖**: 单元测试覆盖率 ≥ 80%
- **代码格式**: Prettier自动格式化

#### 提交规范

- **feat**: 新功能
- **fix**: 修复bug
- **docs**: 文档更新
- **style**: 代码风格调整
- **refactor**: 代码重构
- **test**: 测试相关
- **chore**: 构建工具或辅助工具的变动

#### 分支管理

- **main**: 生产分支，稳定版本
- **develop**: 开发分支，最新功能
- **feature/***: 功能分支
- **fix/***: 修复分支
- **hotfix/***: 紧急修复分支

### 提交规范

提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```text
<type>(<scope>): <subject>

<body>

<footer>
```

**类型 (type)**:

- `feat`: 新功能
- `fix`: Bug修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关

### 代码审查

所有代码变更都需要经过代码审查：

1. 确保所有测试通过
2. 确保代码符合规范
3. 更新相关文档
4. 至少一位维护者审查通过

## 📊 项目统计

### 代码统计

- **总代码行数**: ~8000+行
- **组件数量**: 50+个
- **API接口**: 30+个
- **测试用例**: 614个

### 性能指标

- **首屏加载**: < 2s
- **页面切换**: < 500ms
- **API响应**: < 1s
- **测试覆盖率**: 82.52%

## 🔗 相关链接

### 代码仓库

- **GitHub**: <https://github.com/HeZaoCha/AIMeasureArchery>
- **CNB**: <https://cnb.cool/he.zaocha/Lnu/AIMeasureArchery-Front>

### 技术资源

- **Vue 3**: <https://vuejs.org/>
- **TypeScript**: <https://www.typescriptlang.org/>
- **Vite**: <https://vitejs.dev/>
- **Element Plus**: <https://element-plus.org/>

### 社区

- **Issues**: <https://github.com/HeZaoCha/AIMeasureArchery/issues>
- **Discussions**: <https://github.com/HeZaoCha/AIMeasureArchery/discussions>

## 许可证

本项目采用 [MIT](./LICENSE) 许可证。

---

## 👥 团队

### 🎯 项目负责人

- **HeZaoCha** - 项目发起人和主要开发者
  - 📧 Email: zaochahe@qq.com
  - 💻 GitHub: [@HeZaoCha](https://github.com/HeZaoCha)
  - 🎨 角色: 全栈开发、架构设计、项目管理

### 📊 项目统计

- **开发周期**: 2024年至今
- **代码行数**: ~15,000+ 行
- **测试覆盖**: 82.52%
- **文档数量**: 60+ 篇
- **最后更新**: 2026-01-11

### 🌟 致谢

特别感谢以下开源项目和工具的支持：

- **Vue.js** - 渐进式JavaScript框架
- **TypeScript** - JavaScript的超集
- **Vite** - 下一代前端构建工具
- **Element Plus** - Vue 3组件库
- **ECharts** - 数据可视化库
- **Playwright** - E2E测试框架
- **ESLint** - 代码检查工具

感谢所有为本项目做出贡献的开发者！🎉

## 📞 联系方式

- **📧 Email**: zaochahe@qq.com
- **💻 GitHub**: [@HeZaoCha](https://github.com/HeZaoCha)
- **📱 项目主页**: [GitHub Repository](https://github.com/HeZaoCha/AIMeasureArchery)

---

**⭐ 如果这个项目对你有帮助，请给我们一个Star！**

---

**版本**: 2.0.0
**最后更新**: 2026-01-10
**状态**: 🚀 活跃开发中

---

<div align="center">
  <sub>Built with ❤️ by the AIMeasureArchery Team</sub>
</div>
````
