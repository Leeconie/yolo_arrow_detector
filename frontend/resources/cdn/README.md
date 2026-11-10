# CDN资源配置说明

**重要提示**: 默认情况下**不使用CDN**，所有依赖库都打包到构建产物中。本文档说明如何**可选地**启用CDN。

## 默认配置

- **默认状态**: CDN已禁用，所有资源都打包到构建产物中
- **使用场景**: 本地Docker构建和测试
- **优势**: 无需外部依赖，构建产物自包含

## 何时使用CDN

仅在以下情况下考虑启用CDN：

1. 生产环境需要减少构建产物大小
2. 需要利用CDN的全球加速
3. 有专门的CDN服务配置

本文档说明如何配置和使用CDN资源（可选）。

## 一、CDN服务商选择

### 推荐方案

**生产环境**：

- **jsDelivr**：用于npm包（Vue、Vue Router、Pinia等）
- **cdnjs (Cloudflare)**：用于常用库（Element Plus、Axios等）

**开发环境**：

- **unpkg**：用于快速开发和测试

### CDN服务商对比

| 服务商   | 优点                                  | 缺点                 | 适用场景 |
| -------- | ------------------------------------- | -------------------- | -------- |
| jsDelivr | 开源、免费、支持npm、自动SRI、全球CDN | 依赖GitHub/npm       | npm包CDN |
| cdnjs    | 稳定、SRI支持、全球CDN                | 库数量有限           | 常用库   |
| unpkg    | 简单、快速、支持npm                   | 无SRI、可能不稳定    | 开发环境 |
| BootCDN  | 国内访问快                            | 需要备案、可能不稳定 | 国内用户 |

## 二、外部库CDN配置

### 配置文件

详见 `external-libs.json`，包含以下库的CDN配置：

- Vue 3.x
- Vue Router 4.x
- Pinia 3.x
- Element Plus 2.x
- Axios 1.x
- DOMPurify 3.x

### 配置格式

```json
{
  "library": "vue",
  "version": "3.5.26",
  "cdn": [
    {
      "provider": "jsDelivr",
      "url": "https://cdn.jsdelivr.net/npm/vue@3.5.26/dist/vue.global.prod.js",
      "sri": "sha512-UX63mccKDa5OolzAepmONSjllKrqAooi1+E5tffJb3/dSBAFiUCYG/zQYwp4mUBj2i5AtFYLwiqxZQM7A8nPUg==",
      "type": "script"
    }
  ],
  "description": "Vue 3 核心库"
}
```

### 使用方法

1. **手动引入**：在 `index.html` 中添加CDN链接
2. **自动替换**：使用Vite CDN插件自动替换（推荐）

## 三、静态资源CDN配置

### 配置文件

详见 `static-assets.json`，包含：

- 图片资源
- 字体资源
- 其他静态文件

### 配置格式

```json
{
  "asset": "logo.png",
  "cdn": [
    {
      "provider": "jsDelivr",
      "url": "https://cdn.jsdelivr.net/gh/user/repo@main/assets/logo.png",
      "sri": "sha384-...",
      "type": "image"
    }
  ]
}
```

## 四、SRI（Subresource Integrity）校验

### 什么是SRI

SRI是一种安全机制，用于验证CDN资源的完整性，防止资源被篡改。

### 生成SRI哈希值

1. **在线工具**：<https://www.srihash.org/>
2. **命令行工具**：

   ```bash
   openssl dgst -sha384 -binary < file.js | openssl base64 -A
   ```

### 使用方法

在HTML中添加 `integrity` 属性：

```html
<script
  src="https://cdn.jsdelivr.net/npm/vue@3.5.26/dist/vue.global.prod.js"
  integrity="sha512-UX63mccKDa5OolzAepmONSjllKrqAooi1+E5tffJb3/dSBAFiUCYG/zQYwp4mUBj2i5AtFYLwiqxZQM7A8nPUg=="
  crossorigin="anonymous"
></script>
```

## 五、Vite CDN插件配置

### 安装插件

```bash
pnpm add -D vite-plugin-cdn-import
```

### 配置示例

在 `vite.config.ts` 中配置：

```typescript
import { defineConfig } from 'vite'
import cdnImport from 'vite-plugin-cdn-import'

export default defineConfig({
  plugins: [
    cdnImport({
      modules: [
        {
          name: 'vue',
          var: 'Vue',
          path: 'https://cdn.jsdelivr.net/npm/vue@3.5.26/dist/vue.global.prod.js',
        },
      ],
    }),
  ],
})
```

## 六、注意事项

1. **版本一致性**：CDN资源版本必须与package.json中的版本一致
2. **SRI校验**：生产环境必须使用SRI校验
3. **备用方案**：配置多个CDN备选，确保资源可用性
4. **缓存策略**：合理配置CDN缓存，平衡性能和更新
5. **HTTPS**：确保所有CDN资源使用HTTPS协议

## 七、更新记录

- 2026-01-08: 初始版本创建
