# 照片目录

## 目录用途

存放真实场景照片，如团队照片、办公室照片、产品照片等。

## 推荐格式

- **JPG/JPEG** - 适合照片，体积相对较小
- **WebP** - 现代格式，体积更小，优先使用

## 命名规范

- 使用 **kebab-case** 命名
- 文件名应描述照片内容（如：`team-photo.jpg`、`office-photo.webp`）

## 文件大小建议

- 单个照片建议不超过 **2MB**
- 建议使用压缩工具优化照片

## 使用示例

````typescript
import teamPhoto from '@/assets/images/photos/team-photo.jpg'

export default {
  setup() {
    return {
      teamPhoto,
    }
  },
}
```

```vue
<template>
  <img :src="teamPhoto" alt="Team Photo" />
</template>
```

## 优化建议

1. **图片压缩**：使用工具压缩照片（如：TinyPNG、ImageOptim）
2. **响应式图片**：使用 `srcset` 提供不同尺寸的照片
3. **懒加载**：非首屏照片使用懒加载指令 `v-lazy`
4. **格式选择**：优先使用 WebP 格式

## 注意事项

1. **版权问题**：确保照片有使用权限
2. **隐私保护**：涉及人物的照片需获得授权
3. **文件大小**：大照片必须压缩后再使用
````
