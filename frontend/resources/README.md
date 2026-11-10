# 资源准备清单

本文档列出了项目部署所需的所有资源清单和准备步骤。

## 一、资源准备检查清单

### 1.1 CDN资源（可选）

**注意**: 默认情况下**不使用CDN**，所有依赖库都打包到构建产物中。CDN配置是可选的，仅在需要时启用。

- [x] 外部库CDN配置（Vue、Vue Router、Pinia、Element Plus等）- 可选，默认不使用
- [ ] 静态资源CDN配置（图片、字体等）- 可选，默认不使用
- [ ] CDN服务商账号（如需要）- 仅在启用CDN时需要
- [x] SRI哈希值生成和验证 - 仅在启用CDN时需要

### 1.2 Docker资源

- [x] Docker环境（Docker Engine 20.10+）
- [x] Docker Compose（2.0+）
- [ ] Nginx Docker镜像
- [ ] 构建产物（dist目录）

### 1.3 服务器资源

- [ ] Ubuntu服务器（20.04+）
- [ ] 域名和SSL证书（如需要HTTPS）
- [ ] 服务器访问权限（SSH）
- [ ] 防火墙配置

### 1.4 构建和测试资源

- [x] Node.js环境（20.19.0+ 或 22.12.0+）
- [x] pnpm包管理器（10+）
- [x] 构建工具（Vite 7+）
- [x] 测试工具（Vitest、Playwright）

## 二、CDN资源清单

### 2.1 外部库CDN配置

详见 `cdn/external-libs.json`，包含以下库：

- Vue 3.x
- Vue Router 4.x
- Pinia 3.x
- Element Plus 2.x
- Axios 1.x
- DOMPurify 3.x

### 2.2 静态资源CDN配置

详见 `cdn/static-assets.json`，包含：

- 图片资源
- 字体资源
- 其他静态文件

## 三、Docker镜像清单

### 3.1 基础镜像

- `node:20-alpine` - 构建阶段基础镜像
- `nginx:alpine` - 运行阶段基础镜像

### 3.2 自定义镜像

- `aimeasurearchery:latest` - 前端应用镜像（基于Nginx）

## 四、服务器配置清单

### 4.1 Nginx配置

- 主配置文件：`server/nginx/nginx.conf`
- 站点配置：`server/nginx/sites-available/`

### 4.2 压缩配置

- Gzip压缩：已配置
- Brotli压缩：已配置（需要支持Brotli的镜像）

### 4.3 安全配置

- HTTPS配置
- 安全头配置
- CORS配置

## 五、准备步骤

### 步骤1：准备CDN资源

1. 查看 `cdn/external-libs.json` 了解需要配置的CDN资源
2. 访问CDN服务商网站（jsDelivr、cdnjs）获取资源URL
3. 生成SRI哈希值（使用在线工具或命令行）
4. 更新 `cdn/external-libs.json` 配置文件

### 步骤2：准备Docker环境

1. 安装Docker Engine（如未安装）
2. 安装Docker Compose（如未安装）
3. 验证Docker环境：`docker --version`、`docker-compose --version`

### 步骤3：准备服务器

1. 准备Ubuntu服务器（20.04+）
2. 安装Docker和Docker Compose
3. 配置防火墙规则（开放80、443端口）
4. 准备域名和SSL证书（如需要HTTPS）

### 步骤4：构建应用

1. 安装依赖：`pnpm install`
2. 构建应用：`pnpm build`
3. 验证构建产物：检查 `dist/` 目录

## 六、资源获取链接

### CDN服务商

- **jsDelivr**: <https://www.jsdelivr.com/>
- **cdnjs**: <https://cdnjs.com/>
- **unpkg**: <https://unpkg.com/>

### Docker资源

- **Docker官方文档**: <https://docs.docker.com/>
- **Nginx官方镜像**: <https://hub.docker.com/_/nginx>
- **Node.js官方镜像**: <https://hub.docker.com/_/node>

### 工具和脚本

- **SRI哈希生成**: <https://www.srihash.org/>
- **Lighthouse**: <https://developers.google.com/web/tools/lighthouse>
- **构建分析**: 使用 `pnpm build:analyze` 生成构建报告

## 七、注意事项

1. **CDN资源安全**：必须使用SRI校验，防止资源被篡改
2. **版本锁定**：CDN资源版本应与package.json中的版本一致
3. **备用方案**：配置多个CDN备选，确保资源可用性
4. **构建产物**：确保构建产物完整，所有资源文件都存在
5. **环境变量**：区分开发、测试、生产环境的配置

## 八、更新记录

- 2026-01-08: 初始版本创建
