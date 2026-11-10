# 背景图目录

## 目录用途

存放页面背景、卡片背景等背景图片。

## 推荐格式

- **WebP** - 优先使用，体积小，质量高
- **JPG** - 适合照片类背景
- **PNG** - 适合需要透明背景的场景

## 命名规范

- 使用 **kebab-case** 命名
- 文件名应描述背景用途（如：`login-background.jpg`、`hero-background.webp`）

## 文件大小建议

- 单个背景图建议不超过 **500KB**
- 大背景图建议使用压缩工具优化

## 使用示例

````typescript
import loginBg from '@/assets/images/backgrounds/login-background.jpg'

export default {
  setup() {
    return {
      loginBg,
    }
  },
}
```

```vue
<template>
  <div :style="{ backgroundImage: `url(${loginBg})` }">
    <!-- 内容 -->
  </div>
</template>
```

```css
.background {
  background-image: url('@/assets/images/backgrounds/login-background.jpg');
  background-size: cover;
  background-position: center;
}
```

## 优化建议

1. **使用 WebP 格式**：体积更小，加载更快
2. **图片压缩**：使用工具压缩背景图
3. **响应式背景**：使用 CSS `background-size: cover` 适配不同屏幕
4. **懒加载**：非首屏背景图使用懒加载
````
