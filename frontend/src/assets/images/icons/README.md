# 图标目录

## 目录用途

存放项目中使用的图标文件，通常为小尺寸图片（16x16、24x24、32x32、48x48 等）。

## 推荐格式

- **SVG** - 优先使用，矢量图，可缩放，体积小
- **PNG** - 适合复杂图标，支持透明背景

## 命名规范

- 使用 **kebab-case** 命名
- 文件名应描述图标功能（如：`home-icon.svg`、`user-icon.png`）
- 避免使用通用名称（如：`icon1.png`）

## 文件大小建议

- 单个图标建议不超过 **100KB**
- SVG 图标通常只有几 KB

## 当前已配置的图标

项目已下载以下 Heroicons 图标（SVG格式）：

- `home-icon.svg` - 首页图标
- `user-icon.svg` - 用户图标
- `settings-icon.svg` - 设置图标
- `search-icon.svg` - 搜索图标
- `menu-icon.svg` - 菜单图标
- `close-icon.svg` - 关闭图标

## 使用示例

### 在组件中使用SVG图标

````typescript
import homeIcon from '@/assets/images/icons/home-icon.svg'
import userIcon from '@/assets/images/icons/user-icon.svg'

export default {
  setup() {
    return {
      homeIcon,
      userIcon,
    }
  },
}
```

```vue
<template>
  <img :src="homeIcon" alt="Home" class="icon" />
  <img :src="userIcon" alt="User" class="icon" />
</template>

<style scoped>
.icon {
  width: 24px;
  height: 24px;
}
</style>
```

### 使用Element Plus Icons（推荐）

项目已集成 Element Plus Icons，推荐使用组件方式：

```vue
<template>
  <el-icon><HomeFilled /></el-icon>
  <el-icon><User /></el-icon>
</template>

<script setup lang="ts">
import { HomeFilled, User } from '@element-plus/icons-vue'
</script>
```

## 图标库推荐

如果需要大量图标，建议使用图标库：

- **Element Plus Icons** - 项目已集成，推荐使用
- **Heroicons** - 已下载部分SVG图标到本地
- **Font Awesome** - 流行的图标库
- **Material Icons** - Google 的图标库

## 获取更多图标

如果需要更多 Heroicons 图标，可以：

1. 访问 [Heroicons GitHub](https://github.com/tailwindlabs/heroicons)
2. 下载需要的SVG文件
3. 放置到 `src/assets/images/icons/` 目录
4. 使用 kebab-case 命名（如：`arrow-right-icon.svg`）

## 注意事项

1. **保持一致性**：使用统一的图标风格
2. **尺寸规范**：建议使用标准尺寸（16、24、32、48 等）
3. **颜色规范**：SVG 图标建议使用当前主题色
````
