# 插画目录

## 目录用途

存放插画、装饰性图片，通常用于空状态、错误页面、成功页面等场景。

## 推荐格式

- **SVG** - 优先使用，矢量图，可缩放
- **PNG** - 适合复杂插画

## 命名规范

- 使用 **kebab-case** 命名
- 文件名应描述插画用途（如：`empty-state-illustration.svg`、`error-illustration.png`）

## 文件大小建议

- 单个插画建议不超过 **300KB**
- SVG 插画通常只有几十 KB

## 使用示例

````typescript
import emptyIllustration from '@/assets/images/illustrations/empty-state-illustration.svg'
import errorIllustration from '@/assets/images/illustrations/error-illustration.png'

export default {
  setup() {
    return {
      emptyIllustration,
      errorIllustration,
    }
  },
}
```

```vue
<template>
  <div v-if="isEmpty">
    <img :src="emptyIllustration" alt="Empty State" />
    <p>暂无数据</p>
  </div>
</template>
```

## 常见场景

- **空状态** - 数据为空时显示
- **错误页面** - 404、500 等错误页面
- **成功页面** - 操作成功提示
- **加载状态** - 加载中的动画或图片

## 注意事项

1. **保持风格一致**：使用统一的插画风格
2. **语义化命名**：文件名应清晰描述插画用途
3. **尺寸适配**：插画应适配不同屏幕尺寸
````
