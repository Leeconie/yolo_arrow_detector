# Logo 目录

## 目录用途

存放品牌 Logo、应用 Logo 等标识性图片。

## 推荐格式

- **SVG** - 优先使用，矢量图，可缩放
- **PNG** - 适合复杂 Logo，支持透明背景

## 命名规范

- 使用 **kebab-case** 命名
- 文件名应描述 Logo 用途（如：`app-logo.svg`、`footer-logo.png`）

## 文件大小建议

- 单个 Logo 建议不超过 **200KB**
- SVG Logo 通常只有几十 KB

## 使用示例

````typescript
import appLogo from '@/assets/images/logos/app-logo.svg'
import footerLogo from '@/assets/images/logos/footer-logo.png'

export default {
  setup() {
    return {
      appLogo,
      footerLogo,
    }
  },
}
```

```vue
<template>
  <img :src="appLogo" alt="App Logo" />
  <img :src="footerLogo" alt="Footer Logo" />
</template>
```

## 注意事项

1. **保持品牌一致性**：使用统一的 Logo 风格
2. **多尺寸版本**：如有需要，可以提供不同尺寸的版本
3. **透明背景**：建议使用透明背景的 PNG 或 SVG
````
