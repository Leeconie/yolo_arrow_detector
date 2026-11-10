# assets 目录说明

## 目录用途

`src/assets` 目录用于存放**需要经过 Vite 处理的资源**。这些资源会被 Vite 处理、优化、打包，并支持代码分割和按需加载。

## 与 public 的区别

| 特性     | src/assets                   | public                             |
| -------- | ---------------------------- | ---------------------------------- |
| 处理方式 | 经过 Vite 处理、优化、打包   | 直接复制，不经过 Vite 处理         |
| 引用方式 | 使用 import 导入             | 使用绝对路径 `/favicon.ico`        |
| 适用场景 | 组件中使用的图片、样式文件等 | favicon、robots.txt、manifest.json |

## 应该放在这里的资源

- **图片资源** - 组件中使用的图片（PNG、JPG、SVG、WebP 等）
- **字体文件** - 自定义字体（WOFF2、WOFF、TTF 等）
- **样式文件** - CSS 样式文件
- **视频资源** - 视频文件（MP4、WebM 等，可选）
- **音频资源** - 音频文件（MP3、OGG 等，可选）
- **数据文件** - 静态数据文件（JSON、YAML 等，可选）

## 使用示例

### 在组件中引用图片

````typescript
import logo from '@/assets/images/logos/app-logo.png'
import homeIcon from '@/assets/images/icons/home-icon.svg'

export default {
  setup() {
    return {
      logo,
      homeIcon,
    }
  },
}
```

```vue
<template>
  <img :src="logo" alt="App Logo" />
  <img :src="homeIcon" alt="Home Icon" />
</template>
```

### 在 CSS 中引用资源

```css
.background {
  background-image: url('@/assets/images/backgrounds/bg.jpg');
}
```

### 使用字体

字体已通过 `fonts.css` 自动加载，无需手动导入。在CSS中直接使用：

```css
.text {
  font-family: var(--font-family-base); /* 使用Inter字体 */
  font-weight: 400; /* Regular */
}

.bold-text {
  font-family: var(--font-family-base);
  font-weight: 700; /* Bold */
}
```

### 在 JavaScript 中动态加载字体（高级用法）

```typescript
import fontUrl from '@/assets/fonts/inter-regular.woff2'

const fontFace = new FontFace('Inter', `url(${fontUrl})`)
document.fonts.add(fontFace)
```

## 目录结构

```text
src/assets/
├── README.md              # 本文件
├── images/                # 图片资源
│   ├── icons/            # 图标
│   ├── logos/            # Logo
│   ├── backgrounds/      # 背景图
│   ├── illustrations/     # 插画
│   └── photos/           # 照片
├── fonts/                # 字体文件
├── styles/               # 样式文件（已存在）
├── videos/               # 视频资源（可选）
├── audios/               # 音频资源（可选）
└── data/                 # 静态数据文件（可选）
```

## 注意事项

1. **命名规范**：使用 kebab-case 命名（如：user-avatar.png）
2. **文件大小**：
   - 图片：建议单张不超过 2MB
   - 字体：建议单个不超过 5MB
   - 视频：建议单个不超过 10MB
1. **格式选择**：
   - 图片：优先使用 WebP，其次 PNG/JPG
   - 字体：优先使用 WOFF2，其次 WOFF
1. **优化建议**：
   - 大图片使用懒加载
   - 字体使用子集化减少体积
   - 视频使用压缩格式

## 路径别名

项目配置了路径别名 `@`，指向 `src` 目录，因此可以使用：

```typescript
import logo from '@/assets/images/logos/logo.png'
```

而不需要：

```typescript
import logo from '../../assets/images/logos/logo.png'
```text
````
