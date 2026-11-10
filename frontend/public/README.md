# public 目录说明

## 目录用途

`public` 目录用于存放**不需要经过 Vite 处理的静态资源**。这些资源会直接复制到 `dist` 根目录，路径保持不变。

## 与 src/assets 的区别

| 特性     | public                             | src/assets                   |
| -------- | ---------------------------------- | ---------------------------- |
| 处理方式 | 直接复制，不经过 Vite 处理         | 经过 Vite 处理、优化、打包   |
| 引用方式 | 使用绝对路径 `/favicon.ico`        | 使用 import 导入             |
| 适用场景 | favicon、robots.txt、manifest.json | 组件中使用的图片、样式文件等 |

## 应该放在这里的资源

- **favicon.ico** - 网站图标
- **robots.txt** - 搜索引擎爬虫规则（可选）
- **manifest.json** - PWA 清单文件（可选）
- **其他需要在 HTML 中直接引用的资源**

## 使用示例

### 在 HTML 中引用

```html
<link rel="icon" href="/favicon.ico" /> <link rel="manifest" href="/manifest.json" />
```

### 在组件中引用

```typescript
// 使用绝对路径
const iconUrl = '/favicon.ico'
```

## 注意事项

1. **路径不变**：public 目录中的资源路径在构建后保持不变
2. **不经过 Vite 处理**：不会进行代码分割、压缩等处理
3. **大小限制**：建议单个文件不超过 10MB
4. **命名规范**：使用 kebab-case 命名（如：favicon.ico）

## 目录结构

```text
public/
├── README.md          # 本文件
├── favicon.ico        # 网站图标
├── robots.txt         # 搜索引擎爬虫规则（可选）
└── manifest.json      # PWA 清单文件（可选）
```text
