# photo-placeholder.jpg

这是一个占位图片文件。

**尺寸**: 1200x800
**格式**: JPG

## 使用方法

### 方案1：使用占位图片API（开发阶段）

在开发环境中，可以使用占位图片API：

````typescript
// 开发环境
const imageUrl = import.meta.env.DEV
  ? `https://via.placeholder.com/1200x800`
  : '/img/photo-placeholder.jpg'
```

### 方案2：生成真实占位图片

使用以下命令生成真实的占位图片：

```bash
# 使用ImageMagick
convert -size 1200x800 xc:#f3f4f6 -pointsize 24 -fill #9ca3af -gravity center -annotate +0+0 "1200x800" photo-placeholder.jpg

# 或使用sharp库（Node.js）
node -e "const sharp = require('sharp'); sharp({create: {width: 1200, height: 800, channels: 3, background: {r: 243, g: 244, b: 246}}}).png().toFile('photo-placeholder.jpg')"
```

## 注意事项

- 此文件仅用于开发和测试阶段
- 生产环境应替换为实际的图片资源
- 占位图片不应提交到版本控制系统（建议添加到.gitignore）
````
