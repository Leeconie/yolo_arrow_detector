# app-logo-placeholder.png

这是一个占位图片文件。

**尺寸**: 200x60
**格式**: PNG

## 使用方法

### 方案1：使用占位图片API（开发阶段）

在开发环境中，可以使用占位图片API：

````typescript
// 开发环境
const imageUrl = import.meta.env.DEV
  ? `https://via.placeholder.com/200x60`
  : '/img/app-logo-placeholder.png'
```

### 方案2：生成真实占位图片

使用以下命令生成真实的占位图片：

```bash
# 使用ImageMagick
convert -size 200x60 xc:#f3f4f6 -pointsize 24 -fill #9ca3af -gravity center -annotate +0+0 "200x60" app-logo-placeholder.png

# 或使用sharp库（Node.js）
node -e "const sharp = require('sharp'); sharp({create: {width: 200, height: 60, channels: 3, background: {r: 243, g: 244, b: 246}}}).png().toFile('app-logo-placeholder.png')"
```

## 注意事项

- 此文件仅用于开发和测试阶段
- 生产环境应替换为实际的图片资源
- 占位图片不应提交到版本控制系统（建议添加到.gitignore）
````
