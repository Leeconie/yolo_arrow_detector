# 主题切换模块开发文档

## 一、模块概述

### 1.1 功能描述

主题切换模块负责实现应用的浅色/深色主题切换功能，包括主题状态管理、主题切换组件、全局样式变量配置和主题偏好持久化存储。

### 1.2 适用场景

- 用户切换应用主题
- 主题偏好持久化
- 全局样式同步更新

### 1.3 技术栈版本

- **Vue**: 3.5.26
- **Pinia**: 3.0.4
- **Tailwind CSS**: 3.4.10

## 二、目录结构

本模块创建的目录和文件：

```text
src/modules/common/theme/
├── components/
│   └── ThemeSwitch.vue         # 主题切换组件
└── composables/
    └── useTheme.ts             # 主题相关组合式函数
```

## 三、技术实现

### 3.1 主题配置

- 在Tailwind配置文件中定义light、dark两套主题变量
- 使用CSS变量实现主题切换

### 3.2 状态管理

- 使用themeStore管理主题状态
- 包含theme（'light'|'dark'）和toggleTheme方法

### 3.3 主题切换组件

- 图标按钮（太阳/月亮切换）
- 绑定toggleTheme方法
- 更新html根元素的data-theme属性

### 3.4 持久化

- 切换主题时将theme值存入localStorage
- 页面初始化时读取localStorage值
- 无值则默认light

## 四、接口定义

本模块不涉及API接口调用。

## 五、组件说明

### 5.1 ThemeSwitch.vue

**Props**: 无

**Events**: 无

**功能**: 主题切换按钮组件，点击切换主题

## 六、开发要点

1. 所有页面样式需基于主题变量编写
2. 避免硬编码颜色值
3. 主题切换需同步更新所有页面

## 七、测试要求

- 单元测试：测试主题切换逻辑、持久化功能
- 视觉测试：验证主题切换效果

## 八、依赖关系

- 依赖core模块：使用themeStore（已在core模块中创建基础结构）
