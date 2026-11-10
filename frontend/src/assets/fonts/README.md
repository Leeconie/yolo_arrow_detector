# 字体资源目录

## 目录用途

存放自定义字体文件，用于项目中的文字显示。

## 支持的文件格式

- **WOFF2** - 优先使用，现代格式，体积最小
- **WOFF** - 备选格式，兼容性好
- **TTF** - 传统格式，兼容性最好但体积较大
- **OTF** - OpenType 格式

## 命名规范

- 使用字体名称命名（如：`inter-regular.woff2`、`inter-bold.woff2`）
- 包含字重信息（如：`regular`、`bold`、`medium`）

## 文件大小建议

- 单个字体文件建议不超过 **5MB**
- 建议使用字体子集化减少体积

## 当前已配置的字体

项目已配置 **Inter** 字体，包含以下字重：

- **Regular (400)** - `inter-regular.woff2`
- **Medium (500)** - `inter-medium.woff2`
- **Bold (700)** - `inter-bold.woff2`

字体定义位于 `src/assets/styles/fonts.css`，已自动导入到样式入口文件。

## 使用示例

### 在 CSS 中使用（推荐）

字体已通过 `fonts.css` 自动加载，直接使用CSS变量：

````css
.text {
  font-family: var(--font-family-base); /* Inter字体 */
  font-weight: 400; /* Regular */
}

.medium-text {
  font-family: var(--font-family-base);
  font-weight: 500; /* Medium */
}

.bold-text {
  font-family: var(--font-family-base);
  font-weight: 700; /* Bold */
}
```

### 在组件中使用

```vue
<template>
  <div class="text">这是Regular字重</div>
  <div class="medium-text">这是Medium字重</div>
  <div class="bold-text">这是Bold字重</div>
</template>

<style scoped>
.text {
  font-family: var(--font-family-base);
  font-weight: 400;
}
.medium-text {
  font-family: var(--font-family-base);
  font-weight: 500;
}
.bold-text {
  font-family: var(--font-family-base);
  font-weight: 700;
}
</style>
```

### 手动定义字体（高级用法）

如果需要添加新的字体或字重，可以在 `fonts.css` 中添加：

```css
@font-face {
  font-family: 'Inter';
  src: url('@/assets/fonts/inter-regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
```

## 优化建议

1. **字体子集化**：只包含需要的字符，减少文件体积
2. **使用 WOFF2**：优先使用 WOFF2 格式
3. **font-display: swap**：使用 `swap` 值避免文字闪烁
4. **预加载**：关键字体使用 `<link rel="preload">` 预加载

## 字体子集化工具

- **Font Squirrel** - 在线字体生成器
- **Glyphhanger** - 命令行工具
- **pyftsubset** - Python 工具

## 注意事项

1. **版权问题**：确保字体有商业使用许可
2. **文件大小**：大字体文件必须进行子集化
3. **加载性能**：使用 `font-display: swap` 优化加载体验
````
