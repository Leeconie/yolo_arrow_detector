# Assets Styles 静态资源样式

静态资源样式模块提供CSS变量、通用样式等。

## 目录结构

````plaintext
assets/
├── styles/           # 样式文件
│   ├── variables.css    # CSS变量
│   ├── common.css       # 通用样式
│   └── index.css        # 样式入口
├── images/          # 图片资源
└── fonts/          # 字体文件
```

## 模块说明

### CSS变量 (variables.css)

定义系统的CSS变量，包括：

- 颜色变量（主题色、文本色、背景色等）
- 尺寸变量（字体大小、间距、圆角等）
- 字体变量（字体族、字重等）

### 通用样式 (common.css)

定义通用的样式规则，包括：

- 重置样式（normalize）
- 通用工具类
- 全局样式

### 样式入口 (index.css)

统一导入所有样式文件。

## 使用示例

```css
/* 使用CSS变量 */
.element {
  color: var(--color-primary);
  font-size: var(--font-size-base);
  padding: var(--spacing-md);
}
```

## 依赖关系

- 无依赖
- 被所有组件和页面使用
````
