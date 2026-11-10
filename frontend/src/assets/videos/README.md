# 视频资源目录

## 目录用途

存放项目中使用的视频文件，如介绍视频、演示视频等。

## 支持的文件格式

- **MP4** - 最常用格式，兼容性好
- **WebM** - 现代格式，体积更小

## 命名规范

- 使用 **kebab-case** 命名
- 文件名应描述视频内容（如：`intro-video.mp4`、`demo-video.webm`）

## 文件大小建议

- 单个视频建议不超过 **10MB**
- 大视频建议使用压缩工具优化

## 使用示例

````vue
<template>
  <video controls>
    <source src="@/assets/videos/intro-video.mp4" type="video/mp4" />
    <source src="@/assets/videos/intro-video.webm" type="video/webm" />
    您的浏览器不支持视频播放
  </video>
</template>
```text ```typescript import introVideo from '@/assets/videos/intro-video.mp4' export default {
setup() { return { introVideo, } }, } ```text ## 优化建议 1.
**视频压缩**：使用工具压缩视频（如：HandBrake、FFmpeg） 2. **格式选择**：提供 MP4 和 WebM 两种格式
1. **懒加载**：非首屏视频使用懒加载 4. **预加载控制**：使用 `preload="none"` 避免自动加载 ##
注意事项 1. **文件大小**：大视频必须压缩后再使用 2. **版权问题**：确保视频有使用权限 3.
**加载性能**：视频文件较大，注意加载性能影响
````
