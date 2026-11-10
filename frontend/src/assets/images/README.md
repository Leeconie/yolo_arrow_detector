# 图片资源目录

## 目录用途

存放项目中使用的所有图片资源，包括图标、Logo、背景图、插画、照片等。

## 支持的文件格式

- **PNG** - 支持透明背景，适合图标、Logo
- **JPG/JPEG** - 适合照片、复杂图片
- **SVG** - 矢量图，适合图标、简单图形
- **WebP** - 现代格式，体积小，优先使用
- **GIF** - 动画图片

## 命名规范

- 使用 **kebab-case** 命名（如：`user-avatar.png`）
- 文件名应具有描述性（如：`login-background.jpg`）
- 避免使用中文和特殊字符

## 文件大小建议

- 单张图片建议不超过 **2MB**
- 图标建议不超过 **100KB**
- 背景图建议不超过 **500KB**

## 子目录说明

### icons/

存放图标文件，通常为小尺寸图片（16x16、24x24、32x32 等）。

**示例**：

- `home-icon.svg`
- `user-icon.png`
- `settings-icon.svg`

### logos/

存放 Logo 文件，包括品牌 Logo、应用 Logo 等。

**示例**：

- `app-logo.png`
- `brand-logo.svg`
- `footer-logo.png`

### backgrounds/

存放背景图片，用于页面背景、卡片背景等。

**示例**：

- `login-background.jpg`
- `hero-background.webp`
- `card-background.png`

### illustrations/

存放插画、装饰性图片。

**示例**：

- `empty-state-illustration.svg`
- `error-illustration.png`
- `success-illustration.svg`

### photos/

存放照片、真实场景图片。

**示例**：

- `team-photo.jpg`
- `office-photo.jpg`
- `product-photo.jpg`

## 使用示例

````typescript
// 在组件中导入
import logo from '@/assets/images/logos/app-logo.png'
import icon from '@/assets/images/icons/home-icon.svg'

export default {
  setup() {
    return {
      logo,
      icon,
    }
  },
}
```

```vue
<template>
  <img :src="logo" alt="App Logo" />
  <img :src="icon" alt="Home Icon" />
</template>
```

## 优化建议

1. **使用 WebP 格式**：现代浏览器支持，体积更小
2. **图片压缩**：使用工具压缩图片（如：TinyPNG）
3. **懒加载**：大图片使用懒加载指令 `v-lazy`
4. **响应式图片**：使用 `srcset` 提供不同尺寸的图片
````
