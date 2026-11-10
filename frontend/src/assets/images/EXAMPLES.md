# 资源使用示例

本文档提供项目中资源文件的使用示例和最佳实践。

## 图片资源使用示例

### 1. Logo使用

````vue
<template>
  <div class="header">
    <img :src="logo" alt="App Logo" class="logo" />
  </div>
</template>

<script setup lang="ts">
import logo from '@/assets/images/logos/app-logo.png'
</script>

<style scoped>
.logo {
  height: 40px;
  width: auto;
}
</style>
```text ### 2. 图标使用 #### 方式1：使用本地SVG图标 ```vue
<template>
  <button>
    <img :src="homeIcon" alt="Home" class="icon" />
    首页
  </button>
</template>

<script setup lang="ts">
import homeIcon from '@/assets/images/icons/home-icon.svg'
</script>

<style scoped>
.icon {
  width: 20px;
  height: 20px;
  vertical-align: middle;
}
</style>
```text #### 方式2：使用Element Plus Icons（推荐） ```vue
<template>
  <el-button>
    <el-icon><HomeFilled /></el-icon>
    首页
  </el-button>
</template>

<script setup lang="ts">
import { HomeFilled } from '@element-plus/icons-vue'
</script>
```text ### 3. 背景图使用 ```vue
<template>
  <div class="hero-section" :style="{ backgroundImage: `url(${heroBg})` }">
    <h1>欢迎</h1>
  </div>
</template>

<script setup lang="ts">
import heroBg from '@/assets/images/backgrounds/hero-background.webp'
</script>

<style scoped>
.hero-section {
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  min-height: 500px;
}
</style>
```text ### 4. 懒加载图片 ```vue
<template>
  <!-- 使用v-lazy指令实现懒加载 -->
  <img v-lazy="largeImage" alt="Large Image" class="lazy-image" />
</template>

<script setup lang="ts">
import largeImage from '@/assets/images/photos/large-photo.jpg'
</script>

<style scoped>
.lazy-image {
  width: 100%;
  height: auto;
}
</style>
```text ## 字体使用示例 ### 1. 基础使用 字体已通过 `fonts.css` 自动加载，直接使用CSS变量： ```vue
<template>
  <div class="content">
    <h1 class="title">标题</h1>
    <p class="text">正文内容</p>
    <p class="bold-text">加粗文本</p>
  </div>
</template>

<style scoped>
.content {
  font-family: var(--font-family-base);
}

.title {
  font-family: var(--font-family-base);
  font-weight: 700; /* Bold */
  font-size: 24px;
}

.text {
  font-family: var(--font-family-base);
  font-weight: 400; /* Regular */
  font-size: 16px;
}

.bold-text {
  font-family: var(--font-family-base);
  font-weight: 700; /* Bold */
}
</style>
```text ### 2. 全局字体设置 在 `variables.css` 中已定义字体变量，可以在任何地方使用： ```css /*
使用默认字体 */ .my-component { font-family: var(--font-family-base); } /* 使用等宽字体 */
.code-block { font-family: var(--font-family-mono); } ```text ## 资源优化建议 ### 1. 图片优化 -
**使用WebP格式**：现代浏览器支持，体积更小 -
**图片压缩**：构建时自动压缩（已配置vite-plugin-imagemin） - **懒加载**：大图片使用 `v-lazy` 指令 -
**响应式图片**：使用 `srcset` 提供不同尺寸 ### 2. 字体优化 -
**字体子集化**：只包含需要的字符（可选） - **预加载**：关键字体使用 `
<link rel="preload" />
````
